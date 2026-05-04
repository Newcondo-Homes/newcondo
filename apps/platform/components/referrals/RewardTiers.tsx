// apps/platform/components/referrals/RewardTiers.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { useRewardTiers } from '@/hooks/useRewards';
import { REWARD_TIERS } from '@/lib/constants/rewardTypes';
import { formatCurrency } from '@/lib/utils/referralHelpers';
import { Badge } from '@newcondo/ui/components/badge';
import { Progress } from '@newcondo/ui/components/progress';
import { Check } from 'lucide-react';
import { Skeleton } from '@newcondo/ui/components/skeleton';
import { cn } from '@/lib/utils';

export function RewardTiers() {
  const { currentTier, nextTier, progress, isLoading } = useRewardTiers();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reward Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reward Tiers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {REWARD_TIERS.map((tier) => {
            const isCurrentTier = currentTier?.name === tier.name;
            const isPassed = currentTier && tier.minReferrals < currentTier.minReferrals;
            const isNext = nextTier?.name === tier.name;

            return (
              <div
                key={tier.id}
                className={cn(
                  "relative p-4 rounded-lg border-2 transition-all",
                  isCurrentTier && "border-blue-500 bg-blue-50",
                  isPassed && "border-green-200 bg-green-50",
                  !isCurrentTier && !isPassed && "border-gray-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{tier.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{tier.name}</h4>
                        {isPassed && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                        {isCurrentTier && (
                          <Badge>Current</Badge>
                        )}
                        {isNext && (
                          <Badge variant="outline">Next</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tier.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tier.minReferrals}
                        {tier.maxReferrals ? `-${tier.maxReferrals}` : '+'} referrals
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(tier.rewardAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      per referral
                    </p>
                  </div>
                </div>

                {isNext && typeof progress === 'number' && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span>Progress to {tier.name}</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}