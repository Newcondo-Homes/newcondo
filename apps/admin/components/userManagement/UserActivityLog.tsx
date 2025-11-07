"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Activity, 
  LogIn, 
  LogOut, 
  Home, 
  CreditCard, 
  User, 
  FileText,
  RefreshCw,
  Calendar,
  MapPin,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface ActivityEvent {
  id: string;
  type: string;
  timestamp: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

interface UserActivityLogProps {
  userId: string;
}

const EVENT_TYPES = {
  LOGIN: { icon: LogIn, color: 'text-green-600', label: 'Login' },
  LOGOUT: { icon: LogOut, color: 'text-gray-600', label: 'Logout' },
  SIGNUP_COMPLETED: { icon: User, color: 'text-blue-600', label: 'Signup Completed' },
  PROPERTY_CREATED: { icon: Home, color: 'text-purple-600', label: 'Property Created' },
  PROPERTY_VIEWED: { icon: Eye, color: 'text-blue-500', label: 'Property Viewed' },
  PROPERTY_UPDATED: { icon: Home, color: 'text-yellow-600', label: 'Property Updated' },
  PAYMENT_MADE: { icon: CreditCard, color: 'text-green-600', label: 'Payment Made' },
  PAYMENT_FAILED: { icon: CreditCard, color: 'text-red-600', label: 'Payment Failed' },
  VERIFICATION_SUBMITTED: { icon: FileText, color: 'text-blue-600', label: 'Verification Submitted' },
  VERIFICATION_APPROVED: { icon: FileText, color: 'text-green-600', label: 'Verification Approved' },
  PROFILE_UPDATED: { icon: User, color: 'text-blue-600', label: 'Profile Updated' },
  MARKING_JOB_CREATED: { icon: MapPin, color: 'text-purple-600', label: 'Marking Job Created' },
  MARKING_JOB_COMPLETED: { icon: MapPin, color: 'text-green-600', label: 'Marking Job Completed' }
};

export default function UserActivityLog({ userId }: UserActivityLogProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchActivities();
  }, [userId, filter, page]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/users/${userId}/activity?type=${filter}&page=${page}`
      );
      const data = await response.json();
      setActivities(data.activities);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventConfig = (type: string) => {
    return EVENT_TYPES[type as keyof typeof EVENT_TYPES] || {
      icon: Activity,
      color: 'text-gray-600',
      label: type
    };
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return format(date, 'PPp');
  };

  const getBrowserInfo = (userAgent?: string) => {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    
    return 'Other';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
          
          <div className="flex items-center gap-3">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="LOGIN">Login Events</SelectItem>
                <SelectItem value="PROPERTY_CREATED">Property Events</SelectItem>
                <SelectItem value="PAYMENT_MADE">Payment Events</SelectItem>
                <SelectItem value="VERIFICATION_SUBMITTED">Verification Events</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchActivities}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const config = getEventConfig(activity.type);
            const Icon = config.icon;
            
            return (
              <div 
                key={activity.id}
                className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                {/* Timeline */}
                <div className="relative">
                  <div className={`rounded-full p-2 bg-background border-2 ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {index < activities.length - 1 && (
                    <div className="absolute left-1/2 top-10 -translate-x-1/2 w-0.5 h-8 bg-border" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-grow space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{config.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      {format(new Date(activity.timestamp), 'HH:mm')}
                    </Badge>
                  </div>

                  {/* Metadata */}
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      {activity.metadata.propertyId && (
                        <p>Property: {activity.metadata.propertyId}</p>
                      )}
                      {activity.metadata.amount && (
                        <p>Amount: ₦{Number(activity.metadata.amount).toLocaleString()}</p>
                      )}
                      {activity.metadata.status && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.status}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Technical Details */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {activity.ipAddress && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {activity.ipAddress}
                      </span>
                    )}
                    {activity.userAgent && (
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {getBrowserInfo(activity.userAgent)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && activities.length === 0 && (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No activities found</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading activities...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}