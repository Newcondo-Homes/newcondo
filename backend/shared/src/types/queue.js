"use strict";
/**
 * File: backend/shared/src/types/queue.ts
 * Shared queue types for Property Marking Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueAction = exports.RotationReason = exports.QueueNotificationType = exports.AgentQueueStatus = void 0;
/**
 * Agent queue status
 */
var AgentQueueStatus;
(function (AgentQueueStatus) {
    AgentQueueStatus["WAITING"] = "WAITING";
    AgentQueueStatus["ACTIVE"] = "ACTIVE";
    AgentQueueStatus["COMPLETED"] = "COMPLETED";
    AgentQueueStatus["EXPIRED"] = "EXPIRED";
    AgentQueueStatus["SKIPPED"] = "SKIPPED";
    AgentQueueStatus["CANCELLED"] = "CANCELLED";
})(AgentQueueStatus || (exports.AgentQueueStatus = AgentQueueStatus = {}));
/**
 * Queue notification types
 */
var QueueNotificationType;
(function (QueueNotificationType) {
    QueueNotificationType["JOB_AVAILABLE"] = "JOB_AVAILABLE";
    QueueNotificationType["POSITION_ASSIGNED"] = "POSITION_ASSIGNED";
    QueueNotificationType["TURN_APPROACHING"] = "TURN_APPROACHING";
    QueueNotificationType["TIME_SLOT_STARTED"] = "TIME_SLOT_STARTED";
    QueueNotificationType["TIME_SLOT_EXPIRING"] = "TIME_SLOT_EXPIRING";
    QueueNotificationType["TIME_SLOT_EXPIRED"] = "TIME_SLOT_EXPIRED";
    QueueNotificationType["JOB_COMPLETED"] = "JOB_COMPLETED";
    QueueNotificationType["JOB_CANCELLED"] = "JOB_CANCELLED";
    QueueNotificationType["PARTIAL_PAYMENT_RELEASED"] = "PARTIAL_PAYMENT_RELEASED";
    QueueNotificationType["FULL_PAYMENT_RELEASED"] = "FULL_PAYMENT_RELEASED";
})(QueueNotificationType || (exports.QueueNotificationType = QueueNotificationType = {}));
/**
 * Rotation reasons
 */
var RotationReason;
(function (RotationReason) {
    RotationReason["TIME_EXPIRED"] = "TIME_EXPIRED";
    RotationReason["AGENT_DECLINED"] = "AGENT_DECLINED";
    RotationReason["AGENT_UNAVAILABLE"] = "AGENT_UNAVAILABLE";
    RotationReason["MANUAL_ROTATION"] = "MANUAL_ROTATION";
})(RotationReason || (exports.RotationReason = RotationReason = {}));
/**
 * Queue actions
 */
var QueueAction;
(function (QueueAction) {
    QueueAction["ADD_AGENT"] = "ADD_AGENT";
    QueueAction["REMOVE_AGENT"] = "REMOVE_AGENT";
    QueueAction["ROTATE_QUEUE"] = "ROTATE_QUEUE";
    QueueAction["CANCEL_JOB"] = "CANCEL_JOB";
    QueueAction["EXTEND_TIME_SLOT"] = "EXTEND_TIME_SLOT";
    QueueAction["MANUAL_ASSIGNMENT"] = "MANUAL_ASSIGNMENT";
})(QueueAction || (exports.QueueAction = QueueAction = {}));
exports.default = {
    AgentQueueStatus,
    QueueNotificationType,
    RotationReason,
    QueueAction,
};
//# sourceMappingURL=queue.js.map