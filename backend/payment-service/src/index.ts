// backend/payment-service/src/index.ts
// Barrel — combined-backend imports payment-service through this file.
// KEEP existing exports (subscriptions/onboarding/webhook) and ADD the
// dashboard money features.

// ---- existing (unchanged) ----
export {
  verifyFlutterwaveTransaction,
  activateSubscription,
  initiateSubscription,
  createFreeRenterSubscription,
} from "./services";
export { startRenewalCron } from "./jobs/renewSubscriptions";
export {
  getOnboardingState,
  assertCanInitiate,
  changeAccountType,
  resetPendingOnboarding,
} from "./services/onboarding.service";
export { flutterwaveWebhook } from "./webhooks";

// ---- dashboard: payout bank accounts (user-managed; VAs are auto-created) ----
export {
  listBankAccounts,
  addBankAccount,
  setDefaultBankAccount,
  deleteBankAccount,
} from "./services/bankAccount.service";

// ---- dashboard: receipts ----
export { buildReceiptData, generateReceiptPdf } from "./services/receipt.service";

// ---- renter rent checkout (escrow + double-booking lock) ----
export { quoteRent, initiateRent, confirmRentPaid } from "./services/rentCheckout.service";

// ---- escrow release + commission split (single money-splitting truth) ----
export { releaseEscrowAndSplit, releaseExpiredEscrows } from "./services/commissionSplit.service";

// ---- bank-change OTP gate + renter escrow virtual account ----
export { requestBankOtp, verifyBankOtp } from "./services/bankAccount.service";
export { ensureRenterVirtualAccount } from "./services/renterVA.service";

// ---- wallet: balances, withdraw, auto-payout ----
export { getWallet, withdraw, setAutoPayout, settleWithdrawal } from "./services/wallet.service";
