// backend/payment-service/src/webhooks/chargeHandlers.ts
// ============================================================
// One registry: tx_ref prefix → the code that settles that kind of payment.
//
// Built-ins (this package): NC-SUB- subscriptions · NC-RENT- rent ·
// NC-PSUB- property plans · NC-RENEW- (no-op: the renewal cron already
// settled it synchronously — acting here would extend the period twice).
// Other packages register theirs at startup so payment-service never imports
// them (marking-service imports property-service; a direct import here would
// make the package graph circular):
//
//   // combined-backend/src/server.ts
//   registerChargeHandler("NC-MKFEE-", (ref, paid) => confirmMarkingFeePaid(ref, paid));
//
// A handler receives the VERIFIED amount and HOW the money came in, so the
// ledger debits the right account (world for checkout, suspense for a bank
// transfer that was matched by reference).
// ============================================================
import type { FundingSource } from "@newcondo/backend-shared";

export interface VerifiedPayment {
  /** GROSS the user paid (base + processing fee) */
  amountNaira: number;
  /** ++ FLW FEES — what Flutterwave settled after its fee (checkout only;
   *  transfers settle into suspense at the gross and book the fee there). */
  settledNaira?: number | null;
  currency: string;
  via: FundingSource;
  transactionId: string | null;
  /** set when the money arrived as a bank transfer to the central account */
  inboundTransferId?: string;
  cardToken?: string;
  raw: Record<string, any>;
}

export type ChargeHandler = (txRef: string, paid: VerifiedPayment) => Promise<unknown>;

const handlers = new Map<string, ChargeHandler>();

export function registerChargeHandler(prefix: string, fn: ChargeHandler): void {
  if (!/^NC-[A-Z]+-$/.test(prefix)) throw new Error(`Bad tx_ref prefix: ${prefix}`);
  handlers.set(prefix, fn);
}

export function handlerFor(txRef: string): ChargeHandler | null {
  for (const [prefix, fn] of handlers) if (txRef.startsWith(prefix)) return fn;
  return null;
}

export const registeredPrefixes = () => [...handlers.keys()];
