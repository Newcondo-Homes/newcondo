// backend/payment-service/src/services/renterVA.service.ts
// ============================================================
// Renter virtual accounts — the escrow safety layer.
// Flutterwave needs a BVN to mint a PERMANENT virtual account, which is why
// the share-link signup form asks for one (compliance + safety).
//
// SCHEMA NOTE: VirtualAccount has no `kind` column. The "main" account is the
// one with propertyId = null; per-property accounts carry a propertyId.
// Fields are accountNumber / accountName / bankCode / flutterwaveAccountId.
//
// Idempotent: returns the existing account when one is already provisioned.
// The explicit return type keeps tsc from trying to name Prisma's internal
// runtime types (TS2742).
// ============================================================
import axios from "axios";
import { prisma } from "@newcondo/db";
import { badRequest, notFound, unprocessable, flutterwaveConfig } from "@newcondo/backend-shared";

const FLW_BASE = flutterwaveConfig.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3";

export interface EnsuredVirtualAccount {
  created: boolean;
  account: { id: string; accountNumber: string; accountName: string; bankCode: string };
}

export async function ensureRenterVirtualAccount(opts: {
  userId: string;
  bvn?: string;
}): Promise<EnsuredVirtualAccount> {
  // main account = the one not tied to a property
  const existing = await prisma.virtualAccount.findFirst({
    where: { userId: opts.userId, propertyId: null },
    select: { id: true, accountNumber: true, accountName: true, bankCode: true },
  });
  if (existing) return { created: false, account: existing };

  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { id: true, name: true, email: true, phone: true, bvn: true },
  });
  if (!user) throw notFound("User not found");

  const bvn = opts.bvn ?? user.bvn;
  if (!bvn || !/^\d{11}$/.test(bvn)) {
    throw badRequest("A valid 11-digit BVN is required to create your secure payment account");
  }
  // TODO(security): encrypt BVN at rest (pgcrypto or app-level KMS envelope).
  if (opts.bvn && !user.bvn) await prisma.user.update({ where: { id: user.id }, data: { bvn: opts.bvn } });

  const res = await axios.post(
    `${FLW_BASE}/virtual-account-numbers`,
    { email: user.email, bvn, is_permanent: true, tx_ref: `NC-VA-${user.id}`, narration: `${user.name ?? "Newcondo user"} — Newcondo` },
    { headers: { Authorization: `Bearer ${flutterwaveConfig.FLUTTERWAVE_SECRET_KEY}` }, timeout: 20_000 }
  );
  if (res.data?.status !== "success") throw unprocessable("Could not create your secure payment account — check your BVN");

  const d = res.data.data as { account_number: string; bank_name: string; flw_ref?: string; order_ref?: string };
  const account = await prisma.virtualAccount.create({
    data: {
      userId: user.id,
      accountNumber: d.account_number,
      accountName: user.name ?? user.email,
      bankCode: d.bank_name, // Flutterwave returns the bank name here; store as the code/label
      flutterwaveAccountId: d.flw_ref ?? d.order_ref ?? null,
    },
    select: { id: true, accountNumber: true, accountName: true, bankCode: true },
  });
  return { created: true, account };
}
