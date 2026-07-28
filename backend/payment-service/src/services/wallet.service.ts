// backend/payment-service/src/services/wallet.service.ts
// ============================================================
// Wallet balances, withdrawals (Flutterwave Transfers) and auto-payout.
//
// available = Σ RELEASED credits to the user  −  Σ withdrawals (PENDING+SUCCESS)
// locked    = Σ HELD payments still inside their confirmation window
//
// SCHEMA NOTES (why the earlier version failed to compile):
//  • PaymentStatus has no COMPLETED — successful money movement is SUCCESS.
//  • flutterwaveConfig keys are FLUTTERWAVE_SECRET_KEY / _PUBLIC_KEY / _BASE_URL.
//  • _sum can be undefined on aggregate results — guarded below.
// ============================================================
import axios from "axios";
import { randomBytes } from "crypto";
import { prisma } from "@newcondo/db";
import {
  badRequest, badGateway, notFound,
  flutterwaveConfig, sendBrandedEmail, EmailTemplates, publishNotification,
} from "@newcondo/backend-shared";

const FLW_BASE = flutterwaveConfig.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3";
const flwAuth = { Authorization: `Bearer ${flutterwaveConfig.FLUTTERWAVE_SECRET_KEY}` };

export interface WalletSummary {
  available: number;
  locked: number;
  autoPayout: string;
  bank: string | null;
}

export async function getWallet(userId: string): Promise<WalletSummary> {
  const [released, withdrawn, held, user] = await Promise.all([
    prisma.payment.aggregate({
      where: { userId, status: "RELEASED", paymentType: { in: ["RENT_RELEASE", "AGENT_COMMISSION", "PROPERTY_MARKING"] } },
      _sum: { ownerAmount: true, amount: true },
    }),
    prisma.payment.aggregate({
      where: { userId, paymentType: "WITHDRAWAL", status: { in: ["PENDING", "SUCCESS"] } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({ where: { userId, status: "HELD" }, _sum: { amount: true } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        autoPayoutMode: true,
        bankAccounts: { where: { isDefault: true }, select: { bankName: true, accountNumber: true }, take: 1 },
      },
    }),
  ]);

  const credits = Number(released._sum?.ownerAmount ?? released._sum?.amount ?? 0);
  const paidOut = Number(withdrawn._sum?.amount ?? 0);
  const bank = user?.bankAccounts[0];

  return {
    available: Math.max(0, credits - paidOut),
    locked: Number(held._sum?.amount ?? 0),
    autoPayout: user?.autoPayoutMode ?? "OFF",
    bank: bank ? `${bank.bankName} ••${bank.accountNumber.slice(-4)}` : null,
  };
}

/** Withdraw to the DEFAULT bank account. Rolls the row back to FAILED if
    Flutterwave rejects, so a failed transfer never eats the balance. */
export async function withdraw(userId: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) throw badRequest("Enter a valid amount");

  const [wallet, account] = await Promise.all([
    getWallet(userId),
    prisma.bankAccount.findFirst({ where: { userId, isDefault: true } }),
  ]);
  if (!account) throw badRequest("Add a payout bank account first");
  if (amount > wallet.available) throw badRequest(`You can withdraw up to ₦${wallet.available.toLocaleString("en-NG")}`);

  const reference = `NC-WD-${Date.now()}-${randomBytes(4).toString("hex")}`;
  const payment = await prisma.payment.create({
    data: {
      userId, amount, paymentType: "WITHDRAWAL", status: "PENDING",
      flutterwaveRef: reference,
      description: `Withdrawal to ${account.bankName} ••${account.accountNumber.slice(-4)}`,
    },
  });

  try {
    const res = await axios.post(
      `${FLW_BASE}/transfers`,
      {
        account_bank: account.bankCode,
        account_number: account.accountNumber,
        amount,
        currency: "NGN",
        reference,
        narration: "Newcondo payout",
      },
      { headers: flwAuth, timeout: 20_000 }
    );
    if (res.data?.status !== "success") throw new Error(res.data?.message ?? "Transfer rejected");
  } catch {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    throw badGateway("Transfer could not be initiated — your balance was not touched");
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  if (user?.email) {
    await sendBrandedEmail(user.email, EmailTemplates.withdrawalInitiated({
      name: user.name ?? "there", amount, bank: `${account.bankName} ••${account.accountNumber.slice(-4)}`, reference,
    }));
  }
  return { paymentId: payment.id, reference, amount };
}

/** Transfer webhook (NC-WD-*): settle or fail the withdrawal + notify. */
export async function settleWithdrawal(reference: string, ok: boolean): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { flutterwaveRef: reference },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!payment || payment.status !== "PENDING") return; // idempotent — webhooks retry

  await prisma.payment.update({
    where: { flutterwaveRef: reference },
    data: { status: ok ? "SUCCESS" : "FAILED", paidAt: ok ? new Date() : null },
  });

  const amount = Number(payment.amount);
  const name = payment.user.name ?? "there";
  if (ok) {
    await Promise.all([
      publishNotification({
        userId: payment.userId, kind: "wallet", title: "Withdrawal delivered",
        body: `₦${amount.toLocaleString("en-NG")} has arrived at your bank.`,
        to: "/wallet", entityType: "payment", entityId: payment.id,
      }),
      sendBrandedEmail(payment.user.email, EmailTemplates.withdrawalSettled({
        name, amount, bank: payment.description?.replace("Withdrawal to ", "") ?? "your bank",
      })),
    ]);
  } else {
    await Promise.all([
      publishNotification({
        userId: payment.userId, kind: "wallet", title: "Withdrawal failed",
        body: "The transfer was reversed — your balance is intact.",
        to: "/wallet", entityType: "payment", entityId: payment.id,
      }),
      sendBrandedEmail(payment.user.email, EmailTemplates.paymentFailed({
        name, what: "your withdrawal", reason: "The bank rejected the transfer. Your balance was restored.",
      })),
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
