// backend/shared/src/referrals/index.ts — public exports (spec §3)
// Re-exported from shared/src/index.ts as a NAMESPACE:
//   import { Referrals } from "@newcondo/backend-shared";
//   Referrals.emitReferralEvent({...})
// A namespace keeps names like REFERRAL_RULES from colliding with the legacy
// constants/referralConstants.ts under `export *`.
import { REFERRAL_RULES } from "./rules";
import { validateRules } from "./validate";

// I6 — refuse to boot on a bad rules.ts edit.
validateRules(REFERRAL_RULES);

export * from "./rule-types";
export * from "./rules";
export * from "./cohorts";
export * from "./limits";
export { validateRules, ReferralConfigError } from "./validate";
export { computeMarginKobo } from "./margin";
export { planReward, resolveExclusive, candidateRules, refereeFor, withinWindow } from "./plan";
export { onBusinessEvent, emitReferralEvent, tryJoinCohort, recheckPendingFunding, cumulativeNetMarginKobo } from "./evaluate";
export { releaseScheduledRewards, expireCredits, voidBySource, clearFraudHold, voidReferral } from "./ledger";
export { reserveCredits, confirmRedemptions, releaseRedemptions, redeemServiceCredit, restoreServiceCredit } from "./redemption";
export { getOrCreateReferralCode, referralLinkFor, recordReferralClick, attributeReferral, applyReferralCode, invitedByLabel, type AttributionInput } from "./attribution";
export { maskName } from "./names";
export { hashId } from "./fraud";
export { programsFor, sprintStatus, rewardText, publicInvitation, type ProgramCard } from "./display";
export { referralOverview, referralList, referralLedgerList } from "./me";
export { adminRules, adminExposure, adminFraudQueue, adminLedgerSearch } from "./admin";
