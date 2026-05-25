"use strict";
/**
 * Commission-related types for the Payment Confirmation & Release System
 * Location: backend/shared/src/types/commission.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommissionError = exports.CommissionErrorType = exports.PromotionType = exports.CommissionTransferStatus = exports.RecipientType = exports.AgentInvolvementType = void 0;
/**
 * Agent involvement types for commission calculation
*/
var AgentInvolvementType;
(function (AgentInvolvementType) {
    AgentInvolvementType["NO_AGENT"] = "NO_AGENT";
    AgentInvolvementType["LISTING_AGENT"] = "LISTING_AGENT";
    AgentInvolvementType["SUB_AGENT"] = "SUB_AGENT";
})(AgentInvolvementType || (exports.AgentInvolvementType = AgentInvolvementType = {}));
/**
 * Recipient types for commission transfers
 */
var RecipientType;
(function (RecipientType) {
    RecipientType["PLATFORM"] = "PLATFORM";
    RecipientType["LISTING_AGENT"] = "LISTING_AGENT";
    RecipientType["SUB_AGENT"] = "SUB_AGENT";
    RecipientType["PROPERTY_OWNER"] = "PROPERTY_OWNER";
})(RecipientType || (exports.RecipientType = RecipientType = {}));
/**
 * Transfer status
 */
var CommissionTransferStatus;
(function (CommissionTransferStatus) {
    CommissionTransferStatus["PENDING"] = "PENDING";
    CommissionTransferStatus["PROCESSING"] = "PROCESSING";
    CommissionTransferStatus["COMPLETED"] = "COMPLETED";
    CommissionTransferStatus["FAILED"] = "FAILED";
    CommissionTransferStatus["REVERSED"] = "REVERSED";
})(CommissionTransferStatus || (exports.CommissionTransferStatus = CommissionTransferStatus = {}));
/**
 * Agent promotion settings
 */
var PromotionType;
(function (PromotionType) {
    PromotionType["PUBLIC"] = "PUBLIC";
    PromotionType["PERMISSION_BASED"] = "PERMISSION_BASED";
    PromotionType["RESTRICTED"] = "RESTRICTED";
})(PromotionType || (exports.PromotionType = PromotionType = {}));
/**
 * Error types for commission operations
 */
var CommissionErrorType;
(function (CommissionErrorType) {
    CommissionErrorType["INVALID_AMOUNT"] = "INVALID_AMOUNT";
    CommissionErrorType["MISSING_RECIPIENT"] = "MISSING_RECIPIENT";
    CommissionErrorType["VIRTUAL_ACCOUNT_NOT_FOUND"] = "VIRTUAL_ACCOUNT_NOT_FOUND";
    CommissionErrorType["INSUFFICIENT_BALANCE"] = "INSUFFICIENT_BALANCE";
    CommissionErrorType["DISTRIBUTION_FAILED"] = "DISTRIBUTION_FAILED";
    CommissionErrorType["ALREADY_DISTRIBUTED"] = "ALREADY_DISTRIBUTED";
})(CommissionErrorType || (exports.CommissionErrorType = CommissionErrorType = {}));
/**
 * Commission error
 */
class CommissionError extends Error {
    constructor(type, message, details) {
        super(message);
        this.type = type;
        this.details = details;
        this.name = 'CommissionError';
    }
}
exports.CommissionError = CommissionError;
//# sourceMappingURL=commission.js.map