// apps/admin/src/app/(dashboard)/referrals/fraud/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import FraudDetectionTable from "@/components/referrals/FraudDetectionTable";
import { referralAdminAPI } from "@/lib/api/referralAdmin";
import { AlertTriangle, Shield, TrendingUp, Users } from "lucide-react";

interface FraudStats {
  suspiciousReferrals: number;
  blockedUsers: number;
  falsePositiveRate: number;
  detectionRate: number;
}

interface FraudActivity {
  id: string;
  type: "SUSPICIOUS_PATTERN" | "DUPLICATE_ACCOUNT" | "FAKE_CONVERSION" | "BOT_ACTIVITY";
  userId: string;
  userName: string;
  description: string;
  riskScore: number;
  status: "FLAGGED" | "INVESTIGATING" | "CONFIRMED" | "FALSE_POSITIVE";
  detectedAt: string;
}

export default function FraudDetectionPage() {
  const [stats, setStats] = useState<FraudStats>({
    suspiciousReferrals: 0,
    blockedUsers: 0,
    falsePositiveRate: 0,
    detectionRate: 0,
  });
  const [activities, setActivities] = useState<FraudActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    loadFraudData();
  }, []);

  const loadFraudData = async () => {
    try {
      setLoading(true);
      const [statsRes, activitiesRes] = await Promise.all([
        referralAdminAPI.getFraudStats(),
        referralAdminAPI.getFraudActivities(),
      ]);

      setStats(statsRes.data);
      setActivities(activitiesRes.data);
    } catch (error) {
      console.error("Failed to load fraud data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter((activity) => {
    if (activeTab === "all") return true;
    if (activeTab === "high-risk") return activity.riskScore >= 70;
    if (activeTab === "investigating") return activity.status === "INVESTIGATING";
    if (activeTab === "confirmed") return activity.status === "CONFIRMED";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fraud Detection</h1>
          <p className="text-muted-foreground">
            Monitor and investigate suspicious referral activities
          </p>
        </div>
      </div>

      {/* Alert for high-priority fraud cases */}
      {activities.filter((a) => a.riskScore >= 80 && a.status === "FLAGGED").length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>High-Risk Activities Detected</AlertTitle>
          <AlertDescription>
            {activities.filter((a) => a.riskScore >= 80 && a.status === "FLAGGED").length} 
            high-risk referral activities require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Referrals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suspiciousReferrals}</div>
            <p className="text-xs text-muted-foreground">Flagged for review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Users</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blockedUsers}</div>
            <p className="text-xs text-muted-foreground">Confirmed fraud cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.detectionRate}%</div>
            <p className="text-xs text-muted-foreground">Fraud caught early</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">False Positive Rate</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.falsePositiveRate}%</div>
            <p className="text-xs text-muted-foreground">System accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Fraud Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fraud Activities</CardTitle>
          <CardDescription>
            Review and investigate suspicious referral patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Activities</TabsTrigger>
              <TabsTrigger value="high-risk">High Risk</TabsTrigger>
              <TabsTrigger value="investigating">Investigating</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed Fraud</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <FraudDetectionTable
                activities={filteredActivities}
                loading={loading}
                onRefresh={loadFraudData}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}