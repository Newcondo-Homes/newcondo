/**
 * File: backend/shared/src/types/performance.ts
 * Shared performance and reliability scoring types for agents
 */

/**
 * Agent reliability score breakdown
 */
export interface AgentReliabilityScore {
  agentId: string;
  overallScore: number; // 0.00 to 5.00
  breakdown: {
    completionRate: ScoreComponent;
    responseTime: ScoreComponent;
    qualityRating: ScoreComponent;
    punctuality: ScoreComponent;
    propertyOwnerFeedback: ScoreComponent;
  };
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  expiredJobs: number;
  lastUpdated: Date;
}

/**
 * Individual score component
 */
export interface ScoreComponent {
  score: number; // 0.00 to 1.00
  weight: number; // percentage weight in overall score
  details?: string;
}

/**
 * Agent performance metrics
 */
export interface AgentPerformanceMetrics {
  agentId: string;
  
  // Job Statistics
  totalJobsAssigned: number;
  totalJobsCompleted: number;
  totalJobsCancelled: number;
  totalJobsExpired: number;
  
  // Completion Metrics
  completionRate: number; // percentage (0-100)
  averageCompletionTime: number; // in minutes
  firstTimeCompletionRate: number; // percentage (0-100)
  
  // Response Metrics
  averageResponseTime: number; // in minutes (time to accept job)
  averageTimeSlotUtilization: number; // percentage (0-100)
  
  // Quality Metrics
  averageQualityRating: number; // 0.00 to 5.00 from property owners
  boundaryAccuracyRate: number; // percentage (0-100)
  photoQualityRating: number; // 0.00 to 5.00
  
  // Reliability Metrics
  punctualityScore: number; // 0.00 to 5.00
  noShowRate: number; // percentage (0-100)
  lateArrivalRate: number; // percentage (0-100)
  
  // Financial Metrics
  totalEarnings: number;
  averageJobEarnings: number;
  partialPaymentsReceived: number;
  fullPaymentsReceived: number;
  
  // Time-based Performance
  performanceTrend: PerformanceTrend;
  lastJobCompletedAt?: Date;
  lastActiveAt: Date;
  
  // Feedback
  totalFeedbackReceived: number;
  positiveFeedbackCount: number;
  negativeFeedbackCount: number;
  
  updatedAt: Date;
}

/**
 * Performance trend indicator
 */
export enum PerformanceTrend {
  IMPROVING = 'IMPROVING',
  STABLE = 'STABLE',
  DECLINING = 'DECLINING',
  NEW = 'NEW', // Less than 5 jobs completed
}

/**
 * Performance scoring weights configuration
 */
export interface ScoringWeightsConfig {
  completionRate: number; // default: 0.30 (30%)
  responseTime: number; // default: 0.15 (15%)
  qualityRating: number; // default: 0.25 (25%)
  punctuality: number; // default: 0.20 (20%)
  propertyOwnerFeedback: number; // default: 0.10 (10%)
}

/**
 * Job completion quality assessment
 */
export interface JobQualityAssessment {
  jobId: string;
  agentId: string;
  assessedBy: string; // Property owner ID
  
  // Quality Ratings (0-5)
  overallRating: number;
  boundaryAccuracy: number;
  photoQuality: number;
  punctuality: number;
  professionalism: number;
  
  // Boolean Checks
  arrivedOnTime: boolean;
  completedWithinTimeSlot: boolean;
  followedInstructions: boolean;
  respectfulBehavior: boolean;
  
  // Feedback
  positiveComments?: string;
  improvementAreas?: string;
  wouldRecommend: boolean;
  
  assessedAt: Date;
}

/**
 * Agent performance badge/tier
 */
export enum AgentTier {
  ROOKIE = 'ROOKIE', // 0-5 jobs, score < 3.5
  STANDARD = 'STANDARD', // 5-20 jobs, score 3.5-4.0
  PROFESSIONAL = 'PROFESSIONAL', // 20-50 jobs, score 4.0-4.5
  EXPERT = 'EXPERT', // 50+ jobs, score 4.5-4.8
  ELITE = 'ELITE', // 100+ jobs, score 4.8-5.0
}

/**
 * Performance milestone
 */
export interface PerformanceMilestone {
  type: MilestoneType;
  achieved: boolean;
  achievedAt?: Date;
  requirements: string;
  reward?: string;
}

/**
 * Milestone types
 */
export enum MilestoneType {
  FIRST_JOB = 'FIRST_JOB',
  FIVE_JOBS = 'FIVE_JOBS',
  TEN_JOBS = 'TEN_JOBS',
  FIFTY_JOBS = 'FIFTY_JOBS',
  HUNDRED_JOBS = 'HUNDRED_JOBS',
  PERFECT_MONTH = 'PERFECT_MONTH', // 100% completion rate for a month
  SPEED_DEMON = 'SPEED_DEMON', // Consistently fast completion
  QUALITY_CHAMPION = 'QUALITY_CHAMPION', // High quality ratings
  RELIABLE_STAR = 'RELIABLE_STAR', // High reliability score
}

/**
 * Performance alert
 */
export interface PerformanceAlert {
  agentId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  triggeredBy: string; // Metric that triggered alert
  threshold: number;
  currentValue: number;
  actionRequired?: string;
  createdAt: Date;
}

/**
 * Alert types
 */
export enum AlertType {
  LOW_COMPLETION_RATE = 'LOW_COMPLETION_RATE',
  HIGH_CANCELLATION_RATE = 'HIGH_CANCELLATION_RATE',
  SLOW_RESPONSE_TIME = 'SLOW_RESPONSE_TIME',
  LOW_QUALITY_RATING = 'LOW_QUALITY_RATING',
  HIGH_NO_SHOW_RATE = 'HIGH_NO_SHOW_RATE',
  DECLINING_PERFORMANCE = 'DECLINING_PERFORMANCE',
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

/**
 * Performance improvement plan
 */
export interface PerformanceImprovementPlan {
  agentId: string;
  startDate: Date;
  endDate: Date;
  status: PIPStatus;
  
  // Current Issues
  identifiedIssues: string[];
  currentMetrics: {
    completionRate: number;
    qualityRating: number;
    responseTime: number;
  };
  
  // Targets
  targetMetrics: {
    completionRate: number;
    qualityRating: number;
    responseTime: number;
  };
  
  // Progress
  progressChecks: ProgressCheck[];
  finalOutcome?: PIPOutcome;
  
  createdBy: string; // Admin ID
  notes?: string;
}

/**
 * PIP status
 */
export enum PIPStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED_SUCCESS = 'COMPLETED_SUCCESS',
  COMPLETED_FAILED = 'COMPLETED_FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Progress check
 */
export interface ProgressCheck {
  date: Date;
  metrics: {
    completionRate: number;
    qualityRating: number;
    responseTime: number;
  };
  notes: string;
  isOnTrack: boolean;
}

/**
 * PIP outcome
 */
export enum PIPOutcome {
  TARGETS_MET = 'TARGETS_MET',
  SIGNIFICANT_IMPROVEMENT = 'SIGNIFICANT_IMPROVEMENT',
  MINIMAL_IMPROVEMENT = 'MINIMAL_IMPROVEMENT',
  NO_IMPROVEMENT = 'NO_IMPROVEMENT',
  AGENT_SUSPENDED = 'AGENT_SUSPENDED',
}

/**
 * Agent ranking
 */
export interface AgentRanking {
  rank: number;
  agentId: string;
  agentName: string;
  reliabilityScore: number;
  tier: AgentTier;
  totalJobsCompleted: number;
  completionRate: number;
  averageRating: number;
  serviceAreas: string[];
}

/**
 * Performance comparison
 */
export interface PerformanceComparison {
  agentId: string;
  currentPeriod: AgentPerformanceMetrics;
  previousPeriod: AgentPerformanceMetrics;
  changes: {
    completionRate: number; // percentage change
    responseTime: number; // percentage change
    qualityRating: number; // percentage change
    overallScore: number; // percentage change
  };
  trend: PerformanceTrend;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  position: number;
  agentId: string;
  agentName: string;
  score: number;
  category: LeaderboardCategory;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Leaderboard categories
 */
export enum LeaderboardCategory {
  OVERALL_SCORE = 'OVERALL_SCORE',
  COMPLETION_RATE = 'COMPLETION_RATE',
  QUALITY_RATING = 'QUALITY_RATING',
  SPEED = 'SPEED',
  TOTAL_JOBS = 'TOTAL_JOBS',
}

export default {
  AgentReliabilityScore,
  ScoreComponent,
  AgentPerformanceMetrics,
  PerformanceTrend,
  ScoringWeightsConfig,
  JobQualityAssessment,
  AgentTier,
  PerformanceMilestone,
  MilestoneType,
  PerformanceAlert,
  AlertType,
  AlertSeverity,
  PerformanceImprovementPlan,
  PIPStatus,
  ProgressCheck,
  PIPOutcome,
  AgentRanking,
  PerformanceComparison,
  LeaderboardEntry,
  LeaderboardCategory,
};