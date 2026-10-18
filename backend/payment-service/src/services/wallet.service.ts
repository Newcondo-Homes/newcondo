// backend/payment-service/src/services/wallet.service.ts
// ============================================================
// Wallet balances, withdrawals (Flutterwave Transfers) and auto-payout.
//
// MONEY CORE: balances are the LEDGER, not a sum over Payment rows.
//   available = balance(user:{id}:available)   — withdrawable now
//   pending   = balance(user:{id}:pending)     — credited, locked (marking hold)
//   locked    = rent of theirs still in the 24h window (display only — that
//               money sits in escrow:rent, not in their wallet yet)
//
// Withdrawal is two-phase so a crash can never lose or double-spend money:
//   1. withdraw()        user:available → transit:payouts   (conditional debit:
//                        two taps racing for the same ₦50,000 cannot both pass)
//                        then ask Flutterwave to transfer.
//      Flutterwave refuses → reverse at once: transit → user:available.
//   2. settleWithdrawal() (transfer webhook)
//        success → transit → world:flutterwave  (money has left)
//        failure → transit → user:available     (money restored)
//
// ++ FLW FEES — Flutterwave's transfer fee (₦10/₦25/₦50 + 7.5% VAT, rounded
// up: ₦11/₦27/₦54) is paid by the user: they withdraw ₦X, the wallet is
// debited ₦X, the bank receives ₦X − fee. Flutterwave debits (X − fee) + its
// fee ≈ X from our balance; the kobo difference lands in platform:processing.
// A failed transfer returns the FULL ₦X — no fee is charged for a failure.
// ============================================================
import axios from "axios";
import { randomBytes } from "crypto";
import { prisma } from "@newcondo/db";
import {
  badRequest, badGateway, notFound,
  flutterwaveConfig, sendBrandedEmail, EmailTemplates, publishNotification,
  ACC, postLedger, balanceOf, statementFor, toKobo, toNaira, InsufficientFundsError,
  getAccountProvider, currentAccountMode, MONEY_COPY,
  payoutBreakdown, minWithdrawalNaira, payoutSettleLegs, FLW_FEES,
} from "@newcondo/backend-shared";

const FLW_BASE = flutterwaveConfig.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3";
const flwAuth = { Authorization: `Bearer ${flutterwaveConfig.FLUTTERWAVE_SECRET_KEY}` };

export interface WalletSummary {
  available: number;
  pending: number;
  locked: number;
  autoPayout: string;
  bank: string | null;
  mode: string;
  title: string;
  note: string;
}

export async function getWallet(userId: string): Promise<WalletSummary> {
  const [available, pending, held, user] = await Promise.all([
    balanceOf(ACC.userAvailable(userId)),
    balanceOf(ACC.userPending(userId)),
    // Rent for THEIR properties still inside the window — shown, not owned yet.
    prisma.payment.aggregate({
      where: { status: "HELD", paymentType: "RENT", rental: { property: { OR: [{ ownerId: userId }, { agentId: userId }] } } },
      _sum: { ownerAmount: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { autoPayoutMode: true, bankAccounts: { where: { isDefault: true }, select: { bankName: true, accountNumber: true }, take: 1 } },
    }),
  ]);
  const bank = user?.bankAccounts[0];
  const mode = currentAccountMode();
  return {
    available: toNaira(available),
    pending: toNaira(pending),
    locked: Number(held._sum?.ownerAmount ?? 0),
    autoPayout: user?.autoPayoutMode ?? "OFF",
    bank: bank ? `${bank.bankName} ••${bank.accountNumber.slice(-4)}` : null,
    mode,
    title: MONEY_COPY[mode].walletTitle,
    note: MONEY_COPY[mode].walletNote,
  };
}

/** GET /payments/wallet/ledger — the wallet statement. */
export async function getWalletStatement(userId: string, page?: number, pageSize?: number) {
  const s = await statementFor(userId, { page, pageSize });
  return { ...s, lines: s.lines.map((l) => ({ ...l, amount: toNaira(l.amountKobo), amountKobo: undefined })) };
}

/** GET /payments/wallet/funding-account — where to send a bank transfer. */
export async function getFundingAccount(userId: string, reference?: string) {
  return getAccountProvider().fundingInstructions(userId, reference ? { reference } : undefined);
}

/** GET /payments/wallet/withdraw/quote?amount= — what lands in the bank. */
export function quoteWithdrawal(amount: number) {
  const b = payoutBreakdown(amount);
  return { ...b, minNaira: minWithdrawalNaira(), feeLabel: "Flutterwave transfer fee" };
}

export async function withdraw(userId: string, amount: number) {
  const min = minWithdrawalNaira();
  if (!Number.isFinite(amount) || amount < min) throw badRequest(`Enter at least ₦${min.toLocaleString("en-NG")} (₦${FLW_FEES.minTransferNaira} minimum transfer + Flutterwave's fee)`);
  const breakdown = payoutBreakdown(amount);
  const account = await prisma.bankAccount.findFirst({ where: { userId, isDefault: true } });
  if (!account) throw badRequest("Add a payout bank account first");

  const kobo = toKobo(amount);
  const reference = `NC-WD-${Date.now()}-${randomBytes(4).toString("hex")}`;
  const bankLabel = `${account.bankName} ••${account.accountNumber.slice(-4)}`;

  let paymentId: string;
  try {
    paymentId = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          userId, amount, processingFee: breakdown.feeNaira, ownerAmount: breakdown.receiveNaira,
          paymentType: "WITHDRAWAL", status: "PENDING", flutterwaveRef: reference,
          description: `Withdrawal to ${bankLabel}`,
        },
        select: { id: true },
      });
      await postLedger(tx, {
        idempotencyKey: `wd-init:${reference}`,
        type: "WITHDRAWAL_INITIATED",
        sourceType: "PAYMENT",
        sourceId: p.id,
        paymentId: p.id,
        memo: `Withdrawal to ${bankLabel}`,
        legs: [{ account: ACC.userAvailable(userId), amountKobo: -kobo }, { account: ACC.payoutsInTransit, amountKobo: kobo }],
      });
      return p.id;
    });
  } catch (e) {
    if (e instanceof InsufficientFundsError) {
      const avail = toNaira(await balanceOf(ACC.userAvailable(userId)));
      throw badRequest(`You can withdraw up to ₦${avail.toLocaleString("en-NG")}`);
    }
    throw e;
  }

  try {
    const res = await axios.post(
      `${FLW_BASE}/transfers`,
      { account_bank: account.bankCode, account_number: account.accountNumber, amount: breakdown.receiveNaira, currency: "NGN", reference, narration: "Newcondo payout", debit_currency: "NGN" },
      { headers: flwAuth, timeout: 20_000 }
    );
    if (res.data?.status !== "success") throw new Error(res.data?.message ?? "Transfer rejected");
  } catch {
    await reverseWithdrawal(reference, "Flutterwave rejected the transfer");
    throw badGateway("Transfer could not be initiated — your balance was not touched");
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  if (user?.email) {
    await sendBrandedEmail(user.email, EmailTemplates.withdrawalInitiated({ name: user.name ?? "there", amount: breakdown.receiveNaira, bank: bankLabel, reference }));
  }
  return { paymentId, reference, amount, feeNaira: breakdown.feeNaira, receiveNaira: breakdown.receiveNaira };
}

async function reverseWithdrawal(reference: string, reason: string) {
  const p = await prisma.payment.findUnique({ where: { flutterwaveRef: reference }, select: { id: true, userId: true, amount: true, status: true } });
  if (!p || p.status !== "PENDING") return;
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: p.id }, data: { status: "FAILED", failureReason: reason } });
    await postLedger(tx, {
      idempotencyKey: `wd-reverse:${reference}`,
      type: "WITHDRAWAL_REVERSED",
      sourceType: "PAYMENT",
      sourceId: p.id,
      paymentId: p.id,
      memo: reason,
      legs: [{ account: ACC.payoutsInTransit, amountKobo: -toKobo(p.amount) }, { account: ACC.userAvailable(p.userId), amountKobo: toKobo(p.amount) }],
    });
  });
}

/** Transfer webhook (NC-WD-*): settle or fail the withdrawal + notify. Idempotent. */
export async function settleWithdrawal(reference: string, ok: boolean, actualFeeNaira?: number | null): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { flutterwaveRef: reference },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!payment || payment.status !== "PENDING") return;

  const amount = Number(payment.amount);
  const fee = Number(payment.processingFee ?? 0);
  const received = Number(payment.ownerAmount ?? amount - fee);
  const name = payment.user.name ?? "there";
  const bank = payment.description?.replace("Withdrawal to ", "") ?? "your bank";
  if (ok) {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: payment.id }, data: { status: "SUCCESS", paidAt: new Date() } });
      await postLedger(tx, {
        idempotencyKey: `wd-settle:${reference}`,
        type: "WITHDRAWAL_SETTLED",
        sourceType: "PAYMENT",
        sourceId: payment.id,
        paymentId: payment.id,
        memo: `Delivered to ${bank}`,
        legs: payoutSettleLegs({
          requestedKobo: toKobo(amount),
          sentKobo: toKobo(received),
          // Flutterwave's reported fee; else assume what we charged the user.
          actualFeeKobo: toKobo(actualFeeNaira ?? fee),
        }),
      });
    });
    await Promise.allSettled([
      publishNotification({ userId: payment.userId, kind: "wallet", title: "Withdrawal delivered", body: `₦${received.toLocaleString("en-NG")} has arrived at your bank${fee ? ` (₦${amount.toLocaleString("en-NG")} − ₦${fee} transfer fee)` : ""}.`, to: "/wallet", entityType: "payment", entityId: payment.id }),
      sendBrandedEmail(payment.user.email, EmailTemplates.withdrawalSettled({ name, amount: received, bank })),
    ]);
  } else {
    await reverseWithdrawal(reference, "The bank rejected the transfer");
    await Promise.allSettled([
      publishNotification({ userId: payment.userId, kind: "wallet", title: "Withdrawal failed", body: "The transfer was reversed — your balance is intact.", to: "/wallet", entityType: "payment", entityId: payment.id }),
      sendBrandedEmail(payment.user.email, EmailTemplates.paymentFailed({ name, what: "your withdrawal", reason: "The bank rejected the transfer. Your balance was restored." })),
    ]);
  }
}

/** OFF | INSTANT | WEEKLY | MONTHLY */
export async function setAutoPayout(userId: string, mode: string) {
  const allowed = ["OFF", "INSTANT", "WEEKLY", "MONTHLY"];
  if (!allowed.includes(mode)) throw badRequest("Unknown auto-payout mode");
  const user = await prisma.user.update({ where: { id: userId }, data: { autoPayoutMode: mode }, select: { autoPayoutMode: true } });
  if (!user) throw notFound("User not found");
  return user;
}

/** Cron executor for auto-payout. INSTANT runs every 15 min, WEEKLY on
 *  Fridays, MONTHLY on the last day. Sweeps the whole available balance. */
export async function runAutoPayouts(mode: "INSTANT" | "WEEKLY" | "MONTHLY"): Promise<{ attempted: number; sent: number }> {
  const min = minWithdrawalNaira();
  const users = await prisma.user.findMany({
    where: { autoPayoutMode: mode, bankAccounts: { some: { isDefault: true } }, ledgerAccounts: { some: { kind: "USER_AVAILABLE", balanceKobo: { gte: BigInt(min) * 100n } } } },
    select: { id: true },
    take: 500,
  });
  let sent = 0;
  for (const u of users) {
    const bal = toNaira(await balanceOf(ACC.userAvailable(u.id)));
    if (bal < min) continue;
    try { await withdraw(u.id, Math.floor(bal)); sent++; } catch (e) { console.error(`[auto-payout] ${u.id}:`, (e as Error).message); }
  }
  return { attempted: users.length, sent };
}
