/**
 * Queue position and timing helpers for payment processing
 */

/**
 * Maximum queue size before rejecting new entries
 */
export const MAX_QUEUE_SIZE = 100;

/**
 * Maximum wait time in queue (milliseconds) - 5 minutes
 */
export const MAX_QUEUE_WAIT_TIME = 5 * 60 * 1000;

/**
 * Queue priority levels
 */
export enum QueuePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3,
}

/**
 * Queue entry interface
 */
export interface QueueEntry {
  id: string;
  userId: string;
  propertyId: string;
  unitId?: string;
  priority: QueuePriority;
  timestamp: Date;
  expiresAt: Date;
  attempts: number;
}

/**
 * Calculate queue position based on priority and timestamp
 */
export function calculateQueuePosition(
  entries: QueueEntry[],
  currentEntry: QueueEntry
): number {
  const sortedEntries = sortQueueEntries(entries);
  return sortedEntries.findIndex(entry => entry.id === currentEntry.id) + 1;
}

/**
 * Sort queue entries by priority (desc) and timestamp (asc)
 */
export function sortQueueEntries(entries: QueueEntry[]): QueueEntry[] {
  return [...entries].sort((a, b) => {
    // Higher priority first
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    // Earlier timestamp first (FIFO for same priority)
    return a.timestamp.getTime() - b.timestamp.getTime();
  });
}

/**
 * Check if queue is full
 */
export function isQueueFull(currentSize: number): boolean {
  return currentSize >= MAX_QUEUE_SIZE;
}

/**
 * Calculate estimated wait time based on queue position
 */
export function calculateEstimatedWaitTime(position: number): number {
  const avgProcessingTime = 120000; // 2 minutes average per checkout
  return position * avgProcessingTime;
}

/**
 * Format wait time for display
 */
export function formatWaitTime(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  
  if (minutes > 0) {
    return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  
  return `~${seconds} second${seconds > 1 ? 's' : ''}`;
}

/**
 * Check if queue entry is expired
 */
export function isQueueEntryExpired(entry: QueueEntry): boolean {
  return new Date() > entry.expiresAt;
}

/**
 * Remove expired entries from queue
 */
export function removeExpiredEntries(entries: QueueEntry[]): QueueEntry[] {
  return entries.filter(entry => !isQueueEntryExpired(entry));
}

/**
 * Get user's position in queue
 */
export function getUserQueuePosition(
  entries: QueueEntry[],
  userId: string,
  propertyId: string,
  unitId?: string
): number | null {
  const sortedEntries = sortQueueEntries(entries);
  const index = sortedEntries.findIndex(
    entry => 
      entry.userId === userId && 
      entry.propertyId === propertyId &&
      entry.unitId === unitId
  );
  
  return index >= 0 ? index + 1 : null;
}

/**
 * Check if user can join queue
 */
export function canJoinQueue(
  entries: QueueEntry[],
  userId: string,
  propertyId: string,
  unitId?: string
): boolean {
  // Check if queue is full
  if (isQueueFull(entries.length)) {
    return false;
  }
  
  // Check if user already in queue for this property
  const existingEntry = entries.find(
    entry => 
      entry.userId === userId && 
      entry.propertyId === propertyId &&
      entry.unitId === unitId
  );
  
  return !existingEntry;
}

/**
 * Create a new queue entry
 */
export function createQueueEntry(
  userId: string,
  propertyId: string,
  unitId?: string,
  priority: QueuePriority = QueuePriority.NORMAL
): QueueEntry {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MAX_QUEUE_WAIT_TIME);
  
  return {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    userId,
    propertyId,
    unitId,
    priority,
    timestamp: now,
    expiresAt,
    attempts: 0,
  };
}

/**
 * Determine priority based on user status or payment type
 */
export function determinePriority(
  isPremiumUser: boolean,
  isRetry: boolean
): QueuePriority {
  if (isRetry) {
    return QueuePriority.HIGH;
  }
  if (isPremiumUser) {
    return QueuePriority.HIGH;
  }
  return QueuePriority.NORMAL;
}

/**
 * Get next entry to process from queue
 */
export function getNextQueueEntry(entries: QueueEntry[]): QueueEntry | null {
  const validEntries = removeExpiredEntries(entries);
  const sortedEntries = sortQueueEntries(validEntries);
  return sortedEntries[0] || null;
}

/**
 * Calculate queue metrics for monitoring
 */
export interface QueueMetrics {
  totalSize: number;
  validSize: number;
  expiredCount: number;
  averageWaitTime: number;
  oldestEntryAge: number;
  priorityDistribution: Record<QueuePriority, number>;
}

export function calculateQueueMetrics(entries: QueueEntry[]): QueueMetrics {
  const now = Date.now();
  const validEntries = removeExpiredEntries(entries);
  const expiredCount = entries.length - validEntries.length;
  
  const ages = validEntries.map(entry => now - entry.timestamp.getTime());
  const averageWaitTime = ages.length > 0 
    ? ages.reduce((sum, age) => sum + age, 0) / ages.length 
    : 0;
  const oldestEntryAge = ages.length > 0 ? Math.max(...ages) : 0;
  
  const priorityDistribution = validEntries.reduce((acc, entry) => {
    acc[entry.priority] = (acc[entry.priority] || 0) + 1;
    return acc;
  }, {} as Record<QueuePriority, number>);
  
  return {
    totalSize: entries.length,
    validSize: validEntries.length,
    expiredCount,
    averageWaitTime,
    oldestEntryAge,
    priorityDistribution,
  };
}