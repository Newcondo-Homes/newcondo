"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/card";
import { Badge } from "@newcondo/ui/badge";
import { ScrollArea } from "@newcondo/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@newcondo/ui/avatar";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { formatDistanceToNow } from "date-fns";
import { 
  UserCheck, UserX, Home, XCircle, RefreshCw, 
  AlertCircle, CheckCircle2 
} from "lucide-react";

interface Activity {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  description: string;
  admin: {
    name: string;
    email: string;
    image?: string;
  };
  createdAt: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getRecentActivity({ limit: 10 });
      setActivities(response.data);
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "USER_VERIFIED":
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case "USER_REJECTED":
        return <UserX className="h-4 w-4 text-red-600" />;
      case "PROPERTY_APPROVED":
        return <Home className="h-4 w-4 text-blue-600" />;
      case "PROPERTY_REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "PAYMENT_REFUNDED":
        return <RefreshCw className="h-4 w-4 text-yellow-600" />;
      case "DUPLICATE_RESOLVED":
        return <CheckCircle2 className="h-4 w-4 text-purple-600" />;
      case "BOUNDARY_DISPUTE_RESOLVED":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "TICKET_RESOLVED":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("VERIFIED") || action.includes("APPROVED")) {
      return "bg-green-100 text-green-800";
    }
    if (action.includes("REJECTED")) {
      return "bg-red-100 text-red-800";
    }
    if (action.includes("RESOLVED")) {
      return "bg-blue-100 text-blue-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="h-10 w-10 rounded-full animate-pulse bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse bg-gray-200 rounded" />
                  <div className="h-3 w-1/2 animate-pulse bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-4 pb-4 border-b last:border-0"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.admin.image} />
                    <AvatarFallback>
                      {activity.admin.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">
                        {activity.admin.name}
                      </p>
                      <Badge variant="secondary" className={getActionColor(activity.action)}>
                        <span className="mr-1">{getActionIcon(activity.action)}</span>
                        {activity.action.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
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