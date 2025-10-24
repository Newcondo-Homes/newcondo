// apps/admin/src/lib/api/markingOversight.ts
import type {
  MarkingJobOverview,
  MarkingJobDetail,
  QueueStats,
  AgentPerformanceMetrics,
  MarkingAnalyticsData,
  JobTimeline,
  DisputeInfo,
  DateRange
} from "@/types/admin";

const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:4000/api/admin";

class MarkingOversightAPI {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      credentials: "include", // Include cookies for authentication
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "An error occurred",
      }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get all marking jobs with filters
  async getMarkingJobs(filters: {
    status?: string;
    dateRange?: string;
    urgency?: string;
  }): Promise<MarkingJobOverview[]> {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== "all") params.append("status", filters.status);
    if (filters.dateRange && filters.dateRange !== "all") params.append("dateRange", filters.dateRange);
    if (filters.urgency && filters.urgency !== "all") params.append("urgency", filters.urgency);

    const query = params.toString();
    return this.request(`/marking-jobs${query ? `?${query}` : ""}`);
  }

  // Get detailed information about a specific job
  async getJobDetails(jobId: string): Promise<MarkingJobDetail> {
    return this.request(`/marking-jobs/${jobId}`);
  }

  // Get job timeline
  async getJobTimeline(jobId: string): Promise<JobTimeline[]> {
    return this.request(`/marking-jobs/${jobId}/timeline`);
  }

  // Get job dispute information
  async getJobDispute(jobId: string): Promise<DisputeInfo | null> {
    try {
      return await this.request(`/marking-jobs/${jobId}/dispute`);
    } catch (error) {
      // Dispute may not exist
      return null;
    }
  }

  // Get queue statistics
  async getQueueStats(): Promise<QueueStats> {
    return this.request("/marking-queue/stats");
  }

  // Get agent performance metrics
  async getAgentMetrics(): Promise<AgentPerformanceMetrics[]> {
    return this.request("/marking-agents/performance");
  }

  // Get overview statistics
  async getOverviewStats(): Promise<{
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    queuedJobs: number;
    averageCompletionTime: number;
    successRate: number;
  }> {
    return this.request("/marking-overview/stats");
  }

  // Get analytics data
  async getAnalytics(dateRange: DateRange): Promise<MarkingAnalyticsData> {
    return this.request(`/marking-analytics?dateRange=${dateRange}`);
  }

  // Export analytics data
  async exportAnalytics(dateRange: DateRange): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/marking-analytics/export?dateRange=${dateRange}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to export analytics");
    }

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marking-analytics-${dateRange}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // Reassign a job to a different agent
  async reassignJob(jobId: string, agentId?: string): Promise<void> {
    return this.request(`/marking-jobs/${jobId}/reassign`, {
      method: "POST",
      body: JSON.stringify({ agentId }),
    });
  }

  // Cancel a marking job
  async cancelJob(jobId: string, reason?: string): Promise<void> {
    return this.request(`/marking-jobs/${jobId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  // Resolve a dispute
  async resolveDispute(
    disputeId: string,
    resolution: {
      resolution: "approve" | "reject";
      notes: string;
    }
  ): Promise<void> {
    return this.request(`/marking-disputes/${disputeId}/resolve`, {
      method: "POST",
      body: JSON.stringify(resolution),
    });
  }

  // Force complete a job (admin override)
  async forceCompleteJob(jobId: string, notes: string): Promise<void> {
    return this.request(`/marking-jobs/${jobId}/force-complete`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  // Update job urgency
  async updateJobUrgency(
    jobId: string,
    urgency: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  ): Promise<void> {
    return this.request(`/marking-jobs/${jobId}/urgency`, {
      method: "PATCH",
      body: JSON.stringify({ urgency }),
    });
  }

  // Extend job deadline
  async extendDeadline(jobId: string, hours: number): Promise<void> {
    return this.request(`/marking-jobs/${jobId}/extend-deadline`, {
      method: "POST",
      body: JSON.stringify({ hours }),
    });
  }

  // Suspend an agent from marking jobs
  async suspendAgent(
    agentId: string,
    suspension: {
      reason: string;
      durationDays: number;
    }
  ): Promise<void> {
    return this.request(`/marking-agents/${agentId}/suspend`, {
      method: "POST",
      body: JSON.stringify(suspension),
    });
  }

  // Reinstate a suspended agent
  async reinstateAgent(agentId: string): Promise<void> {
    return this.request(`/marking-agents/${agentId}/reinstate`, {
      method: "POST",
    });
  }

  // Adjust agent reliability score
  async adjustReliabilityScore(
    agentId: string,
    adjustment: {
      score: number;
      reason: string;
    }
  ): Promise<void> {
    return this.request(`/marking-agents/${agentId}/reliability`, {
      method: "PATCH",
      body: JSON.stringify(adjustment),
    });
  }

  // Get agent details
  async getAgentDetails(agentId: string): Promise<{
    id: string;
    name: string;
    email: string;
    phone: string;
    reliabilityScore: number;
    totalJobs: number;
    completedJobs: number;
    cancelledJobs: number;
    avgCompletionTime: number;
    serviceAreas: string[];
    isAvailable: boolean;
    isSuspended: boolean;
    suspensionReason?: string;
    suspensionEnds?: string;
    joinedAt: string;
    lastActiveAt: string;
  }> {
    return this.request(`/marking-agents/${agentId}`);
  }

  // Get job statistics by agent
  async getAgentJobStats(agentId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    cancelled: number;
    disputed: number;
    avgRating: number;
    totalEarnings: number;
  }> {
    return this.request(`/marking-agents/${agentId}/stats`);
  }

  // Broadcast message to agents
  async broadcastToAgents(message: {
    title: string;
    body: string;
    targetAreas?: string[];
    urgency: "LOW" | "NORMAL" | "HIGH";
  }): Promise<void> {
    return this.request("/marking-agents/broadcast", {
      method: "POST",
      body: JSON.stringify(message),
    });
  }

  // Get pending approvals
  async getPendingApprovals(): Promise<{
    jobId: string;
    propertyTitle: string;
    agentName: string;
    completedAt: string;
    awaitingApproval: boolean;
  }[]> {
    return this.request("/marking-jobs/pending-approvals");
  }

  // Approve completed job
  async approveCompletedJob(jobId: string, notes?: string): Promise<void> {
    return this.request(`/marking-jobs/${jobId}/approve`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  // Reject completed job
  async rejectCompletedJob(jobId: string, reason: string): Promise<void> {
    return this.request(`/marking-jobs/${jobId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }
}

export const markingOversightApi = new MarkingOversightAPI();