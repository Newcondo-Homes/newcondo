// apps/platform/components/referrals/ReferralProgress.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useReferralStats } from '@/hooks/useReferrals';
import { useNextMilestone } from '@/hooks/useRewards';
import { formatCurrency } from '@/lib/utils/referralHelpers';
import { Trophy, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function ReferralProgress() {
  const { stats } = useReferralStats();
  const { milestone, isLoading } = useNextMilestone();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress to Next Milestone</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!milestone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            All Milestones Completed!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Congratulations! You've reached all referral milestones.
          </p>
        </CardContent>
      </Card>
    );
  }

  const current = stats?.qualifiedReferrals || 0;
  const target = milestone.count;
  const progress = (current / target) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Progress to Next Milestone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {current} / {target} Referrals
            </span>
            <span className="text-sm text-muted-foreground">
              {milestone.remaining} remaining
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{milestone.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Unlock this milestone reward
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(milestone.bonus)}
              </p>
              <p className="text-xs text-muted-foreground">Bonus</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}