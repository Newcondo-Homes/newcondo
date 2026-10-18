// backend/shared/src/money/providers.ts
// ============================================================
// Account providers — the ONLY code that knows whether Newcondo runs one
// central account or a virtual account per user.
//
// Everything else (escrow, splits, wallets, payouts, referrals) talks to the
// ledger, which is identical in both modes. The provider answers three
// questions:
//   provisionWallet()      what happens when a user becomes eligible for a wallet
//   fundingInstructions()  where a payer should send a bank transfer
//   ownerOfAccountNumber() which user an inbound credit belongs to
//
// TO SWITCH TO PER-USER VIRTUAL ACCOUNTS (once Flutterwave enables it):
//   1. MONEY.accountMode = "PER_USER_VA" in constants/money.ts
//      (or NC_ACCOUNT_MODE=PER_USER_VA in the environment — env wins)
//   2. run payment-service/src/jobs/provisionVirtualAccounts.ts once
// That's all. No balance migration: balances already live in the ledger.
// ============================================================
import axios from "axios";
import { prisma } from "@newcondo/db";
import { flutterwaveConfig } from "../config/flutterwave";
import { MONEY, MONEY_COPY, type AccountMode } from "../constants/money";
import { ACC } from "./accounts";
import { ensureAccount } from "./ledger";

export interface FundingInstructions {
  mode: AccountMode;
  accountNumber: string;
  accountName: string;
  bankName: string;
  /** Narration the payer MUST use (POOLED). null when the account is theirs. */
  reference: string | null;
  /** ++ FLW FEES — exact amount to send for this payment, processing fee
   *  included (Flutterwave deducts its fee from bank-transfer credits too). */
  amountNaira: number | null;
  note: string;
  perTransactionMaxNaira: number;
}

export interface WalletProvisionResult {
  mode: AccountMode;
  /** true when a Flutterwave virtual account was minted by this call. */
  virtualAccountCreated: boolean;
  accountNumber?: string;
}

export interface AccountProvider {
  readonly mode: AccountMode;
  provisionWallet(userId: string, opts?: { bvn?: string }): Promise<WalletProvisionResult>;
  fundingInstructions(userId: string, intent?: { reference: string; amountNaira?: number }): Promise<FundingInstructions>;
  ownerOfAccountNumber(accountNumber: string): Promise<string | null>;
}

/** Both modes open the same two ledger wallets. Idempotent. */
async function openLedgerWallets(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await ensureAccount(tx, ACC.userAvailable(userId));
    await ensureAccount(tx, ACC.userPending(userId));
  });
}

const central = MONEY.centralAccount;

/* ---------------- POOLED: one central account ---------------- */
const pooledProvider: AccountProvider = {
  mode: "POOLED",
  async provisionWallet(userId) {
    await openLedgerWallets(userId);
    return { mode: "POOLED", virtualAccountCreated: false };
  },
  async fundingInstructions(_userId, intent) {
    return {
      mode: "POOLED",
      accountNumber: central.accountNumber,
      accountName: central.accountName,
      bankName: central.bankName,
      reference: intent?.reference ?? null,
      amountNaira: intent?.amountNaira ?? null,
      note: MONEY_COPY.POOLED.fundingNote,
      perTransactionMaxNaira: MONEY.perTransactionMaxNaira,
    };
  },
  async ownerOfAccountNumber() {
    // Every transfer arrives at the same NUBAN — attribution is by reference.
    return null;
  },
};

/* ---------------- PER_USER_VA: one Flutterwave NUBAN per user ---------------- */
const FLW_BASE = flutterwaveConfig.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3";

const perUserVAProvider: AccountProvider = {
  mode: "PER_USER_VA",
  async provisionWallet(userId, opts) {
    await openLedgerWallets(userId);
    // VirtualAccount with propertyId = null is the user's MAIN account.
    const existing = await prisma.virtualAccount.findFirst({
      where: { userId, propertyId: null, isActive: true },
      select: { accountNumber: true },
    });
    if (existing) return { mode: "PER_USER_VA", virtualAccountCreated: false, accountNumber: existing.accountNumber };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true, bvn: true },
    });
    if (!user) throw new Error("User not found");
    const bvn = opts?.bvn ?? user.bvn;
    // Flutterwave will not mint a PERMANENT account without a real BVN. The
    // old code sent "00000000000" — that either fails or creates an account
    // Flutterwave can freeze. Refuse instead; the wallet still works pooled.
    if (!bvn || !/^\d{11}$/.test(bvn)) {
      return { mode: "PER_USER_VA", virtualAccountCreated: false };
    }
    const [first, ...rest] = (user.name ?? "Newcondo User").trim().split(/\s+/);
    const res = await axios.post(
      `${FLW_BASE}/virtual-account-numbers`,
      {
        email: user.email,
        bvn,
        is_permanent: true,
        tx_ref: `NC-VA-${userId}`,
        phonenumber: user.phone ?? undefined,
        firstname: first,
        lastname: rest.join(" ") || first,
        narration: `${user.name ?? "Newcondo user"} - Newcondo`,
      },
      { headers: { Authorization: `Bearer ${flutterwaveConfig.FLUTTERWAVE_SECRET_KEY}` }, timeout: 20_000 }
    );
    if (res.data?.status !== "success") throw new Error(res.data?.message ?? "Virtual account creation failed");
    const d = res.data.data as { account_number: string; bank_name: string; flw_ref?: string; order_ref?: string };
    await prisma.virtualAccount.create({
      data: {
        userId,
        accountNumber: d.account_number,
        accountName: user.name ?? user.email,
        bankCode: d.bank_name,
        flutterwaveAccountId: d.order_ref ?? d.flw_ref ?? null,
      },
    });
    return { mode: "PER_USER_VA", virtualAccountCreated: true, accountNumber: d.account_number };
  },
  async fundingInstructions(userId, intent) {
    const va = await prisma.virtualAccount.findFirst({
      where: { userId, propertyId: null, isActive: true },
      select: { accountNumber: true, accountName: true, bankCode: true },
    });
    // No VA yet (no BVN on file) → fall back to the central account, so the
    // switch never strands a payer.
    if (!va) return pooledProvider.fundingInstructions(userId, intent);
    return {
      mode: "PER_USER_VA",
      accountNumber: va.accountNumber,
      accountName: va.accountName,
      bankName: va.bankCode,
      reference: intent?.reference ?? null,
      amountNaira: intent?.amountNaira ?? null,
      note: MONEY_COPY.PER_USER_VA.fundingNote,
      perTransactionMaxNaira: MONEY.perTransactionMaxNaira,
    };
  },
  async ownerOfAccountNumber(accountNumber) {
    const va = await prisma.virtualAccount.findUnique({ where: { accountNumber }, select: { userId: true } });
    return va?.userId ?? null;
  },
};

export function currentAccountMode(): AccountMode {
  const env = process.env.NC_ACCOUNT_MODE;
  return env === "PER_USER_VA" || env === "POOLED" ? env : MONEY.accountMode;
}

export function getAccountProvider(): AccountProvider {
  return currentAccountMode() === "PER_USER_VA" ? perUserVAProvider : pooledProvider;
}
