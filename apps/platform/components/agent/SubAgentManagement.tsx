"use client";

import { useEffect, useState, useCallback } from "react";
import { getAgentReferrals } from "@/lib/api/agentReferrals";
import type {
  ReferralPerformanceItem,
  ReferralPerformanceResponse,
} from "@/types/referral";
import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@newcondo/ui/components/card";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { Separator } from "@newcondo/ui/components/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/components/tabs";
import {
  AlertCircle,
  RefreshCw,
  Users,
  TrendingUp,
  MousePointerClick,
  DollarSign,
  Copy,
  CheckCheck,
  ExternalLink,
  Calendar,
  BarChart3,
  Link2,
} from "lucide-react";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/shared/feedback/LoadingSpinner";
import Image from "next/image";

export default function SubAgentManagement() {
  const [referrals, setReferrals] = useState<ReferralPerformanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("properties");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // ✅ Wrapped in useCallback to be safe if added to useEffect deps later
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const referralsRes = await getAgentReferrals({ limit: 50 });
      setReferrals(referralsRes);
    } catch (err: unknown) {
      // ✅ Replaced any with unknown
      setError(err instanceof Error ? err.message : "Failed to load sub-agent data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyLink = async (link: string, code: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // fallback
    }
  };

  const activeReferrals = referrals?.properties.filter((r) => r.isActive) ?? [];
  const inactiveReferrals = referrals?.properties.filter((r) => !r.isActive) ?? [];

  const totalClicks = referrals?.properties.reduce(
    (sum, r) => sum + r.metrics.clicks,
    0
  ) ?? 0;
  const totalConversions = referrals?.properties.reduce(
    (sum, r) => sum + r.metrics.conversions,
    0
  ) ?? 0;
  const totalEarnings = referrals?.properties.reduce(
    (sum, r) => sum + Number(r.metrics.totalEarnings),
    0
  ) ?? 0;

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
          <Button variant="outline" size="sm" onClick={fetchData}>
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
          <h1 className="text-3xl font-bold">Sub-Agent Management</h1>
          {/* ✅ Fixed apostrophe */}
          <p className="text-gray-600 mt-1">
            Manage properties you&apos;re promoting and track your referral links
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Active Links
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {activeReferrals.length}
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
              {totalClicks.toLocaleString()}
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
              {totalConversions}
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
              ₦{totalEarnings.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="properties">
            Active Promotions ({activeReferrals.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive ({inactiveReferrals.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Promotions */}
        <TabsContent value="properties" className="mt-6 space-y-4">
          {activeReferrals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 font-medium">No active promotions</p>
                <p className="text-sm text-gray-400 mt-1">
                  Request to promote properties to get your referral links
                </p>
              </CardContent>
            </Card>
          ) : (
            activeReferrals.map((referral) => (
              <ReferralPropertyCard
                key={referral.referralId}
                referral={referral}
                copiedCode={copiedCode}
                onCopyLink={handleCopyLink}
              />
            ))
          )}
        </TabsContent>

        {/* Inactive */}
        <TabsContent value="inactive" className="mt-6 space-y-4">
          {inactiveReferrals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No inactive promotions</p>
              </CardContent>
            </Card>
          ) : (
            inactiveReferrals.map((referral) => (
              <ReferralPropertyCard
                key={referral.referralId}
                referral={referral}
                copiedCode={copiedCode}
                onCopyLink={handleCopyLink}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReferralPropertyCard({
  referral,
  copiedCode,
  onCopyLink,
}: {
  referral: ReferralPerformanceItem;
  copiedCode: string | null;
  onCopyLink: (link: string, code: string) => void;
}) {
  const isCopied = copiedCode === referral.referralCode;
  const conversionRate = parseFloat(referral.metrics.conversionRate);

  return (
    <Card className={!referral.isActive ? "opacity-60" : ""}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* ✅ Replaced <img> with Next.js <Image /> */}
          {referral.property.image ? (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={referral.property.image}
                alt={referral.property.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <ExternalLink className="h-8 w-8 text-gray-400" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg leading-tight">
                    {referral.property.title}
                  </h3>
                  <Badge variant={referral.isActive ? "default" : "secondary"}>
                    {referral.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{referral.property.address}</p>
                {referral.property.price && (
                  <p className="text-sm font-medium text-green-600 mt-1">
                    ₦{Number(referral.property.price).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm text-gray-500">Earnings</p>
                <p className="font-bold text-green-600">
                  ₦{Number(referral.metrics.totalEarnings).toLocaleString()}
                </p>
              </div>
            </div>

            <Separator className="my-3" />

            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Clicks</p>
                <p className="font-semibold text-sm">{referral.metrics.clicks.toLocaleString()}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Unique</p>
                <p className="font-semibold text-sm">{referral.metrics.uniqueClicks.toLocaleString()}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Conversions</p>
                <p className="font-semibold text-sm">{referral.metrics.conversions}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Conv. Rate</p>
                <p className="font-semibold text-sm">
                  {isNaN(conversionRate) ? "0%" : `${conversionRate.toFixed(1)}%`}
                </p>
              </div>
            </div>

            {/* Referral Link Row */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 border rounded-md px-3 py-2 text-xs text-gray-600 truncate font-mono">
                {referral.referralLink}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopyLink(referral.referralLink, referral.referralCode)}
                className="flex-shrink-0"
              >
                {isCopied ? (
                  <>
                    <CheckCheck className="h-3 w-3 mr-1 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(referral.referralLink, "_blank")}
                className="flex-shrink-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>

            {referral.createdAt && (
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created {format(new Date(referral.createdAt), "MMM d, yyyy")}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}