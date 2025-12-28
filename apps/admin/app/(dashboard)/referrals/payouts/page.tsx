// apps/admin/src/app/(dashboard)/referrals/payouts/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PayoutManagement from "@/components/referrals/PayoutManagement";
import BulkPayoutProcessor from "@/components/referrals/BulkPayoutProcessor";
import { referralAdminAPI } from "@/lib/api/referralAdmin";
import { Wallet, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PayoutStats {
  pendingCount: number;
  pendingAmount: number;
  processedToday: number;
  processedTodayAmount: number;
  totalProcessed: number;
  totalProcessedAmount: number;
}

export default function PayoutManagementPage() {
  const [stats, setStats] = useState<PayoutStats>({
    pendingCount: 0,
    pendingAmount: 0,
    processedToday: 0,
    processedTodayAmount: 0,
    totalProcessed: 0,
    totalProcessedAmount: 0,
  });
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();

  useEffect(() => {
    loadPayoutData();
  }, []);

  const loadPayoutData = async () => {
    try {
      setLoading(true);
      const [pendingRes, historyRes] = await Promise.all([
        referralAdminAPI.getPendingPayouts({ page: 1, limit: 100 }),
        referralAdminAPI.getPayoutHistory({ page: 1, limit: 50 }),
      ]);

      const pending = pendingRes.data.data || [];
      const history = historyRes.data.payouts || [];

      setPendingPayouts(pending);
      setPayoutHistory(history);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const processedToday = history.filter(
        (p: any) => new Date(p.paidAt) >= today
      );

      setStats({
        pendingCount: pending.length,
        pendingAmount: pending.reduce((sum: number, p: any) => sum + p.amount, 0),
        processedToday: processedToday.length,
        processedTodayAmount: processedToday.reduce((sum: number, p: any) => sum + p.amount, 0),
        totalProcessed: history.length,
        totalProcessedAmount: history.reduce((sum: number, p: any) => sum + p.amount, 0),
      });
    } catch (error) {
      console.error("Failed to load payout data:", error);
      toast({
        title: "Error",
        description: "Failed to load payout data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payout Management</h1>
          <p className="text-muted-foreground">
            Process and track referral reward payouts
          </p>
        </div>
        <Button onClick={loadPayoutData} variant="outline" disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              ₦{stats.pendingAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processedToday}</div>
            <p className="text-xs text-muted-foreground">
              ₦{stats.processedTodayAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProcessed}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{stats.totalProcessedAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime payouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({stats.pendingCount})
          </TabsTrigger>
          <TabsTrigger value="bulk">Bulk Process</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payouts</CardTitle>
              <CardDescription>
                Individual payout requests awaiting processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PayoutManagement
                payouts={pendingPayouts}
                loading={loading}
                onRefresh={loadPayoutData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <BulkPayoutProcessor
            pendingPayouts={pendingPayouts}
            onPayoutsProcessed={loadPayoutData}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>Recently processed payouts</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : payoutHistory.length > 0 ? (
                <div className="space-y-2">
                  {payoutHistory.map((payout: any) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{payout.userName}</p>
                        <p className="text-sm text-muted-foreground">
                          {payout.userEmail}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(payout.paidAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          ₦{payout.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payout.rewardType}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No payout history available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}