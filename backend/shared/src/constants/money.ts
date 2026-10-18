// backend/shared/src/constants/money.ts
// ============================================================
// MONEY CORE — the numbers and switches behind every naira movement.
// Pure data (no imports), so it is safe in the Next.js client bundle via a
// subpath export, exactly like business.ts and subscriptionPlans.ts.
//
// THE ONE SWITCH: `accountMode`.
//   "POOLED"      (today)  Every payment lands in Newcondo's single central
//                          account. Who owns what is the internal ledger
//                          (backend/shared/src/money). Users see a Newcondo
//                          wallet, not a bank account of their own.
//   "PER_USER_VA" (later)  Flutterwave enables static virtual accounts per
//                          customer. Flip this (or set NC_ACCOUNT_MODE) and run
//                          `payment-service/src/jobs/provisionVirtualAccounts.ts`.
//                          Each wallet gains its own NUBAN as an extra way to pay
//                          in; balances, escrow, splits and payouts are untouched
//                          because they never lived in Flutterwave to begin with.
// ============================================================

export type AccountMode = "POOLED" | "PER_USER_VA";

export const MONEY = {
  accountMode: "POOLED" as AccountMode,

  /** Newcondo's central collection account (Flutterwave static account for
   *  the business). Shown to payers who choose "pay by bank transfer", and the
   *  account inbound-transfer webhooks are matched against. */
  centralAccount: {
    accountNumber: "9709271874",
    accountName: "NEWCONDO LTD OPERATIONS FLW",
    bankName: "Flutterwave MFB (Formerly OK MFB)",
    currency: "NGN",
    createdAt: "2026-09-24",
  },

  /** Flutterwave NGN bank-transfer cap per transaction (support, Aug 2026).
   *  Rent above this must be split or needs a manual limit upgrade. */
  perTransactionMaxNaira: 7_000_000,

  /** A transfer must carry the payment reference in its narration to match
   *  automatically. Unmatched transfers sit in suspense for admin review. */
  transferReferencePattern: "NC-[A-Z]+-[A-Za-z0-9-]+",
  suspenseReviewHours: 48,

  /** Adding a property plan mid-period charges for the days left. Below this
   *  amount the property simply rides free until the next renewal. */
  proration: { minChargeNaira: 100 },

  /** Marking-fee economics on top of MARKING (business.ts). When the owner
   *  misses the confirmation window, the marker is paid in tranches, one per
   *  lapsed window, until fully paid — then the job closes unconfirmed. */
  marking: { lapseTrancheNaira: 1_000 },

  /** Vendor payouts are held this long after a job is marked complete, so the
   *  owner can report an issue (photo evidence + dispute window), then paid
   *  from platform:revenue to the vendor's verified bank account. */
  vendors: { releaseHours: 48 },

  /** Nightly reconciliation: alert when the ledger and Flutterwave's NGN
   *  balance disagree by more than this. */
  reconciliationToleranceNaira: 1,
} as const;

/** Copy the dashboard shows for each mode — one place, so the wallet page and
 *  the emails never describe the money model differently. */
export const MONEY_COPY: Record<AccountMode, { walletTitle: string; walletNote: string; fundingNote: string }> = {
  POOLED: {
    walletTitle: "Newcondo wallet",
    walletNote:
      "Your balance is held in Newcondo's central account and tracked to the kobo in your wallet. Funds unlock after each confirmation window and go to your bank on request.",
    fundingNote:
      "Paying by bank transfer? Send the exact amount shown (it includes Flutterwave's processing fee) to Newcondo's central account and put your payment reference in the narration — that's how we match it to you.",
  },
  PER_USER_VA: {
    walletTitle: "Your Newcondo account",
    walletNote:
      "Your wallet has its own account number. Money sent to it lands in your wallet automatically.",
    fundingNote: "Transfer the exact amount shown (it includes Flutterwave's processing fee) to your personal account number below — no reference needed.",
  },
};
