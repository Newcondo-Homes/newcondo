// backend/shared/src/money/index.ts — the money core barrel.
// Services import from "@newcondo/backend-shared" (re-exported in src/index.ts).
export { ACC, fundingAccountFor, specFor, type FundingSource } from "./accounts";
export { toKobo, toNaira, floorTo, mulRate, minKobo, maxKobo, formatKobo, type Kobo } from "./kobo";
export {
  postLedger, postLedgerStandalone, ensureAccount, balanceOf, statementFor, isDuplicatePost,
  InsufficientFundsError, UnbalancedLedgerError,
  type Tx, type Leg, type PostInput, type PostResult, type StatementLine,
} from "./ledger";
export {
  getAccountProvider, currentAccountMode,
  type AccountProvider, type FundingInstructions, type WalletProvisionResult,
} from "./providers";
export {
  CHECKOUT_PREFIXES, extractReference, parseInboundCredit, recordInboundTransfer, markInboundMatched, listSuspense,
  type InboundCredit, type RecordedInbound, type SuspenseRow, type SuspensePage,
} from "./inbound";
export { reconcileLedger, type ReconcileReport } from "./reconcile";
export { collectionLegs, payoutSettleLegs, settledFromFlutterwave, estimateSettledKobo, type CollectionInput } from "./collect";
