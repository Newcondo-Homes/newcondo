"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkingNotificationType = exports.MARKING_FEES_TYPE = exports.MarkingOption = void 0;
var MarkingOption;
(function (MarkingOption) {
    MarkingOption["SELF"] = "SELF";
    MarkingOption["NEWCONDO_ADMIN"] = "NEWCONDO_ADMIN";
    MarkingOption["SOMEONE_I_KNOW"] = "SOMEONE_I_KNOW";
    MarkingOption["ASSIGN_TO_AGENTS"] = "ASSIGN_TO_AGENTS";
})(MarkingOption || (exports.MarkingOption = MarkingOption = {}));
exports.MARKING_FEES_TYPE = {
    PROPERTY_OWNER_FEE: 20000, // 20,000 NGN
    NEWCONDO_ADMIN_FEE: 25000, // 25,000 NGN
    AGENT_COMMISSION_PERCENTAGE: 0.25, // 25% of property owner fee
    INITIAL_PAYMENT_PERCENTAGE: 0.05, // 5% upfront payment (1,000 NGN)
    CURRENCY: 'NGN',
};
var MarkingNotificationType;
(function (MarkingNotificationType) {
    MarkingNotificationType["JOB_CREATED"] = "JOB_CREATED";
    MarkingNotificationType["JOB_BROADCAST"] = "JOB_BROADCAST";
    MarkingNotificationType["JOB_ASSIGNED"] = "JOB_ASSIGNED";
    MarkingNotificationType["JOB_ACCEPTED"] = "JOB_ACCEPTED";
    MarkingNotificationType["TIME_SLOT_EXPIRING"] = "TIME_SLOT_EXPIRING";
    MarkingNotificationType["TIME_SLOT_EXPIRED"] = "TIME_SLOT_EXPIRED";
    MarkingNotificationType["JOB_COMPLETED"] = "JOB_COMPLETED";
    MarkingNotificationType["JOB_CONFIRMED"] = "JOB_CONFIRMED";
    MarkingNotificationType["JOB_REJECTED"] = "JOB_REJECTED";
    MarkingNotificationType["PAYMENT_RECEIVED"] = "PAYMENT_RECEIVED";
    MarkingNotificationType["COMMISSION_PAID"] = "COMMISSION_PAID";
    MarkingNotificationType["QUEUE_POSITION_UPDATED"] = "QUEUE_POSITION_UPDATED";
})(MarkingNotificationType || (exports.MarkingNotificationType = MarkingNotificationType = {}));
//# sourceMappingURL=marking.js.map