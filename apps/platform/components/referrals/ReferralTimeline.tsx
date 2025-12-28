// apps/platform/components/referrals/ReferralTimeline.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReferralTimeline } from '@/hooks/useReferrals';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRewardDateTime } from '@/lib/utils/rewardFormatters';
import { UserPlus, CheckCircle, Gift, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ReferralTimeline() {
  const { timeline, isLoading } = useReferralTimeline();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'referral_sent':
        return <Send className="h-5 w-5 text-blue-600" />;
      case 'referral_joined':
        return <UserPlus className="h-5 w-5 text-green-600" />;
      case 'referral_qualified':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'reward_earned':
        return <Gift className="h-5 w-5 text-purple-600" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {timeline.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No activity yet. Start referring to see your timeline!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {timeline.map((activity, index) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="p-2 rounded-full bg-muted">
                      {getIcon(activity.type)}
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="absolute left-1/2 top-10 bottom-0 w-px bg-border -translate-x-1/2" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRewardDateTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}