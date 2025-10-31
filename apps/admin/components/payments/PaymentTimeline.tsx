// apps/admin/src/components/payments/PaymentTimeline.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type:
    | 'CREATED'
    | 'INITIATED'
    | 'PROCESSING'
    | 'SUCCESS'
    | 'FAILED'
    | 'HELD'
    | 'RELEASED'
    | 'REFUNDED'
    | 'CANCELLED';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface PaymentTimelineProps {
  transactionId: string;
}

export default function PaymentTimeline({ transactionId }: PaymentTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [transactionId]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/payments/${transactionId}/timeline`);
      if (!response.ok) throw new Error('Failed to fetch timeline');

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'CREATED':
        return <Clock className="h-5 w-5 text-gray-500" />;
      case 'INITIATED':
        return <DollarSign className="h-5 w-5 text-blue-500" />;
      case 'PROCESSING':
        return <RefreshCw className="h-5 w-5 text-yellow-500" />;
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'HELD':
        return <Lock className="h-5 w-5 text-blue-500" />;
      case 'RELEASED':
        return <Unlock className="h-5 w-5 text-emerald-500" />;
      case 'REFUNDED':
        return <RefreshCw className="h-5 w-5 text-purple-500" />;
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'CREATED':
        return 'border-gray-500';
      case 'INITIATED':
        return 'border-blue-500';
      case 'PROCESSING':
        return 'border-yellow-500';
      case 'SUCCESS':
        return 'border-green-500';
      case 'FAILED':
        return 'border-red-500';
      case 'HELD':
        return 'border-blue-500';
      case 'RELEASED':
        return 'border-emerald-500';
      case 'REFUNDED':
        return 'border-purple-500';
      case 'CANCELLED':
        return 'border-gray-500';
      default:
        return 'border-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let relative = '';
    if (days > 0) {
      relative = `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      relative = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      relative = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      relative = 'Just now';
    }

    return {
      relative,
      absolute: date.toLocaleString(),
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payment Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No timeline events available
          </div>
        ) : (
          <div className="relative space-y-4">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {events.map((event, index) => {
              const time = formatTimestamp(event.timestamp);
              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 bg-white ${getEventColor(
                      event.type
                    )}`}
                  >
                    {getEventIcon(event.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {event.type}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{time.relative}</p>
                          <p className="text-xs text-gray-400 mt-1">{time.absolute}</p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mt-2">{event.description}</p>

                      {/* Metadata */}
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(event.metadata).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="text-gray-500">{key}:</span>{' '}
                                <span className="font-medium text-gray-900">
                                  {typeof value === 'object'
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}