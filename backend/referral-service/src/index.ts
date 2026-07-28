// backend/referral-service/src/index.ts
// Barrel — combined-backend imports referral-service through this file.
export {
  getOrCreateReferralCode,
  getReferralStats,
  attachReferral,
  recordInvite,
  resolvePendingInvite,
  rewardOnFirstTransaction,
  getLeaderboard,
} from "./services/referralService";

export type {
  ReferralStats,
  ReferralHistoryRow,
  Leaderboard,
  LeaderRow,
} from "./services/referralService";