// backend/marking-service/src/utils/queueManager.ts

import { QueueEntry, QueueStatus, QueuePriority } from '../types/queue';

export class QueueManager {
  private queue: QueueEntry[] = [];

  /**
   * Add an agent to the queue
   */
  addToQueue(entry: Omit<QueueEntry, 'position' | 'status'>): QueueEntry {
    const position = this.queue.length + 1;
    const queueEntry: QueueEntry = {
      ...entry,
      position,
      status: QueueStatus.WAITING
    };

    this.queue.push(queueEntry);
    this.sortQueue();

    return queueEntry;
  }

  /**
   * Remove an agent from the queue
   */
  removeFromQueue(agentId: string, markingJobId: string): boolean {
    const index = this.queue.findIndex(
      (entry) => entry.agentId === agentId && entry.markingJobId === markingJobId
    );

    if (index === -1) return false;

    this.queue.splice(index, 1);
    this.reorderQueue();

    return true;
  }

  /**
   * Get next agent in queue
   */
  getNextAgent(markingJobId: string): QueueEntry | null {
    const waitingAgents = this.queue.filter(
      (entry) =>
        entry.markingJobId === markingJobId && entry.status === QueueStatus.WAITING
    );

    return waitingAgents.length > 0 ? waitingAgents[0] : null;
  }

  /**
   * Update agent status in queue
   */
  updateStatus(
    agentId: string,
    markingJobId: string,
    status: QueueStatus
  ): QueueEntry | null {
    const entry = this.queue.find(
      (e) => e.agentId === agentId && e.markingJobId === markingJobId
    );

    if (!entry) return null;

    entry.status = status;
    entry.updatedAt = new Date();

    if (status === QueueStatus.ACTIVE) {
      entry.activatedAt = new Date();
    }

    return entry;
  }

  /**
   * Get agent's position in queue
   */
  getPosition(agentId: string, markingJobId: string): number | null {
    const entry = this.queue.find(
      (e) => e.agentId === agentId && e.markingJobId === markingJobId
    );

    return entry ? entry.position : null;
  }

  /**
   * Get all agents in queue for a marking job
   */
  getQueueForJob(markingJobId: string): QueueEntry[] {
    return this.queue
      .filter((entry) => entry.markingJobId === markingJobId)
      .sort((a, b) => a.position - b.position);
  }

  /**
   * Clear queue for a marking job (when job is completed/cancelled)
   */
  clearQueueForJob(markingJobId: string): void {
    this.queue = this.queue.filter((entry) => entry.markingJobId !== markingJobId);
    this.reorderQueue();
  }

  /**
   * Check if agent is in queue
   */
  isInQueue(agentId: string, markingJobId: string): boolean {
    return this.queue.some(
      (entry) => entry.agentId === agentId && entry.markingJobId === markingJobId
    );
  }

  /**
   * Get queue statistics for a job
   */
  getQueueStats(markingJobId: string): {
    total: number;
    waiting: number;
    active: number;
    completed: number;
    expired: number;
  } {
    const jobQueue = this.getQueueForJob(markingJobId);

    return {
      total: jobQueue.length,
      waiting: jobQueue.filter((e) => e.status === QueueStatus.WAITING).length,
      active: jobQueue.filter((e) => e.status === QueueStatus.ACTIVE).length,
      completed: jobQueue.filter((e) => e.status === QueueStatus.COMPLETED).length,
      expired: jobQueue.filter((e) => e.status === QueueStatus.EXPIRED).length
    };
  }

  /**
   * Mark expired queue entries
   */
  markExpiredEntries(): QueueEntry[] {
    const now = new Date();
    const expiredEntries: QueueEntry[] = [];

    this.queue.forEach((entry) => {
      if (
        entry.expiresAt &&
        entry.expiresAt < now &&
        entry.status === QueueStatus.ACTIVE
      ) {
        entry.status = QueueStatus.EXPIRED;
        entry.updatedAt = now;
        expiredEntries.push(entry);
      }
    });

    return expiredEntries;
  }

  /**
   * Sort queue by priority and entry time
   */
  private sortQueue(): void {
    const priorityOrder: Record<QueuePriority, number> = {
      [QueuePriority.URGENT]: 1,
      [QueuePriority.HIGH]: 2,
      [QueuePriority.NORMAL]: 3,
      [QueuePriority.LOW]: 4
    };

    this.queue.sort((a, b) => {
      // First, sort by job
      if (a.markingJobId !== b.markingJobId) {
        return a.markingJobId.localeCompare(b.markingJobId);
      }

      // Then by priority
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by joined time (FIFO)
      return a.joinedAt.getTime() - b.joinedAt.getTime();
    });

    this.reorderQueue();
  }

  /**
   * Reorder queue positions
   */
  private reorderQueue(): void {
    const jobGroups = new Map<string, QueueEntry[]>();

    // Group by marking job
    this.queue.forEach((entry) => {
      if (!jobGroups.has(entry.markingJobId)) {
        jobGroups.set(entry.markingJobId, []);
      }
      jobGroups.get(entry.markingJobId)!.push(entry);
    });

    // Reorder positions within each job
    jobGroups.forEach((entries) => {
      entries.forEach((entry, index) => {
        entry.position = index + 1;
      });
    });
  }

  /**
   * Get total queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get all queue entries
   */
  getAllEntries(): QueueEntry[] {
    return [...this.queue];
  }

  /**
   * Clear all queues
   */
  clearAllQueues(): void {
    this.queue = [];
  }
}

// Singleton instance
let queueManagerInstance: QueueManager | null = null;

export const getQueueManager = (): QueueManager => {
  if (!queueManagerInstance) {
    queueManagerInstance = new QueueManager();
  }
  return queueManagerInstance;
};