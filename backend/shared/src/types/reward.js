"use strict";
// backend/shared/src/types/reward.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardCategory = exports.RewardTier = void 0;
var RewardTier;
(function (RewardTier) {
    RewardTier["BRONZE"] = "BRONZE";
    RewardTier["SILVER"] = "SILVER";
    RewardTier["GOLD"] = "GOLD";
    RewardTier["PLATINUM"] = "PLATINUM";
    RewardTier["DIAMOND"] = "DIAMOND";
})(RewardTier || (exports.RewardTier = RewardTier = {}));
var RewardCategory;
(function (RewardCategory) {
    RewardCategory["REFERRAL"] = "REFERRAL";
    RewardCategory["LOYALTY"] = "LOYALTY";
    RewardCategory["MILESTONE"] = "MILESTONE";
    RewardCategory["PROMOTIONAL"] = "PROMOTIONAL";
    RewardCategory["BONUS"] = "BONUS";
})(RewardCategory || (exports.RewardCategory = RewardCategory = {}));
//# sourceMappingURL=reward.js.map