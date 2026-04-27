'use client';

import { useState, useEffect } from 'react';
import { CompensationBreakdown } from '@/components/marking/CompensationBreakdown';
import MarkingHistoryList from '@/components/marking/MarkingHistoryList';
import { Button } from '@newcondo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui';
import {
  Loader2,
  TrendingUp,
  Wallet,
  Clock,
  Download,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface EarningsData {
  totalEarnings: number;
  pendingEarnings: number;
  releasedEarnings: number;
  totalJobs: number;
  completedJobs: number;
  averageEarningPerJob: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  earnings: Array<{
    id: string;
    amount: number;
    status: string;
    jobId: string;
    property: {
      title: string;
      address: string;
    };
    createdAt: string;
    releasedAt?: string;
  }>;
}

export default function MarkingEarningsPage() {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/marking/earnings');

      if (!response.ok) throw new Error('Failed to fetch earnings');

      const data = await response.json();
      setEarningsData(data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/marking/earnings/export', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marking-earnings-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting earnings:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!earningsData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">
          Failed to load earnings data
        </p>
      </div>
    );
  }

  const earningsGrowth =
    earningsData.lastMonthEarnings > 0
      ? ((earningsData.thisMonthEarnings - earningsData.lastMonthEarnings) /
        earningsData.lastMonthEarnings) *
      100
      : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Marking Earnings</h1>
            <p className="text-muted-foreground mt-1">
              Track your property marking compensation
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export Report
          </Button>
        </div>

        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Earnings
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{earningsData.totalEarnings.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All-time earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Release
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{earningsData.pendingEarnings.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting confirmation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                This Month
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{earningsData.thisMonthEarnings.toLocaleString()}
              </div>
              <p
                className={`text-xs mt-1 ${earningsGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
              >
                {earningsGrowth >= 0 ? '+' : ''}
                {earningsGrowth.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Avg per Job
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{earningsData.averageEarningPerJob.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {earningsData.completedJobs} completed jobs
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compensation Breakdown */}
      <div className="mb-8">
        <CompensationBreakdown
          markingType="agent_network"
          isPropertyOwner={false}
          userRole={user?.role as 'OWNER' | 'AGENT' | 'RENTER'}
        />
      </div>

      {/* Earnings History */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Earnings History</h2>
        {user && (
          <MarkingHistoryList
            userId={user.id}
            role={user.role === 'AGENT' ? 'agent' : 'requester'}
          />
        )}
      </div>
    </div>
  );
}