// backend/payment-service/src/services/renterVA.service.ts
// ============================================================
// Renter wallet — the escrow safety layer at share-link signup.
//
// MONEY CORE: delegates to the account provider.
//   POOLED      opens the renter's ledger wallet; the "account" returned is
//               Newcondo's central account (renters pay rent into escrow
//               through it — the per-payment reference ties it to them).
//   PER_USER_VA mints the renter's own Flutterwave NUBAN from their BVN.
// The BVN is still collected and stored in both modes — it is KYC, and it is
// what PER_USER_VA will need the day the switch flips.
// Signature and return shape unchanged, so the signup flow needs no edits.
// ============================================================
import { prisma } from "@newcondo/db";
import { badRequest, notFound, getAccountProvider, MONEY } from "@newcondo/backend-shared";

export interface EnsuredVirtualAccount {
  created: boolean;
  account: { id: string; accountNumber: string; accountName: string; bankCode: string };
}

export async function ensureRenterVirtualAccount(opts: { userId: string; bvn?: string }): Promise<EnsuredVirtualAccount> {
  const user = await prisma.user.findUnique({ where: { id: opts.userId }, select: { id: true, bvn: true } });
  if (!user) throw notFound("User not found");

  const bvn = opts.bvn ?? user.bvn;
  if (!bvn || !/^\d{11}$/.test(bvn)) {
    throw badRequest("A valid 11-digit BVN is required to create your secure payment account");
  }
  // TODO(security): encrypt BVN at rest (pgcrypto or app-level KMS envelope).
  if (opts.bvn && !user.bvn) await prisma.user.update({ where: { id: user.id }, data: { bvn: opts.bvn } });

  const result = await getAccountProvider().provisionWallet(opts.userId, { bvn });
  if (result.mode === "PER_USER_VA" && result.accountNumber) {
    const va = await prisma.virtualAccount.findUnique({
      where: { accountNumber: result.accountNumber },
      select: { id: true, accountNumber: true, accountName: true, bankCode: true },
    });
    if (va) return { created: result.virtualAccountCreated, account: va };
  }
  const c = MONEY.centralAccount;
  return { created: false, account: { id: "central", accountNumber: c.accountNumber, accountName: c.accountName, bankCode: c.bankName } };
}
