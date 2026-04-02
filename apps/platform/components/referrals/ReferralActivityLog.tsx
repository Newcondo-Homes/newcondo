// apps/platform/components/referrals/ReferralActivityLog.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { ScrollArea } from '@newcondo/ui/components/scroll-area';
import {
  Eye,
  MousePointerClick,
  CheckCircle,
  UserPlus,
  Clock,
} from 'lucide-react';

type ActivityType = 'VIEW' | 'CLICK' | 'CONVERSION' | 'AGENT_JOINED';

interface ReferralActivity {
  id: string;
  type: ActivityType;
  agentName?: string;
  propertyTitle: string;
  timestamp: Date;
  metadata?: {
    amount?: number;
    location?: string;
  };
}

interface ReferralActivityLogProps {
  activities: ReferralActivity[];
  maxHeight?: string;
  currency?: string;
}

export function ReferralActivityLog({
  activities,
  maxHeight = '500px',
  currency = 'NGN',
}: ReferralActivityLogProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'VIEW':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'CLICK':
        return <MousePointerClick className="h-4 w-4 text-purple-500" />;
      case 'CONVERSION':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'AGENT_JOINED':
        return <UserPlus className="h-4 w-4 text-orange-500" />;
    }
  };

  const getActivityBadge = (type: ActivityType) => {
    switch (type) {
      case 'VIEW':
        return <Badge className="bg-blue-500">View</Badge>;
      case 'CLICK':
        return <Badge className="bg-purple-500">Click</Badge>;
      case 'CONVERSION':
        return <Badge className="bg-green-500">Conversion</Badge>;
      case 'AGENT_JOINED':
        return <Badge className="bg-orange-500">Agent Joined</Badge>;
    }
  };

  const getActivityMessage = (activity: ReferralActivity) => {
    switch (activity.type) {
      case 'VIEW':
        return (
          <>
            <span className="font-medium">{activity.agentName || 'Someone'}</span>{' '}
            viewed <span className="font-medium">{activity.propertyTitle}</span>
          </>
        );
      case 'CLICK':
        return (
          <>
            <span className="font-medium">{activity.agentName || 'Someone'}</span>{' '}
            clicked on <span className="font-medium">{activity.propertyTitle}</span>
          </>
        );
      case 'CONVERSION':
        return (
          <>
            <span className="font-medium">{activity.agentName || 'Someone'}</span>{' '}
            converted on{' '}
            <span className="font-medium">{activity.propertyTitle}</span>
            {activity.metadata?.amount && (
              <span className="text-green-600 font-semibold ml-1">
                ({formatCurrency(activity.metadata.amount)})
              </span>
            )}
          </>
        );
      case 'AGENT_JOINED':
        return (
          <>
            <span className="font-medium">{activity.agentName}</span> started
            promoting <span className="font-medium">{activity.propertyTitle}</span>
          </>
        );
    }
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No activity recorded yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ height: maxHeight }}>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={`flex gap-4 pb-4 ${
                  index !== activities.length - 1 ? 'border-b' : ''
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  {getActivityIcon(activity.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {getActivityBadge(activity.type)}
                    <span className="text-xs text-muted-foreground">
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{getActivityMessage(activity)}</p>
                  {activity.metadata?.location && (
                    <p className="text-xs text-muted-foreground">
                      Location: {activity.metadata.location}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}