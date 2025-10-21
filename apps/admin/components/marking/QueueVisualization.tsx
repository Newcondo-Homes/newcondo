"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  Clock, 
  User, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer
} from "lucide-react";
import { queueOversightApi } from "@/lib/api/queueOversight";
import { formatDistanceToNow, format } from "date-fns";

interface QueueItem {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  requestedBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedAgent: {
    id: string;
    name: string;
    email: string;
  } | null;
  queuePosition: number;
  status: string;
  assignedAt: string | null;
  timeSlotExpiry: string | null;
  maxCompletionTime: string;
  urgencyLevel: string;
  markingFee: number;
  createdAt: string;
}

export function QueueVisualization() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQueueItems();
    const interval = setInterval(fetchQueueItems, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchQueueItems = async () => {
    try {
      setError(null);
      const data = await queueOversightApi.getQueueVisualization();
      setQueueItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch queue items");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "QUEUED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ASSIGNED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "EXPIRED":
        return "bg-red-100 text-red-800 border-red-200";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "URGENT":
        return "destructive";
      case "HIGH":
        return "default";
      case "NORMAL":
        return "secondary";
      case "LOW":
        return "outline";
      default:
        return "secondary";
    }
  };

  const calculateTimeProgress = (assignedAt: string | null, expiryTime: string | null) => {
    if (!assignedAt || !expiryTime) return 0;
    
    const assigned = new Date(assignedAt).getTime();
    const expiry = new Date(expiryTime).getTime();
    const now = Date.now();
    const total = expiry - assigned;
    const elapsed = now - assigned;
    
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const getTimeRemaining = (expiryTime: string | null) => {
    if (!expiryTime) return null;
    const expiry = new Date(expiryTime);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">Loading queue visualization...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  const activeQueue = queueItems.filter(item => 
    ["QUEUED", "ASSIGNED", "IN_PROGRESS"].includes(item.status)
  );

  return (
    <div className="space-y-6">
      {/* Queue Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Active Queue</CardTitle>
          <CardDescription>
            {activeQueue.length} job{activeQueue.length !== 1 ? "s" : ""} currently in queue
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Queue Items */}
      <div className="space-y-4">
        {activeQueue.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Queue is Empty</h3>
              <p className="text-gray-500">No pending marking jobs at the moment</p>
            </CardContent>
          </Card>
        ) : (
          activeQueue.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          #{item.queuePosition}
                        </Badge>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace("_", " ")}
                        </Badge>
                        <Badge variant={getUrgencyColor(item.urgencyLevel)}>
                          {item.urgencyLevel}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{item.propertyTitle}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {item.propertyAddress}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ₦{item.markingFee.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Marking Fee</div>
                    </div>
                  </div>

                  {/* Requester and Agent */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-y">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Requested By</div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-sm">{item.requestedBy.name}</div>
                          <div className="text-xs text-gray-500">{item.requestedBy.email}</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Assigned Agent</div>
                      {item.assignedAgent ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="font-medium text-sm">{item.assignedAgent.name}</div>
                            <div className="text-xs text-gray-500">{item.assignedAgent.email}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">Waiting for assignment</div>
                      )}
                    </div>
                  </div>

                  {/* Time Information */}
                  {item.assignedAt && item.timeSlotExpiry && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-orange-600" />
                          <span className="font-medium">Time Slot Progress</span>
                        </div>
                        <span className="text-xs text-gray-600">
                          {getTimeRemaining(item.timeSlotExpiry)}
                        </span>
                      </div>
                      <Progress 
                        value={calculateTimeProgress(item.assignedAt, item.timeSlotExpiry)} 
                        className="h-2"
                      />
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </div>
                    <div>
                      Max completion: {format(new Date(item.maxCompletionTime), "MMM dd, HH:mm")}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`/admin/marking-jobs/${item.id}`, "_blank")}
                    >
                      View Details
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                    {item.status === "ASSIGNED" && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-orange-600 border-orange-600 hover:bg-orange-50"
                      >
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Monitor Progress
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recently Completed */}
      {queueItems.filter(item => item.status === "COMPLETED").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recently Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {queueItems
                .filter(item => item.status === "COMPLETED")
                .slice(0, 5)
                .map(item => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="text-sm font-medium">{item.propertyTitle}</div>
                        <div className="text-xs text-gray-500">
                          by {item.assignedAgent?.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}