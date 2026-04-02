// apps/platform/components/referrals/ReferralCard.tsx

'use client';

import { Card, CardContent } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@newcondo/ui/components/avatar';
import { Referral } from '@/types/referral';
import { formatReferralStatus, formatCurrency, getReferralTypeInfo } from '@/lib/utils/referralHelpers';
import { formatRewardDate } from '@/lib/utils/rewardFormatters';
import { User, Calendar, Gift } from 'lucide-react';

interface ReferralCardProps {
  referral: Referral;
  onClick?: () => void;
}

export function ReferralCard({ referral, onClick }: ReferralCardProps) {
  const statusInfo = formatReferralStatus(referral.status);
  const typeInfo = referral.referralType ? getReferralTypeInfo(referral.referralType) : null;

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={referral.referred?.image} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">
                {referral.referred?.name || 'Anonymous User'}
              </h4>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <span className="capitalize">{referral.referred?.role?.toLowerCase()}</span>
                {typeInfo && (
                  <>
                    <span>•</span>
                    <span>{typeInfo.icon} {typeInfo.name}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          
          <Badge 
            variant={statusInfo.color === 'green' ? 'default' : 'secondary'}
            className="gap-1"
          >
            <span>{statusInfo.icon}</span>
            <span>{statusInfo.label}</span>
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatRewardDate(referral.createdAt)}</span>
          </div>
          
          {referral.referrerReward && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gift className="h-4 w-4" />
              <span>{formatCurrency(referral.referrerReward)}</span>
            </div>
          )}
        </div>

        {referral.qualificationMet && referral.qualifiedAt && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-green-600">
              ✓ Qualified on {formatRewardDate(referral.qualifiedAt)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}