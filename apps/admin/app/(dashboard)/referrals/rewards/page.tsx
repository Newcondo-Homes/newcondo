// apps/admin/src/app/(dashboard)/referrals/rewards/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import RewardApprovalTable from "@/components/referrals/RewardApprovalTable";
import { referralAdminAPI } from "@/lib/api/referralAdmin";
import { Award, CheckCircle, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RewardSummary {
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  rejectedCount: number;
  totalPaidOut: number;
}

export default function RewardManagementPage() {
  const [summary, setSummary] = useState<RewardSummary>({
    pendingCount: 0,
    pendingAmount: 0,
    approvedCount: 0,
    approvedAmount: 0,
    rejectedCount: 0,
    totalPaidOut: 0,
  });
  const [pendingRewards, setPendingRewards] = useState<any[]>([]);
  const [approvedRewards, setApprovedRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const [pendingRes, stats] = await Promise.all([
        referralAdminAPI.getPendingRewards({ page: 1, limit: 100 }),
        referralAdminAPI.getStats(),
      ]);

      setPendingRewards(pendingRes.data.rewards || []);
      
      // Calculate summary
      const pending = pendingRes.data.rewards || [];
      setSummary({
        pendingCount: pending.length,
        pendingAmount: pending.reduce((sum: number, r: any) => sum + r.amount, 0),
        approvedCount: stats.data.qualifiedReferrals || 0,
        approvedAmount: stats.data.totalRewardsPaid || 0,
        rejectedCount: 0,
        totalPaidOut: stats.data.totalRewardsPaid || 0,
      });
    } catch (error) {
      console.error("Failed to load rewards:", error);
      toast({
        title: "Error",
        description: "Failed to load reward data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (rewardId: string) => {
    try {
      await referralAdminAPI.approveReward(rewardId, {
        notes: "Approved by admin",
      });

      toast({
        title: "Success",
        description: "Reward approved successfully",
      });

      loadRewards();
    } catch (error) {
      console.error("Approval failed:", error);
      toast({
        title: "Error",
        description: "Failed to approve reward",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (rewardId: string, reason: string) => {
    try {
      await referralAdminAPI.rejectReward(rewardId, { reason });

      toast({
        title: "Success",
        description: "Reward rejected",
      });

      loadRewards();
    } catch (error) {
      console.error("Rejection failed:", error);
      toast({
        title: "Error",
        description: "Failed to reject reward",
        variant: "destructive",
      });
    }
  };

  const handleBulkApprove = async (rewardIds: string[]) => {
    try {
      await referralAdminAPI.bulkApproveRewards(rewardIds);

      toast({
        title: "Success",
        description: `${rewardIds.length} rewards approved`,
      });

      loadRewards();
    } catch (error) {
      console.error("Bulk approval failed:", error);
      toast({
        title: "Error",
        description: "Failed to approve rewards",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reward Management</h1>
          <p className="text-muted-foreground">
            Review and approve referral rewards
          </p>
        </div>
        <Button onClick={loadRewards} variant="outline" disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Rewards</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              ₦{summary.pendingAmount.toLocaleString()} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Rewards</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.approvedCount}</div>
            <p className="text-xs text-muted-foreground">
              ₦{summary.approvedAmount.toLocaleString()} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Rewards</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.rejectedCount}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{summary.totalPaidOut.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime payouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Rewards Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({summary.pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({summary.approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reward Approvals</CardTitle>
              <CardDescription>
                Review and approve or reject pending rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RewardApprovalTable
                rewards={pendingRewards}
                loading={loading}
                onApprove={handleApprove}
                onReject={handleReject}
                onBulkApprove={handleBulkApprove}
                onRefresh={loadRewards}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Rewards</CardTitle>
              <CardDescription>Successfully approved rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <RewardApprovalTable
                rewards={approvedRewards}
                loading={loading}
                onRefresh={loadRewards}
                showActions={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Rewards</CardTitle>
              <CardDescription>Rewards that were rejected</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No rejected rewards
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}