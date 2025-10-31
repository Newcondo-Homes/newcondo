// apps/admin/src/components/marking-jobs/JobTimeline.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
  MapPin,
  Camera,
  DollarSign,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 
    | 'CREATED'
    | 'PAYMENT_RECEIVED'
    | 'QUEUED'
    | 'ASSIGNED'
    | 'STARTED'
    | 'COMPLETED'
    | 'VERIFIED'
    | 'CANCELLED'
    | 'EXPIRED'
    | 'REASSIGNED'
    | 'PAYMENT_RELEASED';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    role: string;
  };
  metadata?: Record<string, any>;
}

interface JobTimelineProps {
  jobId: string;
  events: TimelineEvent[];
}

export default function JobTimeline({ jobId, events }: JobTimelineProps) {
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'CREATED':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'PAYMENT_RECEIVED':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'QUEUED':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'ASSIGNED':
        return <UserCheck className="h-5 w-5 text-indigo-500" />;
      case 'STARTED':
        return <MapPin className="h-5 w-5 text-yellow-500" />;
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'VERIFIED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'EXPIRED':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'REASSIGNED':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'PAYMENT_RELEASED':
        return <DollarSign className="h-5 w-5 text-emerald-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'CREATED':
        return 'border-blue-500';
      case 'PAYMENT_RECEIVED':
        return 'border-green-500';
      case 'QUEUED':
        return 'border-purple-500';
      case 'ASSIGNED':
        return 'border-indigo-500';
      case 'STARTED':
        return 'border-yellow-500';
      case 'COMPLETED':
        return 'border-green-500';
      case 'VERIFIED':
        return 'border-green-600';
      case 'CANCELLED':
        return 'border-red-500';
      case 'EXPIRED':
        return 'border-orange-500';
      case 'REASSIGNED':
        return 'border-blue-500';
      case 'PAYMENT_RELEASED':
        return 'border-emerald-500';
      default:
        return 'border-gray-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Timeline</CardTitle>
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

            {events.map((event, index) => (
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
                        {event.user && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {event.user.role}
                            </Badge>
                            <span className="text-sm text-gray-600">{event.user.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{formatTimestamp(event.timestamp)}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
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
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}