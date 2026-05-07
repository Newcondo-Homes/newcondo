/**
 * Queue Calculations Utilities
 * Handles queue position calculations, wait time estimations, and queue analytics
 */

import {
  MarkingJobQueueStatus,
  QueueMetrics,
} from "@/types/queue";

const AVERAGE_MARKING_TIME_MINUTES = 45;

/**
 * Calculate queue position for a newly queued job
 * Takes into account job urgency and other factors
 */
export const calculateQueuePosition = (
  currentQueueLength: number,
  urgencyLevel: string,
  isNewJob: boolean
): number => {
  if (!isNewJob) {
    return currentQueueLength + 1;
  }

  // Priority boost for urgent jobs (they jump to front if queue is large)
  const urgencyBoost =
    urgencyLevel === "URGENT" && currentQueueLength > 5 ? -2 : 0;
  const position = Math.max(1, currentQueueLength + 1 + urgencyBoost);

  return position;
};

/**
 * Estimate wait time in queue based on position and current metrics
 */
export const estimateWaitTime = (
  queuePosition: number,
  averageCompletionTime: number = AVERAGE_MARKING_TIME_MINUTES,
  activeAgents: number = 1
): number => {
  if (queuePosition <= 0) return 0;
  if (activeAgents <= 0) return -1; // Unknown

  // Each agent can process one job at a time
  // Wait time = time to process all jobs ahead / number of agents
  const jobsAhead = Math.max(0, queuePosition - 1);
  const estimatedMinutes =
    Math.ceil((jobsAhead * averageCompletionTime) / activeAgents) + 15; // +15 min buffer

  return estimatedMinutes;
};

/**
 * Calculate updated queue metrics for analytics and display
 */
export const calculateQueueMetrics = (
  queuedJobs: Array<{
    id: string;
    status: MarkingJobQueueStatus;
    createdAt: Date;
    completedAt?: Date;
    queuePosition: number;
  }>,
  activeAgents: number,
  completionWindowHours: number = 24
): QueueMetrics => {
  const now = new Date();
  const completionWindow = new Date(
    now.getTime() - completionWindowHours * 60 * 60 * 1000
  );

  const totalJobs = queuedJobs.length;
  const assignedToday = queuedJobs.filter(
    (job) => job.status === MarkingJobQueueStatus.ASSIGNED && job.createdAt > completionWindow
  ).length;
  const completedJobs = queuedJobs.filter(
    (job) =>
      job.status === MarkingJobQueueStatus.COMPLETED && job.completedAt && job.completedAt > completionWindow
  ).length;

  // Calculate average wait times from completion times
  const completionTimes = queuedJobs
    .filter((job) => job.completedAt)
    .map((job) => {
      const waitTime =
        (job.completedAt!.getTime() - job.createdAt.getTime()) /
        (1000 * 60);
      return waitTime;
    });

  const avgWaitTime =
    completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

  const completionRate =
    assignedToday > 0 ? (completedJobs / assignedToday) * 100 : 0;

  return {
    totalJobsInQueue: totalJobs,
    averageWaitTime: Math.round(avgWaitTime),
    totalActiveAgents: activeAgents,
    jobsAssignedToday: assignedToday,
    completionRate: Math.round(completionRate),
    averageTimeToCompletion: Math.round(avgWaitTime / 60), // Convert to hours
  };
};

/**
 * Calculate ideal number of agents needed for queue processing
 */
export const calculateRequiredAgents = (
  totalQueuedJobs: number,
  averageJobTime: number = AVERAGE_MARKING_TIME_MINUTES,
  targetAverageWaitTime: number = 120 // 2 hours in minutes
): number => {
  if (totalQueuedJobs === 0) return 0;

  // Formula: agents needed = (total queue time) / target wait time
  const totalQueueTime = totalQueuedJobs * averageJobTime;
  const agentsNeeded = Math.ceil(totalQueueTime / targetAverageWaitTime);

  return Math.max(1, agentsNeeded);
};

/**
 * Reassign queue positions after job completion or cancellation
 */
export const reassignQueuePositions = (
  queuedJobs: Array<{
    id: string;
    queuePosition: number;
    status: MarkingJobQueueStatus;
  }>
): Array<{ id: string; newPosition: number }> => {
  // Filter and sort jobs that are still in queue
  const activeQueue = queuedJobs
    .filter((job) => job.status === MarkingJobQueueStatus.QUEUED)
    .sort((a, b) => a.queuePosition - b.queuePosition);

  // Reassign positions sequentially
  return activeQueue.map((job, index) => ({
    id: job.id,
    newPosition: index + 1,
  }));
};

/**
 * Calculate wait time reduction for completing jobs early
 */
export const calculateWaitTimeReduction = (
  completionTimeMinutes: number,
  estimatedTimeMinutes: number
): number => {
  const reduction = estimatedTimeMinutes - completionTimeMinutes;
  return Math.max(0, reduction);
};

/**
 * Sort jobs by priority for queue assignment
 * Returns jobs sorted by urgency and wait time
 */
export const prioritizeQueue = (
  jobs: Array<{
    id: string;
    urgencyLevel: string;
    queuePosition: number;
    createdAt: Date;
  }>
): Array<{ id: string; priority: number }> => {
  const urgencyScore = {
    URGENT: 4,
    HIGH: 3,
    NORMAL: 2,
    LOW: 1,
  };

  return jobs
    .map((job) => {
      // Priority = urgency + age factor (older jobs get higher priority)
      const ageDays =
        (new Date().getTime() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const ageFactor = Math.min(ageDays / 10, 2); // Cap at +2 priority
      const baseUrgency = urgencyScore[job.urgencyLevel as keyof typeof urgencyScore] || 2;
      const priority = baseUrgency + ageFactor;

      return {
        id: job.id,
        priority,
      };
    })
    .sort((a, b) => b.priority - a.priority);
};

/**
 * Calculate payment distribution based on completion
 */
export const calculatePaymentDistribution = (
  totalFee: number,
  agentCompensationPercentage: number = 25
): { agentAmount: number; platformFee: number } => {
  const agentAmount = (totalFee * agentCompensationPercentage) / 100;
  const platformFee = totalFee - agentAmount;

  return {
    agentAmount: Math.round(agentAmount),
    platformFee: Math.round(platformFee),
  };
};

/**
 * Calculate estimated completion time based on queue position
 * Returns estimated completion date/time
 */
export const calculateEstimatedCompletionTime = (
  queuePosition: number,
  averageJobTime: number = AVERAGE_MARKING_TIME_MINUTES,
  activeAgents: number = 1,
  currentTime: Date = new Date()
): Date => {
  const waitTimeMinutes = estimateWaitTime(
    queuePosition,
    averageJobTime,
    activeAgents
  );
  const completionTime = new Date(
    currentTime.getTime() + waitTimeMinutes * 60 * 1000
  );
  return completionTime;
};

/**
 * Predict queue status and recommend actions
 */
export const predictQueueStatus = (
  totalQueuedJobs: number,
  activeAgents: number,
  averageJobTime: number = AVERAGE_MARKING_TIME_MINUTES
): {
  status: "OPTIMAL" | "ACCEPTABLE" | "CONGESTED" | "CRITICAL";
  recommendation: string;
  estimatedProcessingTime: number; // in hours
} => {
  const requiredAgents = calculateRequiredAgents(totalQueuedJobs, averageJobTime);
  const agentRatio = totalQueuedJobs / Math.max(activeAgents, 1);
  const estimatedHours = (totalQueuedJobs * averageJobTime) / (activeAgents * 60);

  let status: "OPTIMAL" | "ACCEPTABLE" | "CONGESTED" | "CRITICAL" =
    "OPTIMAL";
  let recommendation = "Queue is operating efficiently.";

  if (agentRatio > 10) {
    status = "CRITICAL";
    recommendation = `URGENT: Queue is critically congested. Need at least ${requiredAgents} agents, but only ${activeAgents} available.`;
  } else if (agentRatio > 6) {
    status = "CONGESTED";
    recommendation = `Queue is congested. Consider notifying ${requiredAgents - activeAgents} additional agents.`;
  } else if (agentRatio > 3) {
    status = "ACCEPTABLE";
    recommendation = "Queue is manageable. Monitor capacity closely.";
  }

  return {
    status,
    recommendation,
    estimatedProcessingTime: Math.ceil(estimatedHours),
  };
};

/**
 * Calculate surge pricing or priority multiplier based on queue status
 */
export const calculateUrgencyMultiplier = (
  queueLength: number,
  totalActiveAgents: number
): number => {
  if (totalActiveAgents === 0) return 1;

  const ratio = queueLength / totalActiveAgents;

  // Scale multiplier based on queue congestion
  if (ratio <= 2) return 1; // Normal
  if (ratio <= 4) return 1.1; // +10%
  if (ratio <= 6) return 1.2; // +20%
  if (ratio <= 8) return 1.3; // +30%
  return 1.5; // +50% for critical congestion
};

/**
 * Batch calculate metrics for multiple queues (city-based queues)
 */
export const calculateMultiQueueMetrics = (
  queuesByCity: Record<string, Array<{ id: string; status: MarkingJobQueueStatus; createdAt: Date; completedAt?: Date; queuePosition: number }>>
): Record<
  string,
  QueueMetrics & { city: string; agentDensity: number }
> => {
  const result: Record<
    string,
    QueueMetrics & { city: string; agentDensity: number }
  > = {};

  Object.entries(queuesByCity).forEach(([city, jobs]) => {
    const metrics = calculateQueueMetrics(jobs, 5); // Assuming 5 avg agents per city
    result[city] = {
      ...metrics,
      city,
      agentDensity: jobs.length / Math.max(metrics.totalActiveAgents, 1),
    };
  });

  return result;
};