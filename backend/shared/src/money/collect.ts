// backend/shared/src/money/collect.ts
// ============================================================
// Booking money that came IN, with Flutterwave's fee accounted to the kobo.
//
// The user paid GROSS = base + processing fee. Flutterwave kept its cost and
// settled the rest. The ledger must say exactly that:
//
//   CHECKOUT  world:flutterwave     −settled      (cash that actually arrived)
//   TRANSFER  suspense:inbound      −gross        (inbound.ts already booked
//                                                  world −settled / processing −fee
//                                                  when the transfer landed)
//             <allocations>         +base         (escrow, revenue, …)
//             user:{payer}:available +overpaid    (bank transfers only)
//             platform:processing    the rest     (fee collected − fee paid)
//
// Balanced by construction, so reconciliation against Flutterwave's real
// balance stays exact whatever Flutterwave's fee turned out to be.
// ============================================================
import { ACC, type FundingSource } from "./accounts";
import { toKobo, type Kobo } from "./kobo";
import type { Leg } from "./ledger";
import { flutterwaveCollectionCost } from "../constants/fees";

export interface CollectionInput {
  via: FundingSource;
  /** what the user paid (gross, incl. processing fee) */
  receivedKobo: Kobo;
  /** what Flutterwave settled to us, when known (verify → amount_settled) */
  settledKobo?: Kobo | null;
  /** what was due (gross); anything above this on a transfer is the payer's */
  dueKobo: Kobo;
  payerId?: string | null;
  /** where the BASE amount goes — must sum to ≤ due */
  allocations: Leg[];
}

export function estimateSettledKobo(receivedKobo: Kobo): Kobo {
  const cost = toKobo(flutterwaveCollectionCost(Number(receivedKobo) / 100));
  return receivedKobo - cost;
}

export function collectionLegs(o: CollectionInput): Leg[] {
  const allocated = o.allocations.reduce((s, l) => s + l.amountKobo, 0n);
  const debitAccount = o.via === "TRANSFER" ? ACC.suspense : ACC.world;
  const debit = o.via === "TRANSFER" ? o.receivedKobo : o.settledKobo ?? estimateSettledKobo(o.receivedKobo);
  const overpaid = o.via === "TRANSFER" && o.payerId && o.receivedKobo > o.dueKobo ? o.receivedKobo - o.dueKobo : 0n;
  const processing = debit - allocated - overpaid;
  return [
    { account: debitAccount, amountKobo: -debit },
    ...o.allocations.filter((l) => l.amountKobo !== 0n),
    ...(overpaid > 0n ? [{ account: ACC.userAvailable(o.payerId!), amountKobo: overpaid }] : []),
    ...(processing !== 0n ? [{ account: ACC.processing, amountKobo: processing }] : []),
  ];
}

/** Flutterwave transaction → what it settled to us, in kobo, when it says. */
export function settledFromFlutterwave(tx: Record<string, any> | null | undefined): Kobo | null {
  if (!tx) return null;
  if (tx.amount_settled != null && Number.isFinite(Number(tx.amount_settled))) return toKobo(Number(tx.amount_settled));
  if (tx.app_fee != null && tx.amount != null) return toKobo(Number(tx.amount) - Number(tx.app_fee));
  return null;
}

/** Money OUT settled: transit → world for what Flutterwave debited
 *  (sent + its fee); the difference vs the fee the user paid → processing. */
export function payoutSettleLegs(o: { requestedKobo: Kobo; sentKobo: Kobo; actualFeeKobo: Kobo }): Leg[] {
  const leftFlutterwave = o.sentKobo + o.actualFeeKobo;
  const processing = o.requestedKobo - leftFlutterwave;
  return [
    { account: ACC.payoutsInTransit, amountKobo: -o.requestedKobo },
    { account: ACC.world, amountKobo: leftFlutterwave },
    ...(processing !== 0n ? [{ account: ACC.processing, amountKobo: processing }] : []),
  ];
}
