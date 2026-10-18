// backend/shared/src/constants/fees.ts
// ============================================================
// FLUTTERWAVE FEES — the single source of truth for what Flutterwave charges
// Newcondo, and how that cost is passed to the user. Pure (no imports), so the
// frontend shows exactly the figure the backend will charge.
//
// What Flutterwave charges a Nigerian merchant (flutterwave.com/ng/pricing,
// checked Oct 2026 — re-check when they announce changes):
//   COLLECTIONS  (card, Pay-with-Bank-Transfer, USSD, static/virtual account
//                 credits — "all local payment methods")
//                2.0% of the amount (1.4% transaction + 0.6% platform fee)
//                + 7.5% VAT on that fee
//                + ₦50 stamp duty / EMTL on any credit of ₦10,000 or more
//                  (Flutterwave deducts it from the receiver; it can't be
//                   passed through their checkout, so we price it in)
//   TRANSFERS    (payouts to bank accounts — withdrawals, vendor payouts)
//                ₦10 ≤ ₦5,000 · ₦25 ₦5,001–₦50,000 · ₦50 above ₦50,000
//                + 7.5% VAT  →  ₦10.75 · ₦26.875 · ₦53.75
//   REFUNDS      Flutterwave does NOT return its transaction fee on a refund,
//                so the processing fee is non-refundable (like the renter
//                service fee). Sending the refund back costs us AGAIN — we
//                assume a second transaction fee on the refunded amount plus a
//                transfer fee for money leaving Newcondo — so that cost is
//                deducted from the refund (refundBreakdown below).
//   INTERNATIONAL cards are 4.8%. We can't know the card's country before the
//                charge, so we price at the local rate; any shortfall is
//                absorbed in platform:processing and shows on reconciliation.
//
// HOW THE USER PAYS IT
//   Money IN   gross-up: the user is charged base + fee, where fee is the
//              smallest WHOLE NAIRA amount that leaves Newcondo with the full
//              base after Flutterwave takes its cut. Every fee is rounded UP
//              to the next naira (₦0.20 → ₦1, ₦215.40 → ₦216).
//   Money OUT  deducted: the user withdraws ₦X, the bank receives ₦X − fee.
//
// ⚠️ Flutterwave dashboard → Settings → Business preferences → Fee settings:
//    set "Charge me" (merchant bears fees). Our gross-up IS the pass-through.
//    Leaving "customer pays" on makes Flutterwave add its fee on top of ours,
//    charging the user twice. The webhook logs a warning if it detects that.
// ============================================================

export const FLW_FEES = {
  /** false = Newcondo absorbs Flutterwave's fees (no fee lines anywhere). */
  passToUsers: true,
  collection: {
    rate: 0.02,
    /** Flutterwave historically capped local fees at ₦2,000; the current NG
     *  price page shows no cap. Set this if your merchant agreement has one. */
    capNaira: null as number | null,
  },
  vatRate: 0.075,
  stampDuty: { fromNaira: 10_000, amountNaira: 50 },
  transfer: [
    { upToNaira: 5_000, feeNaira: 10 },
    { upToNaira: 50_000, feeNaira: 25 },
    { upToNaira: Number.POSITIVE_INFINITY, feeNaira: 50 },
  ],
  /** Flutterwave's minimum NGN bank payout. */
  minTransferNaira: 100,
  label: "Payment processing (Flutterwave)",
} as const;

const EPS = 1e-9;
const ceilNaira = (x: number) => Math.ceil(x - EPS);

/** What Flutterwave keeps from a collection of `grossNaira` (unrounded). */
export function flutterwaveCollectionCost(grossNaira: number): number {
  if (grossNaira <= 0) return 0;
  let pct = grossNaira * FLW_FEES.collection.rate;
  if (FLW_FEES.collection.capNaira != null) pct = Math.min(pct, FLW_FEES.collection.capNaira);
  const stamp = grossNaira >= FLW_FEES.stampDuty.fromNaira ? FLW_FEES.stampDuty.amountNaira : 0;
  return pct * (1 + FLW_FEES.vatRate) + stamp;
}

export interface ChargeBreakdown {
  /** what Newcondo must receive (rent + service fee, plan price, marking fee…) */
  baseNaira: number;
  /** Flutterwave cost passed to the user, whole naira, rounded up */
  processingFeeNaira: number;
  /** what the user is actually charged */
  totalNaira: number;
}

/** Gross-up for money coming IN. Smallest whole-naira fee F with
 *  F ≥ Flutterwave's cost on (base + F). Converges in a few steps — the cost
 *  only grows with the amount, and the stamp duty jumps once. */
export function withProcessingFee(baseNaira: number): ChargeBreakdown {
  const base = Math.max(0, Math.round(baseNaira * 100) / 100);
  if (!FLW_FEES.passToUsers || base <= 0) return { baseNaira: base, processingFeeNaira: 0, totalNaira: base };
  let fee = ceilNaira(flutterwaveCollectionCost(base));
  for (let i = 0; i < 20; i++) {
    const need = ceilNaira(flutterwaveCollectionCost(base + fee));
    if (need <= fee) break;
    fee = need;
  }
  return { baseNaira: base, processingFeeNaira: fee, totalNaira: Math.round((base + fee) * 100) / 100 };
}

/** Flutterwave's fee (incl. VAT) for SENDING `sentNaira` to a bank, rounded up. */
export function transferFeeFor(sentNaira: number): number {
  const tier = FLW_FEES.transfer.find((t) => sentNaira <= t.upToNaira) ?? FLW_FEES.transfer[FLW_FEES.transfer.length - 1];
  return ceilNaira(tier.feeNaira * (1 + FLW_FEES.vatRate));
}

export interface PayoutBreakdown {
  /** debited from the wallet / revenue */
  requestedNaira: number;
  /** Flutterwave transfer fee, deducted */
  feeNaira: number;
  /** what lands in the bank account */
  receiveNaira: number;
}

/** Money going OUT: the fee comes out of the payout. Picks the tier that
 *  leaves the recipient the most (₦5,010 → fee ₦11, receives ₦4,999). */
export function payoutBreakdown(requestedNaira: number): PayoutBreakdown {
  const req = Math.floor(requestedNaira * 100) / 100;
  if (!FLW_FEES.passToUsers) return { requestedNaira: req, feeNaira: 0, receiveNaira: req };
  const fees = [...new Set(FLW_FEES.transfer.map((t) => ceilNaira(t.feeNaira * (1 + FLW_FEES.vatRate))))].sort((a, b) => a - b);
  for (const f of fees) {
    const sent = Math.round((req - f) * 100) / 100;
    if (sent > 0 && transferFeeFor(sent) === f) return { requestedNaira: req, feeNaira: f, receiveNaira: sent };
  }
  const f = fees[fees.length - 1];
  return { requestedNaira: req, feeNaira: f, receiveNaira: Math.max(0, Math.round((req - f) * 100) / 100) };
}

/** Smallest amount a user can withdraw so the bank still gets Flutterwave's minimum. */
export const minWithdrawalNaira = (): number =>
  FLW_FEES.minTransferNaira + (FLW_FEES.passToUsers ? transferFeeFor(FLW_FEES.minTransferNaira) : 0);

/** Named RentRefundBreakdown — utils/ already exports a RefundBreakdown. */
export interface RentRefundBreakdown {
  /** rent being refunded (service + processing fees are never refunded) */
  rentNaira: number;
  /** Flutterwave's transaction cost on reversing that amount, rounded up */
  reversalFeeNaira: number;
  /** Flutterwave's fee for sending the money out of Newcondo, rounded up */
  transferFeeNaira: number;
  /** reversal + transfer — what the renter bears for the refund */
  refundCostNaira: number;
  /** what actually goes back to the renter */
  refundNaira: number;
}

/** The ONLY refund Newcondo makes: rent, after a valid dispute inside the
 *  confirmation window. The renter bears what the refund costs us:
 *    reversal fee = Flutterwave's collection cost on the rent (2% + VAT
 *                   + stamp duty), rounded up to the naira
 *    transfer fee = Flutterwave's payout fee on what is sent back (₦11/27/54)
 *  e.g. ₦1,000,000 rent → reversal ₦21,550, transfer ₦54 → ₦978,396 back. */
export function refundBreakdown(rentNaira: number): RentRefundBreakdown {
  const rent = Math.max(0, Math.floor(rentNaira * 100) / 100);
  if (!FLW_FEES.passToUsers || rent <= 0) {
    return { rentNaira: rent, reversalFeeNaira: 0, transferFeeNaira: 0, refundCostNaira: 0, refundNaira: rent };
  }
  const reversal = ceilNaira(flutterwaveCollectionCost(rent));
  const out = payoutBreakdown(Math.max(0, rent - reversal));
  const refund = Math.max(0, out.receiveNaira);
  return {
    rentNaira: rent,
    reversalFeeNaira: reversal,
    transferFeeNaira: out.feeNaira,
    refundCostNaira: Math.round((rent - refund) * 100) / 100,
    refundNaira: refund,
  };
}
