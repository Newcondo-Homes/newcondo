// apps/platform/app/(dashboard)/referrals/history/page.tsx

'use client';

import { useState } from 'react';
// fix line 6: removed unused Metadata import
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Input } from '@newcondo/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/components/select';
import { useReferrals } from '@/hooks/useReferrals';
import { useReferralTimeline } from '@/hooks/useReferrals';
import { ReferralCard } from '@/components/referrals/ReferralCard';
import { Skeleton } from '@newcondo/ui/components/skeleton';
import { Search, Filter, Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
// fix line 22: removed unused formatRewardDate
import { formatRewardDateTime } from '@/lib/utils/rewardFormatters';

// fix line 33: typed the status union instead of `any`
type ReferralStatus = 'PENDING' | 'QUALIFIED' | 'REWARDED' | 'EXPIRED';

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  const { referrals, totalPages, isLoading } = useReferrals({
    page,
    pageSize: 20,
    status: statusFilter !== 'all' ? statusFilter as ReferralStatus : undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { timeline, isLoading: timelineLoading } = useReferralTimeline();

  const filteredReferrals = referrals.filter(ref => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      ref.referred?.name?.toLowerCase().includes(searchLower) ||
      ref.referred?.email?.toLowerCase().includes(searchLower) ||
      ref.referralCode.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Referral History</h1>
          <p className="text-muted-foreground mt-1">
            View all your referral activity and timeline
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search referrals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                <SelectItem value="REWARDED">Rewarded</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Total Referrals</p>
            <p className="text-2xl font-bold">{referrals.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">This Month</p>
            <p className="text-2xl font-bold">
              {referrals.filter(r => {
                const date = new Date(r.createdAt);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">This Week</p>
            <p className="text-2xl font-bold">
              {referrals.filter(r => {
                const date = new Date(r.createdAt);
                const now = new Date();
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return date >= weekAgo;
              }).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
            <p className="text-2xl font-bold">
              {referrals.length > 0
                ? Math.round((referrals.filter(r => r.qualificationMet).length / referrals.length) * 100)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Referrals List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Referrals ({filteredReferrals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : filteredReferrals.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No referrals found</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {filteredReferrals.map((referral) => (
                      <ReferralCard key={referral.id} referral={referral} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>

                      <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Timeline */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <div className="space-y-4">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activity yet
                </p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {timeline.map((activity) => (
                    <div key={activity.id} className="flex gap-3 pb-4 border-b last:border-0">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRewardDateTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}