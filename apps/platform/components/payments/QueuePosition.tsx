import React from 'react';
import { Users, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Progress } from '@newcondo/ui/components/progress';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';

interface QueuePositionProps {
  position: number;
  totalInQueue: number;
  estimatedWaitTime?: number; // in minutes
  propertyId?: string;
  className?: string;
}

export const QueuePosition: React.FC<QueuePositionProps> = ({
  position,
  totalInQueue,
  estimatedWaitTime,
  // propertyId,
  className = '',
}) => {
  const isNext = position === 1;
  const isInQueue = position > 0;

  const getQueueStatus = () => {
    if (position === 0) return { color: 'green', label: 'Ready', icon: TrendingUp };
    if (position === 1) return { color: 'blue', label: 'Next in line', icon: Clock };
    if (position <= 3) return { color: 'yellow', label: 'In queue', icon: Users };
    return { color: 'gray', label: 'Waiting', icon: AlertTriangle };
  };

  const status = getQueueStatus();
  const StatusIcon = status.icon;
  const progressPercentage = totalInQueue > 0 ? ((totalInQueue - position) / totalInQueue) * 100 : 0;

  if (!isInQueue) {
    return (
      <Alert className={`bg-green-50 border-green-200 ${className}`}>
        <TrendingUp className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <span className="font-medium">You&apos;re up!</span> Proceed with your payment now.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 text-${status.color}-600`} />
            Queue Position
          </CardTitle>
          <Badge 
            variant={isNext ? 'default' : 'secondary'}
            className={isNext ? 'bg-blue-600' : ''}
          >
            {status.label}
          </Badge>
        </div>
        <CardDescription>
          {isNext 
            ? 'You\'re next in line for this property'
            : `${position - 1} ${position === 2 ? 'person' : 'people'} ahead of you`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Your position</span>
            <span className="font-bold text-2xl">{position}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{totalInQueue} total in queue</span>
            <span>{Math.round(progressPercentage)}% ahead</span>
          </div>
        </div>

        {estimatedWaitTime && estimatedWaitTime > 0 && (
          <div className="flex items-center gap-2 text-sm p-3 bg-gray-50 rounded-lg">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <p className="font-medium text-gray-700">Estimated wait time</p>
              <p className="text-gray-600">
                {estimatedWaitTime < 60 
                  ? `~${estimatedWaitTime} minutes`
                  : `~${Math.round(estimatedWaitTime / 60)} hour${estimatedWaitTime >= 120 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
        )}

        <Alert className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-xs text-blue-800">
            Stay on this page. You&apos;ll be notified when it&apos;s your turn to complete the payment.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

interface QueueSummaryProps {
  queueData: Array<{
    userId: string;
    position: number;
    joinedAt: Date;
  }>;
  currentUserId?: string;
}

export const QueueSummary: React.FC<QueueSummaryProps> = ({
  queueData,
  currentUserId,
}) => {
  // const userPosition = queueData.find(item => item.userId === currentUserId);
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Queue Status</h4>
      <div className="space-y-2">
        {queueData.slice(0, 5).map((item) => {
          const isCurrentUser = item.userId === currentUserId;
          const waitTime = Math.round((new Date().getTime() - new Date(item.joinedAt).getTime()) / 60000);
          
          return (
            <div
              key={item.userId}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isCurrentUser 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
                }`}>
                  {item.position}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {isCurrentUser ? 'You' : `User ${item.userId.slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    Waiting {waitTime} min{waitTime !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {item.position === 1 && (
                <Badge className="bg-green-600">Active</Badge>
              )}
            </div>
          );
        })}
        
        {queueData.length > 5 && (
          <p className="text-xs text-center text-gray-500 pt-2">
            +{queueData.length - 5} more in queue
          </p>
        )}
      </div>
    </div>
  );
};

interface MiniQueueIndicatorProps {
  position: number;
  showLabel?: boolean;
}

export const MiniQueueIndicator: React.FC<MiniQueueIndicatorProps> = ({
  position,
  showLabel = true,
}) => {
  if (position === 0) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
      <Users className="h-3 w-3" />
      {showLabel && <span>Queue:</span>}
      <span className="font-bold">#{position}</span>
    </div>
  );
};