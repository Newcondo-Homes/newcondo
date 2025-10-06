"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { getNewcondoWallet, getWalletTransactions } from "@/lib/api/wallet";

interface WalletBalance {
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
  isActive: boolean;
  lastUpdated: string;
}

interface WalletStats {
  totalInflow: number;
  totalOutflow: number;
  pendingReleases: number;
  availableBalance: number;
  todayRevenue: number;
  monthRevenue: number;
}

export default function NewcondoBalance() {
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);

  const fetchWalletData = async () => {
    try {
      setError(null);
      const data = await getNewcondoWallet();
      setWallet(data.wallet);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallet data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
  };

  const handleExport = async () => {
    try {
      const response = await getWalletTransactions({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(),
        endDate: new Date().toISOString(),
        export: true
      });
      
      // Trigger download
      const blob = new Blob([JSON.stringify(response.transactions, null, 2)], {
        type: "application/json"
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `newcondo-wallet-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!wallet || !stats) {
    return null;
  }

  const balanceChange = stats.totalInflow - stats.totalOutflow;
  const isPositiveChange = balanceChange >= 0;

  return (
    <div className="space-y-4">
      {/* Main Balance Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Newcondo Platform Wallet
              </CardTitle>
              <CardDescription className="mt-1">
                Virtual account: {wallet.accountNumber} • {wallet.accountName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Current Balance */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  {showBalance ? formatCurrency(wallet.balance) : "₦••••••"}
                </span>
                <Badge variant={wallet.isActive ? "default" : "secondary"}>
                  {wallet.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Available Balance • Last updated: {new Date(wallet.lastUpdated).toLocaleString()}
              </p>
            </div>

            {/* Balance Change Indicator */}
            <div className="flex items-center gap-2">
              {isPositiveChange ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-lg font-semibold ${
                isPositiveChange ? "text-green-500" : "text-red-500"
              }`}>
                {showBalance ? formatCurrency(Math.abs(balanceChange)) : "₦••••••"}
              </span>
              <span className="text-sm text-muted-foreground">
                {isPositiveChange ? "increase" : "decrease"} (all time)
              </span>
            </div>

            {/* Pending Releases Alert */}
            {stats.pendingReleases > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {formatCurrency(stats.pendingReleases)} in pending releases (awaiting confirmation period)
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Inflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {showBalance ? formatCurrency(stats.totalInflow) : "₦••••••"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time collections
            </p>
          </CardContent>
        </Card>

        {/* Total Outflow */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Outflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {showBalance ? formatCurrency(stats.totalOutflow) : "₦••••••"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time disbursements
            </p>
          </CardContent>
        </Card>

        {/* Today's Revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showBalance ? formatCurrency(stats.todayRevenue) : "₦••••••"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Platform fees collected
            </p>
          </CardContent>
        </Card>

        {/* Month's Revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showBalance ? formatCurrency(stats.monthRevenue) : "₦••••••"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly collections
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Account Number</dt>
              <dd className="font-medium mt-1">{wallet.accountNumber}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Account Name</dt>
              <dd className="font-medium mt-1">{wallet.accountName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Available Balance</dt>
              <dd className="font-medium mt-1">
                {showBalance ? formatCurrency(stats.availableBalance) : "₦••••••"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Currency</dt>
              <dd className="font-medium mt-1">{wallet.currency}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}