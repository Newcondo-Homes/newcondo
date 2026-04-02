// apps/platform/components/rentals/RentalStatusTimeline.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { CheckCircle, Circle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'current' | 'pending' | 'failed';
}

interface RentalStatusTimelineProps {
  events: TimelineEvent[];
}

export function RentalStatusTimeline({ events }: RentalStatusTimelineProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  const getStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-500';
      case 'current':
        return 'border-blue-500';
      case 'failed':
        return 'border-red-500';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Rental Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="relative flex gap-4">
              {/* Timeline line */}
              {index !== events.length - 1 && (
                <div
                  className={cn(
                    'absolute left-[10px] top-[28px] h-full w-0.5',
                    event.status === 'completed'
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  )}
                />
              )}

              {/* Status icon */}
              <div
                className={cn(
                  'relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-white',
                  getStatusColor(event.status)
                )}
              >
                {getStatusIcon(event.status)}
              </div>

              {/* Event content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4
                      className={cn(
                        'font-semibold',
                        event.status === 'current' && 'text-blue-600',
                        event.status === 'failed' && 'text-red-600'
                      )}
                    >
                      {event.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.description}
                    </p>
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(event.timestamp)}
                  </time>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}