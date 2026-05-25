"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentMarkingStatus = exports.BoundaryErrorType = exports.MarkingSessionStatus = void 0;
var MarkingSessionStatus;
(function (MarkingSessionStatus) {
    MarkingSessionStatus["STARTED"] = "STARTED";
    MarkingSessionStatus["LOCATING"] = "LOCATING";
    MarkingSessionStatus["DRAWING"] = "DRAWING";
    MarkingSessionStatus["VALIDATING"] = "VALIDATING";
    MarkingSessionStatus["COMPLETED"] = "COMPLETED";
    MarkingSessionStatus["CANCELLED"] = "CANCELLED";
    MarkingSessionStatus["FAILED"] = "FAILED";
})(MarkingSessionStatus || (exports.MarkingSessionStatus = MarkingSessionStatus = {}));
var BoundaryErrorType;
(function (BoundaryErrorType) {
    BoundaryErrorType["TOO_LARGE"] = "TOO_LARGE";
    BoundaryErrorType["TOO_SMALL"] = "TOO_SMALL";
    BoundaryErrorType["INVALID_COORDINATES"] = "INVALID_COORDINATES";
    BoundaryErrorType["OUT_OF_BOUNDS"] = "OUT_OF_BOUNDS";
    BoundaryErrorType["OVERLAPS_EXISTING"] = "OVERLAPS_EXISTING";
    BoundaryErrorType["LOW_ACCURACY"] = "LOW_ACCURACY";
    BoundaryErrorType["SUSPICIOUS_SHAPE"] = "SUSPICIOUS_SHAPE";
})(BoundaryErrorType || (exports.BoundaryErrorType = BoundaryErrorType = {}));
var AgentMarkingStatus;
(function (AgentMarkingStatus) {
    AgentMarkingStatus["QUEUED"] = "QUEUED";
    AgentMarkingStatus["ASSIGNED"] = "ASSIGNED";
    AgentMarkingStatus["EN_ROUTE"] = "EN_ROUTE";
    AgentMarkingStatus["AT_LOCATION"] = "AT_LOCATION";
    AgentMarkingStatus["MARKING_IN_PROGRESS"] = "MARKING_IN_PROGRESS";
    AgentMarkingStatus["COMPLETED"] = "COMPLETED";
    AgentMarkingStatus["CANCELLED"] = "CANCELLED";
    AgentMarkingStatus["FAILED"] = "FAILED";
})(AgentMarkingStatus || (exports.AgentMarkingStatus = AgentMarkingStatus = {}));
//# sourceMappingURL=geolocation.js.map