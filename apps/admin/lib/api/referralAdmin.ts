// apps/admin/src/lib/api/referralAdmin.ts
import { apiClient } from "./client";

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  qualifiedReferrals: number;
  pendingRewards: number;
  totalRewardsPaid: number;
  conversionRate: number;
  avgRewardAmount: number;
  topReferrers: Array<{
    id: string;
    name: string;
    referralCount: number;
    totalEarned: number;
  }>;
}

export interface ReferralAnalytics {
  referralsByType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  referralsByMonth: Array<{
    month: string;
    count: number;
    qualified: number;
    rewarded: number;
  }>;
  rewardsByType: Array<{
    type: string;
    amount: number;
    count: number;
  }>;
  performanceMetrics: {
    avgTimeToQualify: number;
    avgTimeToReward: number;
    qualificationRate: number;
    rewardRedemptionRate: number;
  };
}

export interface FraudStats {
  suspiciousReferrals: number;
  blockedUsers: number;
  falsePositiveRate: number;
  detectionRate: number;
}

export interface PendingPayout {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  rewardType: string;
  referralCount: number;
  createdAt: string;
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
}

export const referralAdminAPI = {
  // Dashboard & Analytics
  async getStats() {
    return apiClient.get<ReferralStats>("/admin/referrals/stats");
  },

  async getAnalytics(params?: { startDate?: string; endDate?: string }) {
    return apiClient.get<ReferralAnalytics>("/admin/referrals/analytics", { params });
  },

  async getReferrals(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  }) {
    return apiClient.get("/admin/referrals", { params });
  },

  async getReferralById(id: string) {
    return apiClient.get(`/admin/referrals/${id}`);
  },

  async updateReferralStatus(id: string, data: { status: string; notes?: string }) {
    return apiClient.patch(`/admin/referrals/${id}/status`, data);
  },

  // User Referrals
  async getUserReferrals(userId: string, params?: { page?: number; limit?: number }) {
    return apiClient.get(`/admin/referrals/users/${userId}`, { params });
  },

  async getUserReferralStats(userId: string) {
    return apiClient.get(`/admin/referrals/users/${userId}/stats`);
  },

  // Rewards Management
  async getPendingRewards(params?: {
    page?: number;
    limit?: number;
    rewardType?: string;
    minAmount?: number;
  }) {
    return apiClient.get("/admin/referrals/rewards/pending", { params });
  },

  async approveReward(rewardId: string, data?: { notes?: string }) {
    return apiClient.post(`/admin/referrals/rewards/${rewardId}/approve`, data);
  },

  async rejectReward(rewardId: string, data: { reason: string }) {
    return apiClient.post(`/admin/referrals/rewards/${rewardId}/reject`, data);
  },

  async bulkApproveRewards(rewardIds: string[]) {
    return apiClient.post("/admin/referrals/rewards/bulk-approve", { rewardIds });
  },

  // Payout Management
  async getPendingPayouts(params?: {
    page?: number;
    limit?: number;
    minAmount?: number;
  }) {
    return apiClient.get<{ data: PendingPayout[] }>(
      "/admin/referrals/payouts/pending",
      { params }
    );
  },

  async processPayout(payoutId: string) {
    return apiClient.post(`/admin/referrals/payouts/${payoutId}/process`);
  },

  async bulkProcessPayouts(payoutIds: string[]) {
    return apiClient.post("/admin/referrals/payouts/bulk-process", { payoutIds });
  },

  async getPayoutHistory(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) {
    return apiClient.get("/admin/referrals/payouts/history", { params });
  },

  // Fraud Detection
  async getFraudStats() {
    return apiClient.get<{ data: FraudStats }>("/admin/referrals/fraud/stats");
  },

  async getFraudActivities(params?: {
    page?: number;
    limit?: number;
    status?: string;
    riskLevel?: string;
  }) {
    return apiClient.get("/admin/referrals/fraud/activities", { params });
  },

  async updateFraudActivity(
    activityId: string,
    data: { action: "CONFIRM" | "DISMISS" | "BLOCK"; notes: string }
  ) {
    return apiClient.patch(`/admin/referrals/fraud/activities/${activityId}`, data);
  },

  async blockUserForFraud(userId: string, data: { reason: string; duration?: number }) {
    return apiClient.post(`/admin/referrals/fraud/block-user/${userId}`, data);
  },

  // Disputes
  async getDisputes(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
  }) {
    return apiClient.get("/admin/referrals/disputes", { params });
  },

  async assignDispute(disputeId: string) {
    return apiClient.post(`/admin/referrals/disputes/${disputeId}/assign`);
  },

  async resolveDispute(
    disputeId: string,
    data: { status: "RESOLVED" | "REJECTED"; resolution: string }
  ) {
    return apiClient.post(`/admin/referrals/disputes/${disputeId}/resolve`, data);
  },

  // Settings
  async getSettings() {
    return apiClient.get("/admin/referrals/settings");
  },

  async updateSettings(settings: any) {
    return apiClient.put("/admin/referrals/settings", settings);
  },

  async getRewardTypes() {
    return apiClient.get("/admin/referrals/settings/reward-types");
  },

  // Export & Reports
  async exportReferrals(params?: {
    format?: "csv" | "xlsx";
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    return apiClient.get("/admin/referrals/export", {
      params,
      responseType: "blob",
    });
  },

  async exportPayouts(params?: {
    format?: "csv" | "xlsx";
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    return apiClient.get("/admin/referrals/payouts/export", {
      params,
      responseType: "blob",
    });
  },

  async generateReport(params: {
    reportType: "overview" | "performance" | "fraud" | "payouts";
    startDate: string;
    endDate: string;
    format?: "pdf" | "xlsx";
  }) {
    return apiClient.post("/admin/referrals/reports/generate", params, {
      responseType: "blob",
    });
  },

  // Bulk Operations
  async bulkUpdateStatus(referralIds: string[], status: string, notes?: string) {
    return apiClient.post("/admin/referrals/bulk-update-status", {
      referralIds,
      status,
      notes,
    });
  },

  async bulkDeleteReferrals(referralIds: string[]) {
    return apiClient.post("/admin/referrals/bulk-delete", { referralIds });
  },

  // System Health
  async getSystemHealth() {
    return apiClient.get("/admin/referrals/system/health");
  },

  async recalculateRewards(userId?: string) {
    return apiClient.post("/admin/referrals/system/recalculate-rewards", { userId });
  },

  async syncReferralData() {
    return apiClient.post("/admin/referrals/system/sync-data");
  },
};