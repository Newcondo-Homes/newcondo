// apps/platform/components/referrals/ReferralList.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { useReferrals } from '@/hooks/useReferrals';
import { ReferralCard } from './ReferralCard';
import { ReferralEmptyState } from './ReferralEmptyState';
import { Skeleton } from '@newcondo/ui/components/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/components/select';

export function ReferralList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<'createdAt' | 'qualifiedAt' | 'reward'>('createdAt');

  const { referrals, totalPages, isLoading } = useReferrals({
    page,
    pageSize: 10,
    status: status as any,
    sortBy,
    sortOrder: 'desc',
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Referrals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Referrals</CardTitle>
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                <SelectItem value="REWARDED">Rewarded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Most Recent</SelectItem>
                <SelectItem value="qualifiedAt">Qualified Date</SelectItem>
                <SelectItem value="reward">Reward Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {referrals.length === 0 ? (
          <ReferralEmptyState />
        ) : (
          <>
            <div className="space-y-4">
              {referrals.map((referral) => (
                <ReferralCard key={referral.id} referral={referral} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
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
  );
}