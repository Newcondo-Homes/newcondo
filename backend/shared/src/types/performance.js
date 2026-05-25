"use strict";
/**
 * File: backend/shared/src/types/performance.ts
 * Shared performance and reliability scoring types for agents
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardCategory = exports.PIPOutcome = exports.PIPStatus = exports.AlertSeverity = exports.AlertType = exports.MilestoneType = exports.AgentTier = exports.PerformanceTrend = void 0;
/**
 * Performance trend indicator
 */
var PerformanceTrend;
(function (PerformanceTrend) {
    PerformanceTrend["IMPROVING"] = "IMPROVING";
    PerformanceTrend["STABLE"] = "STABLE";
    PerformanceTrend["DECLINING"] = "DECLINING";
    PerformanceTrend["NEW"] = "NEW";
})(PerformanceTrend || (exports.PerformanceTrend = PerformanceTrend = {}));
/**
 * Agent performance badge/tier
 */
var AgentTier;
(function (AgentTier) {
    AgentTier["ROOKIE"] = "ROOKIE";
    AgentTier["STANDARD"] = "STANDARD";
    AgentTier["PROFESSIONAL"] = "PROFESSIONAL";
    AgentTier["EXPERT"] = "EXPERT";
    AgentTier["ELITE"] = "ELITE";
})(AgentTier || (exports.AgentTier = AgentTier = {}));
/**
 * Milestone types
 */
var MilestoneType;
(function (MilestoneType) {
    MilestoneType["FIRST_JOB"] = "FIRST_JOB";
    MilestoneType["FIVE_JOBS"] = "FIVE_JOBS";
    MilestoneType["TEN_JOBS"] = "TEN_JOBS";
    MilestoneType["FIFTY_JOBS"] = "FIFTY_JOBS";
    MilestoneType["HUNDRED_JOBS"] = "HUNDRED_JOBS";
    MilestoneType["PERFECT_MONTH"] = "PERFECT_MONTH";
    MilestoneType["SPEED_DEMON"] = "SPEED_DEMON";
    MilestoneType["QUALITY_CHAMPION"] = "QUALITY_CHAMPION";
    MilestoneType["RELIABLE_STAR"] = "RELIABLE_STAR";
})(MilestoneType || (exports.MilestoneType = MilestoneType = {}));
/**
 * Alert types
 */
var AlertType;
(function (AlertType) {
    AlertType["LOW_COMPLETION_RATE"] = "LOW_COMPLETION_RATE";
    AlertType["HIGH_CANCELLATION_RATE"] = "HIGH_CANCELLATION_RATE";
    AlertType["SLOW_RESPONSE_TIME"] = "SLOW_RESPONSE_TIME";
    AlertType["LOW_QUALITY_RATING"] = "LOW_QUALITY_RATING";
    AlertType["HIGH_NO_SHOW_RATE"] = "HIGH_NO_SHOW_RATE";
    AlertType["DECLINING_PERFORMANCE"] = "DECLINING_PERFORMANCE";
})(AlertType || (exports.AlertType = AlertType = {}));
/**
 * Alert severity levels
 */
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["INFO"] = "INFO";
    AlertSeverity["WARNING"] = "WARNING";
    AlertSeverity["CRITICAL"] = "CRITICAL";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
/**
 * PIP status
 */
var PIPStatus;
(function (PIPStatus) {
    PIPStatus["ACTIVE"] = "ACTIVE";
    PIPStatus["COMPLETED_SUCCESS"] = "COMPLETED_SUCCESS";
    PIPStatus["COMPLETED_FAILED"] = "COMPLETED_FAILED";
    PIPStatus["CANCELLED"] = "CANCELLED";
})(PIPStatus || (exports.PIPStatus = PIPStatus = {}));
/**
 * PIP outcome
 */
var PIPOutcome;
(function (PIPOutcome) {
    PIPOutcome["TARGETS_MET"] = "TARGETS_MET";
    PIPOutcome["SIGNIFICANT_IMPROVEMENT"] = "SIGNIFICANT_IMPROVEMENT";
    PIPOutcome["MINIMAL_IMPROVEMENT"] = "MINIMAL_IMPROVEMENT";
    PIPOutcome["NO_IMPROVEMENT"] = "NO_IMPROVEMENT";
    PIPOutcome["AGENT_SUSPENDED"] = "AGENT_SUSPENDED";
})(PIPOutcome || (exports.PIPOutcome = PIPOutcome = {}));
/**
 * Leaderboard categories
 */
var LeaderboardCategory;
(function (LeaderboardCategory) {
    LeaderboardCategory["OVERALL_SCORE"] = "OVERALL_SCORE";
    LeaderboardCategory["COMPLETION_RATE"] = "COMPLETION_RATE";
    LeaderboardCategory["QUALITY_RATING"] = "QUALITY_RATING";
    LeaderboardCategory["SPEED"] = "SPEED";
    LeaderboardCategory["TOTAL_JOBS"] = "TOTAL_JOBS";
})(LeaderboardCategory || (exports.LeaderboardCategory = LeaderboardCategory = {}));
exports.default = {
    PerformanceTrend,
    AgentTier,
    MilestoneType,
    AlertType,
    AlertSeverity,
    PIPStatus,
    PIPOutcome,
    LeaderboardCategory,
};
//# sourceMappingURL=performance.js.map