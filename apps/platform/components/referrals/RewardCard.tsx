// apps/platform/components/referrals/RewardCard.tsx

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Reward } from '@/types/reward';
import {
  formatRewardAmount,
  getRewardTypeDisplay,
  getRewardStatusDisplay,
  formatExpiryDisplay,
  isRewardExpiringSoon,
} from '@/lib/utils/rewardFormatters';
import { formatRewardDate } from '@/lib/utils/rewardFormatters';
import { Gift, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RewardCardProps {
  reward: Reward;
  onRedeem?: (reward: Reward) => void;
  onApply?: (reward: Reward) => void;
}

export function RewardCard({ reward, onRedeem, onApply }: RewardCardProps) {
  const typeInfo = getRewardTypeDisplay(reward.rewardType);
  const statusInfo = getRewardStatusDisplay(reward.status);
  const isExpiringSoon = isRewardExpiringSoon(reward.expiresAt);

  const canRedeem = reward.status === 'APPROVED' && !reward.isRedeemed && !reward.isPaidOut;
  const canApply = reward.rewardType === 'SERVICE_CREDIT' && canRedeem;

  return (
    <Card className={cn(
      "hover:shadow-md transition-shadow",
      isExpiringSoon && "border-yellow-300"
    )}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-${typeInfo.color}-50`}>
              <span className="text-2xl">{typeInfo.icon}</span>
            </div>
            <div>
              <h4 className="font-medium">{typeInfo.name}</h4>
              <p className="text-sm text-muted-foreground">
                {reward.description}
              </p>
            </div>
          </div>
          
          <Badge variant={statusInfo.variant}>
            {statusInfo.icon} {statusInfo.label}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {formatRewardAmount(reward.amount)}
            </span>
            {reward.expiresAt && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatExpiryDisplay(reward.expiresAt)}</span>
              </div>
            )}
          </div>

          {isExpiringSoon && (
            <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
              <AlertCircle className="h-4 w-4" />
              <span>Expiring soon!</span>
            </div>
          )}

          {canRedeem && (
            <div className="flex gap-2 pt-2">
              {canApply && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onApply?.(reward)}
                >
                  Apply Credit
                </Button>
              )}
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onRedeem?.(reward)}
              >
                <Gift className="h-4 w-4 mr-2" />
                Redeem
              </Button>
            </div>
          )}

          {reward.isRedeemed && reward.redeemedAt && (
            <p className="text-xs text-green-600">
              ✓ Redeemed on {formatRewardDate(reward.redeemedAt)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}