"use strict";
// backend/shared/src/types/referral.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardStatus = exports.RewardType = exports.ReferralStatus = exports.ReferralType = void 0;
var ReferralType;
(function (ReferralType) {
    ReferralType["OWNER_TO_OWNER"] = "OWNER_TO_OWNER";
    ReferralType["OWNER_TO_AGENT"] = "OWNER_TO_AGENT";
    ReferralType["OWNER_TO_RENTER"] = "OWNER_TO_RENTER";
    ReferralType["AGENT_TO_OWNER"] = "AGENT_TO_OWNER";
    ReferralType["AGENT_TO_AGENT"] = "AGENT_TO_AGENT";
    ReferralType["AGENT_TO_RENTER"] = "AGENT_TO_RENTER";
    ReferralType["RENTER_TO_RENTER"] = "RENTER_TO_RENTER";
})(ReferralType || (exports.ReferralType = ReferralType = {}));
var ReferralStatus;
(function (ReferralStatus) {
    ReferralStatus["PENDING"] = "PENDING";
    ReferralStatus["QUALIFIED"] = "QUALIFIED";
    ReferralStatus["REWARDED"] = "REWARDED";
    ReferralStatus["EXPIRED"] = "EXPIRED";
    ReferralStatus["CANCELLED"] = "CANCELLED";
})(ReferralStatus || (exports.ReferralStatus = ReferralStatus = {}));
var RewardType;
(function (RewardType) {
    RewardType["SERVICE_CREDIT"] = "SERVICE_CREDIT";
    RewardType["SUBSCRIPTION_DISCOUNT"] = "SUBSCRIPTION_DISCOUNT";
    RewardType["RENT_CREDIT"] = "RENT_CREDIT";
    RewardType["COMMISSION_CREDIT"] = "COMMISSION_CREDIT";
    RewardType["MAINTENANCE_VOUCHER"] = "MAINTENANCE_VOUCHER";
    RewardType["CASH_REWARD"] = "CASH_REWARD";
})(RewardType || (exports.RewardType = RewardType = {}));
var RewardStatus;
(function (RewardStatus) {
    RewardStatus["PENDING"] = "PENDING";
    RewardStatus["APPROVED"] = "APPROVED";
    RewardStatus["REJECTED"] = "REJECTED";
    RewardStatus["EXPIRED"] = "EXPIRED";
})(RewardStatus || (exports.RewardStatus = RewardStatus = {}));
//# sourceMappingURL=referral.js.map