"use strict";
// backend/shared/src/types/legalDocuments.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionStatus = exports.DocumentCategory = void 0;
var DocumentCategory;
(function (DocumentCategory) {
    DocumentCategory["IDENTITY"] = "IDENTITY";
    DocumentCategory["PROPERTY"] = "PROPERTY";
    DocumentCategory["LEGAL"] = "LEGAL";
    DocumentCategory["BUSINESS"] = "BUSINESS";
    DocumentCategory["CONSENT"] = "CONSENT";
    DocumentCategory["UNDERTAKING"] = "UNDERTAKING";
    DocumentCategory["COMPLIANCE"] = "COMPLIANCE";
})(DocumentCategory || (exports.DocumentCategory = DocumentCategory = {}));
var SubmissionStatus;
(function (SubmissionStatus) {
    SubmissionStatus["PENDING"] = "PENDING";
    SubmissionStatus["SUBMITTED"] = "SUBMITTED";
    SubmissionStatus["VERIFICATION_IN_PROGRESS"] = "VERIFICATION_IN_PROGRESS";
    SubmissionStatus["VERIFIED"] = "VERIFIED";
    SubmissionStatus["REJECTED"] = "REJECTED";
})(SubmissionStatus || (exports.SubmissionStatus = SubmissionStatus = {}));
//# sourceMappingURL=legalDocuments.js.map