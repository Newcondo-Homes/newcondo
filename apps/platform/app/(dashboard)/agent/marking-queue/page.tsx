"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueueStore } from "@/store/queueStore";
import { useAuth } from "@/hooks/useAuth";
import { queueApi } from "@/lib/api/queue";
import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Switch } from "@newcondo/ui/components/switch";
import { Label } from "@newcondo/ui/components/label";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/components/tabs";
import {
  Clock,
  MapPin,
  Bell,
  AlertCircle,
  CheckCircle,
  Users,
  TrendingUp,
  Settings,
  Play,
  Pause,
} from "lucide-react";
import { formatDistanceToNow, differenceInMinutes, format } from "date-fns";
import {LoadingSpinner} from "@/components/shared/feedback/LoadingSpinner";
import { Progress } from "@newcondo/ui/components/progress";

export default function AgentQueueDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    myQueueItems,
    activeJobs,
    stats,
    notifications,
    agentLocation,
    setMyQueueItems,
    setActiveJobs,
    setStats,
    toggleAvailability,
    isLoading,
    setLoading,
    error,
    setError,
    getUnreadCount,
    markAllNotificationsRead,
  } = useQueueStore();

  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    fetchQueueData();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchQueueData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueueData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [queueResponse, statsResponse] = await Promise.all([
        queueApi.getMyQueue(),
        queueApi.getMyStats(),
      ]);

      setMyQueueItems(queueResponse.data.queueItems);
      setActiveJobs(queueResponse.data.activeJobs);
      setStats(statsResponse.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch queue data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      await queueApi.toggleAvailability(!agentLocation.isAvailable);
      toggleAvailability();
    } catch (err: any) {
      setError(err.message || "Failed to update availability");
    }
  };

  const handleJoinQueue = async (jobId: string) => {
    try {
      await queueApi.joinQueue(jobId);
      await fetchQueueData();
    } catch (err: any) {
      setError(err.message || "Failed to join queue");
    }
  };

  const handleLeaveQueue = async (queueItemId: string) => {
    try {
      await queueApi.leaveQueue(queueItemId);
      await fetchQueueData();
    } catch (err: any) {
      setError(err.message || "Failed to leave queue");
    }
  };

  const calculateTimeSlotProgress = (item: any) => {
    if (!item.timeSlotStart || !item.timeSlotEnd) return 0;
    
    const now = new Date();
    const start = new Date(item.timeSlotStart);
    const end = new Date(item.timeSlotEnd);
    const total = differenceInMinutes(end, start);
    const elapsed = differenceInMinutes(now, start);
    
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const getTimeRemaining = (timeSlotEnd: Date) => {
    const minutes = differenceInMinutes(new Date(timeSlotEnd), new Date());
    if (minutes < 0) return "Expired";
    if (minutes < 60) return `${minutes}m remaining`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m remaining`;
  };

  const unreadCount = getUnreadCount();

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Marking Queue Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your property marking opportunities</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/agent/location-settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Location Settings
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllNotificationsRead}>
              <Bell className="mr-2 h-4 w-4" />
              Mark All Read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* Availability Toggle */}
      <Card className="mb-6">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            {agentLocation.isAvailable ? (
              <Play className="h-8 w-8 text-green-600" />
            ) : (
              <Pause className="h-8 w-8 text-gray-400" />
            )}
            <div>
              <h3 className="font-semibold text-lg">
                {agentLocation.isAvailable ? "Available for Jobs" : "Unavailable"}
              </h3>
              <p className="text-sm text-gray-600">
                {agentLocation.isAvailable
                  ? "You will receive notifications for new marking jobs in your area"
                  : "Turn on to start receiving job opportunities"}
              </p>
            </div>
          </div>
          <Switch
            checked={agentLocation.isAvailable}
            onCheckedChange={handleToggleAvailability}
          />
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>In Queue</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{stats.totalQueued}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Jobs</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{stats.totalActive}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.totalCompleted}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Wait Time</CardDescription>
              <CardTitle className="text-3xl">
                {stats.averageWaitTime ? `${Math.round(stats.averageWaitTime)}m` : "N/A"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active Time Slots ({activeJobs.length})
          </TabsTrigger>
          <TabsTrigger value="waiting">
            Waiting in Queue ({myQueueItems.filter((i) => i.status === "WAITING").length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({myQueueItems.filter((i) => i.status === "COMPLETED").length})
          </TabsTrigger>
        </TabsList>

        {/* Active Time Slots */}
        <TabsContent value="active" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : activeJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No active time slots</p>
                <p className="text-sm text-gray-400">
                  Join a queue to get assigned a time slot
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeJobs.map((item) => {
                const progress = calculateTimeSlotProgress(item);
                const timeRemaining = item.timeSlotEnd
                  ? getTimeRemaining(new Date(item.timeSlotEnd))
                  : "N/A";

                return (
                  <Card key={item.id} className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{item.property.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{item.property.address}, {item.property.city}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{timeRemaining}</span>
                            </div>
                          </div>
                        </div>
                        <Button onClick={() => router.push(`/agent/marking-jobs/${item.jobId}`)}>
                          Start Marking
                        </Button>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Time Slot Progress</span>
                          <span className="font-medium">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        {item.timeSlotStart && item.timeSlotEnd && (
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{format(new Date(item.timeSlotStart), "p")}</span>
                            <span>{format(new Date(item.timeSlotEnd), "p")}</span>
                          </div>
                        )}
                      </div>

                      {progress > 80 && (
                        <Alert className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Your time slot is expiring soon! Complete the marking to secure payment.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Waiting in Queue */}
        <TabsContent value="waiting" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : myQueueItems.filter((i) => i.status === "WAITING").length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Not in any queues</p>
                <p className="text-sm text-gray-400">
                  Browse available jobs to join a queue
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myQueueItems
                .filter((i) => i.status === "WAITING")
                .map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{item.property.title}</h3>
                            <Badge variant="outline">Position #{item.position}</Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{item.property.address}, {item.property.city}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                Joined {formatDistanceToNow(new Date(item.joinedAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>

                          {item.timeSlotStart && (
                            <Alert className="mb-3">
                              <Clock className="h-4 w-4" />
                              <AlertDescription>
                                Your time slot starts at {format(new Date(item.timeSlotStart), "PPp")}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => handleLeaveQueue(item.id)}
                        >
                          Leave Queue
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Completed */}
        <TabsContent value="completed" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : myQueueItems.filter((i) => i.status === "COMPLETED").length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No completed jobs yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myQueueItems
                .filter((i) => i.status === "COMPLETED")
                .map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{item.property.title}</h3>
                            <Badge className="bg-green-500">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Completed
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{item.property.address}, {item.property.city}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => router.push(`/agent/marking-jobs/${item.jobId}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.read ? "bg-white" : "bg-blue-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1" />
                    )}
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