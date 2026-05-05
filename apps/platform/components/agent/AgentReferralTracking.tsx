"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAgentReferrals,
  getAgentReferralStats,
  getReferralActivity,
  getReferralEarnings,
} from "@/lib/api/agentReferrals";
import type { ReferralPerformanceResponse, ReferralDashboard, ReferralAnalytics } from "@/types/referral";
import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/components/tabs";
import { Separator } from "@newcondo/ui/components/separator";
import {
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  MousePointerClick,
  Eye,
  RefreshCw,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/shared/feedback/LoadingSpinner";

// ✅ Typed interfaces replacing any
interface ReferralProperty {
  id: string;
  propertyId: string;
  propertyTitle?: string;
  status: string;
  views?: number;
  clicks?: number;
  commission?: number;
  createdAt?: string;
}

interface ActivityItem {
  id?: string;
  type: string;
  propertyTitle?: string;
  timestamp?: string;
}

interface EarningItem {
  id?: string;
  propertyTitle?: string;
  amount?: number;
  status: string;
  createdAt?: string;
}

interface EarningsResponse {
  earnings: EarningItem[];
  pendingTotal?: number;
  paidTotal?: number;
}

export default function AgentReferralTracking() {
  const [stats, setStats] = useState<ReferralDashboard | null>(null);
  const [referrals, setReferrals] = useState<ReferralPerformanceResponse | null>(null);
  const [activity, setActivity] = useState<ReferralAnalytics | null>(null);
  // ✅ Replaced any with EarningsResponse
  const [earnings, setEarnings] = useState<EarningsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsRes, referralsRes, activityRes, earningsRes] = await Promise.all([
        getAgentReferralStats(),
        getAgentReferrals({ limit: 20 }),
        getReferralActivity({ limit: 10, type: "ALL" }),
        getReferralEarnings(),
      ]);

      setStats(statsRes);
      setReferrals(referralsRes);
      setActivity(activityRes);
      // ✅ Replaced any cast with unknown round-trip
      setEarnings(earningsRes as unknown as EarningsResponse);
    } catch (err: unknown) {
      // ✅ Replaced any with unknown
      setError(err instanceof Error ? err.message : "Failed to load referral data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          {error}
          <Button variant="outline" size="sm" onClick={fetchAllData}>
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Referral Tracking</h1>
          <p className="text-gray-600 mt-1">Monitor your referrals, conversions, and earnings</p>
        </div>
        <Button variant="outline" onClick={fetchAllData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Referrals
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {stats?.summary.totalReferrals ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Conversions
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {stats?.summary.totalConversions ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Total Clicks
            </CardDescription>
            <CardTitle className="text-3xl text-purple-600">
              {stats?.summary.totalClicks ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Earnings
            </CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              ₦{(stats?.summary.totalEarnings ?? 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Referrals</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>

        {/* Referrals Tab */}
        <TabsContent value="overview" className="mt-6 space-y-4">
          {!referrals?.properties?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No referrals yet</p>
                <p className="text-sm text-gray-400">Share your referral link to get started</p>
              </CardContent>
            </Card>
          ) : (
            // ✅ ReferralProperty replaces any
            (referrals.properties as unknown as ReferralProperty[]).map((referral) => (
              <Card key={referral.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{referral.propertyTitle ?? referral.propertyId}</h3>
                        <Badge
                          variant={
                            referral.status === "CONVERTED"
                              ? "default"
                              : referral.status === "EXPIRED"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {referral.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {referral.views ?? 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" />
                          {referral.clicks ?? 0} clicks
                        </span>
                        {referral.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(referral.createdAt), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    {referral.commission && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Commission</p>
                        <p className="font-semibold text-green-600">
                          ₦{referral.commission.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          {!activity?.clicksOverTime?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No activity recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest interactions with your referral links</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ✅ ActivityItem replaces any */}
                {(activity.clicksOverTime as unknown as ActivityItem[]).map((item, index) => (
                  <div key={item.id ?? index}>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          {item.type === "VIEW" && <Eye className="h-4 w-4 text-blue-600" />}
                          {item.type === "CLICK" && <MousePointerClick className="h-4 w-4 text-purple-600" />}
                          {item.type === "CONVERSION" && <ArrowUpRight className="h-4 w-4 text-green-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.type}</p>
                          {item.propertyTitle && (
                            <p className="text-xs text-gray-500">{item.propertyTitle}</p>
                          )}
                        </div>
                      </div>
                      {item.timestamp && (
                        <p className="text-xs text-gray-500">
                          {format(new Date(item.timestamp), "MMM d, h:mm a")}
                        </p>
                      )}
                    </div>
                    {index < activity.clicksOverTime.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="mt-6 space-y-4">
          {!earnings?.earnings?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No earnings recorded yet</p>
                <p className="text-sm text-gray-400">Earnings appear when referrals convert</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Pending</CardDescription>
                    <CardTitle className="text-2xl text-yellow-600">
                      ₦{(earnings?.pendingTotal ?? 0).toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Paid Out</CardDescription>
                    <CardTitle className="text-2xl text-green-600">
                      ₦{(earnings?.paidTotal ?? 0).toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Earnings History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* ✅ EarningItem replaces any */}
                  {earnings.earnings.map((earning, index) => (
                    <div key={earning.id ?? index}>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium text-sm">{earning.propertyTitle ?? "Property Referral"}</p>
                          {earning.createdAt && (
                            <p className="text-xs text-gray-500">
                              {format(new Date(earning.createdAt), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₦{earning.amount?.toLocaleString()}</p>
                          <Badge
                            variant={earning.status === "PAID" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {earning.status}
                          </Badge>
                        </div>
                      </div>
                      {index < earnings.earnings.length - 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}