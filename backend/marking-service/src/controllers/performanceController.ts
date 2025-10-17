// backend/marking-service/src/controllers/performanceController.ts
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@newcondo/db";
import { standardResponse } from "../../../shared/src/utils/response";

const prisma = new PrismaClient();

/**
 * Get agent performance metrics for property marking
 * Calculates reliability score based on completion rate, timeliness, and feedback
 */
export const getAgentPerformance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const agentId = req.params.agentId;

    // Validate agent ID
    if (!agentId) {
      res.status(400).json(
        standardResponse(false, "Agent ID is required", null, 400)
      );
      return;
    }

    // Get agent user data
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isAvailableForMarking: true,
        agentServiceAreas: true,
        agentReliabilityScore: true,
        totalMarkingJobs: true,
        completedMarkingJobs: true,
      },
    });

    if (!agent) {
      res.status(404).json(
        standardResponse(false, "Agent not found", null, 404)
      );
      return;
    }

    // Get marking job statistics
    const markingJobs = await prisma.propertyMarkingJob.findMany({
      where: { assignedAgentId: agentId },
      select: {
        id: true,
        status: true,
        completedAt: true,
        timeSlotExpiry: true,
        createdAt: true,
      },
    });

    // Calculate performance metrics
    const completedJobs = markingJobs.filter(
      (job) => job.status === "COMPLETED"
    ).length;
    const expiredJobs = markingJobs.filter(
      (job) => job.status === "EXPIRED"
    ).length;
    const cancelledJobs = markingJobs.filter(
      (job) => job.status === "CANCELLED"
    ).length;

    // Calculate completion rate
    const completionRate =
      markingJobs.length > 0
        ? Math.round((completedJobs / markingJobs.length) * 100)
        : 0;

    // Calculate on-time completion rate
    const onTimeJobs = markingJobs.filter((job) => {
      if (job.status !== "COMPLETED" || !job.timeSlotExpiry) return false;
      return job.completedAt && job.completedAt <= job.timeSlotExpiry;
    }).length;

    const onTimeRate =
      completedJobs > 0 ? Math.round((onTimeJobs / completedJobs) * 100) : 0;

    // Calculate average response time (time from assignment to first status update)
    const avgResponseTime = calculateAverageResponseTime(markingJobs);

    // Determine reliability score (0-5)
    const reliabilityScore = calculateReliabilityScore(
      completionRate,
      onTimeRate
    );

    const performanceData = {
      agentId: agent.id,
      agentName: agent.name,
      email: agent.email,
      phone: agent.phone,
      isAvailable: agent.isAvailableForMarking,
      serviceAreas: agent.agentServiceAreas,
      totalJobsAssigned: markingJobs.length,
      completedJobs,
      expiredJobs,
      cancelledJobs,
      completionRate,
      onTimeRate,
      averageResponseTimeMinutes: avgResponseTime,
      reliabilityScore: reliabilityScore.toFixed(2),
      performanceLevel: getPerformanceLevel(parseFloat(reliabilityScore.toFixed(2))),
      lastJobCompletedAt:
        markingJobs
          .filter((j) => j.completedAt)
          .sort(
            (a, b) =>
              new Date(b.completedAt!).getTime() -
              new Date(a.completedAt!).getTime()
          )[0]?.completedAt || null,
    };

    res.status(200).json(
      standardResponse(true, "Agent performance retrieved successfully", performanceData, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all agents ranked by performance
 * Used for admin dashboard and queue assignment
 */
export const getTopPerformingAgents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit = 20, serviceArea } = req.query;

    let agents = await prisma.user.findMany({
      where: {
        role: "AGENT",
        isAvailableForMarking: true,
        ...(serviceArea && {
          agentServiceAreas: {
            hasSome: [serviceArea as string],
          },
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        agentReliabilityScore: true,
        agentServiceAreas: true,
        totalMarkingJobs: true,
        completedMarkingJobs: true,
      },
      take: parseInt(limit as string) || 20,
      orderBy: {
        agentReliabilityScore: "desc",
      },
    });

    // Enrich with additional metrics
    const agentsWithMetrics = await Promise.all(
      agents.map(async (agent) => {
        const recentJobs = await prisma.propertyMarkingJob.findMany({
          where: { assignedAgentId: agent.id },
          take: 10,
          orderBy: { createdAt: "desc" },
          select: { status: true, completedAt: true, timeSlotExpiry: true },
        });

        const completedRecently = recentJobs.filter(
          (j) => j.status === "COMPLETED"
        ).length;
        const recentCompletionRate = Math.round((completedRecently / 10) * 100);

        return {
          agentId: agent.id,
          agentName: agent.name,
          email: agent.email,
          reliabilityScore: agent.agentReliabilityScore,
          serviceAreas: agent.agentServiceAreas,
          totalJobs: agent.totalMarkingJobs,
          completedJobs: agent.completedMarkingJobs,
          recentCompletionRate,
          performanceLevel: getPerformanceLevel(
            parseFloat(agent.agentReliabilityScore?.toString() || "0")
          ),
        };
      })
    );

    res.status(200).json(
      standardResponse(
        true,
        "Top performing agents retrieved successfully",
        agentsWithMetrics,
        200
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update agent reliability score
 * Called after job completion or when metrics change
 */
export const updateAgentReliabilityScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const agentId = req.params.agentId;

    if (!agentId) {
      res.status(400).json(
        standardResponse(false, "Agent ID is required", null, 400)
      );
      return;
    }

    // Get all agent's marking jobs
    const jobs = await prisma.propertyMarkingJob.findMany({
      where: { assignedAgentId: agentId },
      select: {
        status: true,
        completedAt: true,
        timeSlotExpiry: true,
      },
    });

    if (jobs.length === 0) {
      res.status(400).json(
        standardResponse(false, "Agent has no marking jobs", null, 400)
      );
      return;
    }

    // Calculate metrics
    const completedJobs = jobs.filter((j) => j.status === "COMPLETED").length;
    const completionRate = Math.round((completedJobs / jobs.length) * 100);

    const onTimeJobs = jobs.filter((job) => {
      if (job.status !== "COMPLETED" || !job.timeSlotExpiry) return false;
      return job.completedAt && job.completedAt <= job.timeSlotExpiry;
    }).length;

    const onTimeRate =
      completedJobs > 0 ? Math.round((onTimeJobs / completedJobs) * 100) : 0;

    // Calculate new reliability score
    const newScore = calculateReliabilityScore(completionRate, onTimeRate);

    // Update agent
    const updatedAgent = await prisma.user.update({
      where: { id: agentId },
      data: {
        agentReliabilityScore: new Prisma.Decimal(newScore.toFixed(2)),
        completedMarkingJobs: completedJobs,
        totalMarkingJobs: jobs.length,
      },
      select: {
        id: true,
        name: true,
        agentReliabilityScore: true,
        completedMarkingJobs: true,
        totalMarkingJobs: true,
      },
    });

    res.status(200).json(
      standardResponse(true, "Agent reliability score updated", {
        agentId: updatedAgent.id,
        agentName: updatedAgent.name,
        newReliabilityScore: updatedAgent.agentReliabilityScore,
        completionRate,
        onTimeRate,
        totalJobs: updatedAgent.totalMarkingJobs,
        completedJobs: updatedAgent.completedMarkingJobs,
      }, 200)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get agent performance analytics for admin dashboard
 */
export const getPerformanceAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { timeframe = "30days" } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case "7days":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get all agents with recent job data
    const agents = await prisma.user.findMany({
      where: { role: "AGENT", isAvailableForMarking: true },
      select: {
        id: true,
        name: true,
        agentReliabilityScore: true,
        completedMarkingJobs: true,
        totalMarkingJobs: true,
      },
    });

    // Get recent job statistics
    const recentJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        status: true,
        assignedAgentId: true,
      },
    });

    // Aggregate statistics
    const completedCount = recentJobs.filter(
      (j) => j.status === "COMPLETED"
    ).length;
    const totalCount = recentJobs.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Average reliability score
    const avgReliabilityScore =
      agents.length > 0
        ? (agents.reduce((sum, a) => sum + (parseFloat(a.agentReliabilityScore?.toString() || "0")), 0) / agents.length).toFixed(2)
        : "0";

    const analytics = {
      timeframe,
      startDate,
      endDate,
      totalAgents: agents.length,
      totalJobsCompleted: completedCount,
      totalJobsAssigned: totalCount,
      overallCompletionRate: completionRate,
      averageReliabilityScore: avgReliabilityScore,
      topPerformers: agents
        .sort(
          (a, b) =>
            (parseFloat(b.agentReliabilityScore?.toString() || "0")) -
            (parseFloat(a.agentReliabilityScore?.toString() || "0"))
        )
        .slice(0, 5)
        .map((a) => ({
          agentId: a.id,
          agentName: a.name,
          reliabilityScore: a.agentReliabilityScore,
          completedJobs: a.completedMarkingJobs,
          totalJobs: a.totalMarkingJobs,
        })),
      lowPerformers: agents
        .filter(
          (a) =>
            parseFloat(a.agentReliabilityScore?.toString() || "0") < 2.5 &&
            a.totalMarkingJobs > 5
        )
        .slice(0, 5)
        .map((a) => ({
          agentId: a.id,
          agentName: a.name,
          reliabilityScore: a.agentReliabilityScore,
          completedJobs: a.completedMarkingJobs,
          totalJobs: a.totalMarkingJobs,
        })),
    };

    res.status(200).json(
      standardResponse(true, "Performance analytics retrieved", analytics, 200)
    );
  } catch (error) {
    next(error);
  }
};

// Helper functions
function calculateReliabilityScore(completionRate: number, onTimeRate: number): number {
  // Formula: (completion rate * 0.6 + on-time rate * 0.4) / 100 * 5
  // Converts percentage scores to 0-5 scale
  const weightedScore = (completionRate * 0.6 + onTimeRate * 0.4) / 100;
  return Math.min(Math.max(weightedScore * 5, 0), 5); // Clamp between 0 and 5
}

function calculateAverageResponseTime(jobs: any[]): number {
  if (jobs.length === 0) return 0;

  const responseTimes = jobs
    .map((job) => {
      const createdTime = new Date(job.createdAt).getTime();
      const responseTime = Date.now() - createdTime;
      return responseTime / (1000 * 60); // Convert to minutes
    })
    .filter((t) => t > 0);

  if (responseTimes.length === 0) return 0;
  return Math.round(
    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
  );
}

function getPerformanceLevel(score: number): string {
  if (score >= 4.5) return "EXCELLENT";
  if (score >= 4.0) return "VERY_GOOD";
  if (score >= 3.0) return "GOOD";
  if (score >= 2.0) return "SATISFACTORY";
  return "NEEDS_IMPROVEMENT";
}

// Import Prisma for the Decimal type used in update
import { Prisma } from "@newcondo/db";