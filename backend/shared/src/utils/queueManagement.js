"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToQueue = addToQueue;
exports.getNextInQueue = getNextInQueue;
exports.assignTimeSlot = assignTimeSlot;
exports.releaseExpiredTimeSlots = releaseExpiredTimeSlots;
exports.moveToNextInQueue = moveToNextInQueue;
exports.removeFromQueue = removeFromQueue;
exports.getQueueStats = getQueueStats;
exports.clearQueue = clearQueue;
exports.reorderQueue = reorderQueue;
exports.getAgentQueueAssignments = getAgentQueueAssignments;
const db_1 = require("@newcondo/db");
const DEFAULT_TIME_SLOT_CONFIG = {
    durationMinutes: 180, // 3 hours
    bufferMinutes: 15, // 15-minute buffer
    maxConcurrentAssignments: 10, // Maximum concurrent marking jobs
};
/**
 * Add a marking job to the queue
 */
async function addToQueue(markingJobId, userId, propertyId) {
    // Get current queue position
    const currentMaxPosition = await db_1.prisma.propertyMarkingJob.findFirst({
        where: {
            status: db_1.MarkingJobStatus.QUEUED,
        },
        orderBy: {
            queuePosition: 'desc',
        },
        select: {
            queuePosition: true,
        },
    });
    const nextPosition = (currentMaxPosition?.queuePosition ?? 0) + 1;
    // Update the marking job with queue position
    const updatedJob = await db_1.prisma.propertyMarkingJob.update({
        where: { id: markingJobId },
        data: {
            queuePosition: nextPosition,
            status: db_1.MarkingJobStatus.QUEUED,
        },
    });
    return {
        id: updatedJob.id,
        userId,
        propertyId,
        markingJobId,
        position: nextPosition,
        assignedAt: updatedJob.assignedAt,
        timeSlotExpiry: updatedJob.timeSlotExpiry,
        createdAt: updatedJob.createdAt,
    };
}
/**
 * Get next available item from queue
 */
async function getNextInQueue(markingJobId) {
    const job = await db_1.prisma.propertyMarkingJob.findFirst({
        where: {
            propertyId: {
                in: await db_1.prisma.propertyMarkingJob
                    .findUnique({
                    where: { id: markingJobId },
                    select: { propertyId: true },
                })
                    .then((j) => (j ? [j.propertyId] : [])),
            },
            status: db_1.MarkingJobStatus.QUEUED,
            queuePosition: {
                gt: 0,
            },
        },
        orderBy: {
            queuePosition: 'asc',
        },
    });
    if (!job)
        return null;
    return {
        id: job.id,
        userId: job.requestedBy,
        propertyId: job.propertyId,
        markingJobId: job.id,
        position: job.queuePosition ?? 0,
        assignedAt: job.assignedAt,
        timeSlotExpiry: job.timeSlotExpiry,
        createdAt: job.createdAt,
    };
}
/**
 * Assign time slot to agent
 */
async function assignTimeSlot(markingJobId, agentId, config = DEFAULT_TIME_SLOT_CONFIG) {
    // Check if agent already has too many active assignments
    const activeAssignments = await db_1.prisma.propertyMarkingJob.count({
        where: {
            assignedAgentId: agentId,
            status: {
                in: [db_1.MarkingJobStatus.ASSIGNED, db_1.MarkingJobStatus.IN_PROGRESS],
            },
            timeSlotExpiry: {
                gte: new Date(),
            },
        },
    });
    if (activeAssignments >= config.maxConcurrentAssignments) {
        return {
            success: false,
            timeSlotExpiry: null,
            message: 'Agent has reached maximum concurrent assignments',
        };
    }
    // Calculate time slot expiry
    const now = new Date();
    const timeSlotExpiry = new Date(now.getTime() + config.durationMinutes * 60 * 1000);
    // Assign the job
    const updatedJob = await db_1.prisma.propertyMarkingJob.update({
        where: { id: markingJobId },
        data: {
            assignedAgentId: agentId,
            status: db_1.MarkingJobStatus.ASSIGNED,
            assignedAt: now,
            timeSlotExpiry,
        },
    });
    return {
        success: true,
        timeSlotExpiry: updatedJob.timeSlotExpiry,
        message: 'Time slot assigned successfully',
    };
}
/**
 * Release expired time slots
 */
async function releaseExpiredTimeSlots() {
    const now = new Date();
    const expiredJobs = await db_1.prisma.propertyMarkingJob.findMany({
        where: {
            status: {
                in: [db_1.MarkingJobStatus.ASSIGNED, db_1.MarkingJobStatus.IN_PROGRESS],
            },
            timeSlotExpiry: {
                lt: now,
            },
        },
    });
    if (expiredJobs.length === 0)
        return 0;
    // Release all expired slots
    await db_1.prisma.propertyMarkingJob.updateMany({
        where: {
            id: {
                in: expiredJobs.map((job) => job.id),
            },
        },
        data: {
            assignedAgentId: null,
            status: db_1.MarkingJobStatus.QUEUED,
            assignedAt: null,
            timeSlotExpiry: null,
        },
    });
    return expiredJobs.length;
}
/**
 * Move to next in queue after completion or failure
 */
async function moveToNextInQueue(propertyId) {
    // Get the next job in queue
    const nextJob = await db_1.prisma.propertyMarkingJob.findFirst({
        where: {
            propertyId,
            status: db_1.MarkingJobStatus.QUEUED,
        },
        orderBy: {
            queuePosition: 'asc',
        },
    });
    if (!nextJob)
        return null;
    // Update queue positions for all jobs after this one
    await db_1.prisma.propertyMarkingJob.updateMany({
        where: {
            propertyId,
            status: db_1.MarkingJobStatus.QUEUED,
            queuePosition: {
                gt: nextJob.queuePosition ?? 0,
            },
        },
        data: {
            queuePosition: {
                decrement: 1,
            },
        },
    });
    return {
        id: nextJob.id,
        userId: nextJob.requestedBy,
        propertyId: nextJob.propertyId,
        markingJobId: nextJob.id,
        position: nextJob.queuePosition ?? 0,
        assignedAt: nextJob.assignedAt,
        timeSlotExpiry: nextJob.timeSlotExpiry,
        createdAt: nextJob.createdAt,
    };
}
/**
 * Remove from queue
 */
async function removeFromQueue(markingJobId) {
    const job = await db_1.prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
        select: {
            propertyId: true,
            queuePosition: true,
        },
    });
    if (!job)
        return false;
    // Update the job status
    await db_1.prisma.propertyMarkingJob.update({
        where: { id: markingJobId },
        data: {
            status: db_1.MarkingJobStatus.CANCELLED,
            queuePosition: null,
        },
    });
    // Update queue positions for jobs after this one
    if (job.queuePosition) {
        await db_1.prisma.propertyMarkingJob.updateMany({
            where: {
                propertyId: job.propertyId,
                status: db_1.MarkingJobStatus.QUEUED,
                queuePosition: {
                    gt: job.queuePosition,
                },
            },
            data: {
                queuePosition: {
                    decrement: 1,
                },
            },
        });
    }
    return true;
}
/**
 * Get queue statistics for a property
 */
async function getQueueStats(propertyId, userId) {
    const totalInQueue = await db_1.prisma.propertyMarkingJob.count({
        where: {
            propertyId,
            status: db_1.MarkingJobStatus.QUEUED,
        },
    });
    const activeAssignments = await db_1.prisma.propertyMarkingJob.count({
        where: {
            propertyId,
            status: {
                in: [db_1.MarkingJobStatus.ASSIGNED, db_1.MarkingJobStatus.IN_PROGRESS],
            },
        },
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = await db_1.prisma.propertyMarkingJob.count({
        where: {
            propertyId,
            status: db_1.MarkingJobStatus.COMPLETED,
            completedAt: {
                gte: today,
            },
        },
    });
    // Calculate average completion time
    const completedJobs = await db_1.prisma.propertyMarkingJob.findMany({
        where: {
            propertyId,
            status: db_1.MarkingJobStatus.COMPLETED,
            assignedAt: { not: null },
            completedAt: { not: null },
        },
        select: {
            assignedAt: true,
            completedAt: true,
        },
        take: 20, // Last 20 completed jobs
    });
    const avgCompletionTime = completedJobs.length > 0
        ? completedJobs.reduce((sum, job) => {
            if (job.assignedAt && job.completedAt) {
                return (sum +
                    (job.completedAt.getTime() - job.assignedAt.getTime()) / 60000);
            }
            return sum;
        }, 0) / completedJobs.length
        : 0;
    // Get current user's position if userId provided
    let currentPosition = null;
    if (userId) {
        const userJob = await db_1.prisma.propertyMarkingJob.findFirst({
            where: {
                propertyId,
                requestedBy: userId,
                status: db_1.MarkingJobStatus.QUEUED,
            },
            select: {
                queuePosition: true,
            },
        });
        currentPosition = userJob?.queuePosition ?? null;
    }
    return {
        totalInQueue,
        activeAssignments,
        completedToday,
        averageCompletionTime: Math.round(avgCompletionTime),
        currentPosition,
    };
}
/**
 * Clear entire queue for a property (admin action)
 */
async function clearQueue(propertyId) {
    const result = await db_1.prisma.propertyMarkingJob.updateMany({
        where: {
            propertyId,
            status: db_1.MarkingJobStatus.QUEUED,
        },
        data: {
            status: db_1.MarkingJobStatus.CANCELLED,
            queuePosition: null,
        },
    });
    return result.count;
}
/**
 * Reorder queue positions after manual intervention
 */
async function reorderQueue(propertyId) {
    const jobs = await db_1.prisma.propertyMarkingJob.findMany({
        where: {
            propertyId,
            status: db_1.MarkingJobStatus.QUEUED,
        },
        orderBy: {
            createdAt: 'asc',
        },
    });
    // Update positions sequentially
    for (let i = 0; i < jobs.length; i++) {
        await db_1.prisma.propertyMarkingJob.update({
            where: { id: jobs[i].id },
            data: { queuePosition: i + 1 },
        });
    }
}
/**
 * Get agent's current queue assignments
 */
async function getAgentQueueAssignments(agentId) {
    const assignments = await db_1.prisma.propertyMarkingJob.findMany({
        where: {
            assignedAgentId: agentId,
            status: {
                in: [
                    db_1.MarkingJobStatus.ASSIGNED,
                    db_1.MarkingJobStatus.IN_PROGRESS,
                    db_1.MarkingJobStatus.QUEUED,
                ],
            },
        },
        orderBy: {
            assignedAt: 'desc',
        },
    });
    return assignments.map((job) => ({
        markingJobId: job.id,
        propertyId: job.propertyId,
        position: job.queuePosition ?? 0,
        timeSlotExpiry: job.timeSlotExpiry,
        status: job.status,
    }));
}
//# sourceMappingURL=queueManagement.js.map