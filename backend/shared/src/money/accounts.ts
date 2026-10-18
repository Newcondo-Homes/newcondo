// backend/shared/src/money/accounts.ts
// ============================================================
// Ledger account codes. A code is the account's identity — services never
// pass account ids around, they name the account by what it IS.
//
//   world:flutterwave     cash crossing the boundary (in from payers, out to banks)
//   platform:revenue      Newcondo's earned money (commission, fees, margins)
//   platform:processing   Flutterwave fees: + what users paid us to cover them,
//                         − what Flutterwave actually took. Hovers near ₦0
//                         (rounding-up surplus); goes negative only when a
//                         charge cost more than priced (e.g. a foreign card).
//   escrow:rent           rent inside the 24h confirmation window
//   escrow:marking        marking fees until the job is confirmed / closed
//   transit:payouts       withdrawals + vendor payouts sent, not yet settled
//   suspense:inbound      bank transfers we could not match yet
//   user:{id}:available   withdrawable
//   user:{id}:pending     credited but locked (marking hold)
// ============================================================
import type { LedgerAccountKind } from "@newcondo/db";

export const ACC = {
  world: "world:flutterwave",
  revenue: "platform:revenue",
  processing: "platform:processing",
  rentEscrow: "escrow:rent",
  markingEscrow: "escrow:marking",
  payoutsInTransit: "transit:payouts",
  suspense: "suspense:inbound",
  userAvailable: (userId: string) => `user:${userId}:available`,
  userPending: (userId: string) => `user:${userId}:pending`,
} as const;

/** How cash reached us: card/Inline checkout settles from the world; a bank
 *  transfer to the central account was already posted world → suspense when
 *  it arrived, so matching it moves suspense → wherever it belongs. */
export type FundingSource = "CHECKOUT" | "TRANSFER";
export const fundingAccountFor = (via: FundingSource): string =>
  via === "TRANSFER" ? ACC.suspense : ACC.world;

export interface AccountSpec {
  kind: LedgerAccountKind;
  userId: string | null;
  allowNegative: boolean;
}

/** Parse a code into what the row should look like. Throws on an unknown
 *  shape so a typo can never silently open a new account. */
export function specFor(code: string): AccountSpec {
  if (code === ACC.world) return { kind: "WORLD", userId: null, allowNegative: true };
  if (code === ACC.revenue) return { kind: "PLATFORM", userId: null, allowNegative: false };
  if (code === ACC.processing) return { kind: "PLATFORM", userId: null, allowNegative: true };
  if (code === ACC.rentEscrow || code === ACC.markingEscrow) return { kind: "ESCROW", userId: null, allowNegative: false };
  if (code === ACC.payoutsInTransit) return { kind: "TRANSIT", userId: null, allowNegative: false };
  if (code === ACC.suspense) return { kind: "SUSPENSE", userId: null, allowNegative: false };
  const m = /^user:([A-Za-z0-9_-]+):(available|pending)$/.exec(code);
  if (m) return { kind: m[2] === "available" ? "USER_AVAILABLE" : "USER_PENDING", userId: m[1], allowNegative: false };
  throw new Error(`Unknown ledger account code: ${code}`);
}
