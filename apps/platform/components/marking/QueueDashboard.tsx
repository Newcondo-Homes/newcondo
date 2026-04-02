// apps/platform/components/marking/QueueDashboard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/components/tabs";
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  MapPin,
  DollarSign
} from "lucide-react";
import { QueuePosition } from "./QueuePosition";
import AvailableJobsList  from "./AvailableJobsList";

interface QueueDashboardProps {
  agentStats: {
    totalJobs: number;
    completedJobs: number;
    activeJobs: number;
    earnings: number;
    reliabilityScore: number;
    queuePosition?: number;
  };
  activeJob?: any;
  availableJobs: any[];
  onAcceptJob: (jobId: string) => void;
  onViewJob: (jobId: string) => void;
}

export function QueueDashboard({
  agentStats,
  activeJob,
  availableJobs,
  onAcceptJob,
  onViewJob,
}: QueueDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{agentStats.totalJobs}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{agentStats.completedJobs}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">₦{agentStats.earnings.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reliability Score</p>
                <p className="text-2xl font-bold">{agentStats.reliabilityScore.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Job / Queue Position */}
      {activeJob ? (
        <Card className="border-yellow-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Active Job
              </CardTitle>
              <Badge className="bg-yellow-500 text-white">In Progress</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-lg">{activeJob.property.title}</p>
                <p className="text-sm text-muted-foreground">
                  {activeJob.property.address}, {activeJob.property.city}
                </p>
              </div>
              
              <QueuePosition
                position={1}
                totalInQueue={1}
                timeSlotExpiry={activeJob.timeSlotExpiry}
                status="ASSIGNED"
              />

              <Button 
                className="w-full" 
                onClick={() => onViewJob(activeJob.id)}
              >
                Continue Marking
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : agentStats.queuePosition ? (
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Queue Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QueuePosition
              position={agentStats.queuePosition}
              totalInQueue={10}
              status="QUEUED"
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Tabs for Available Jobs */}
      <Tabs defaultValue="available" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">
            Available Jobs ({availableJobs.length})
          </TabsTrigger>
          <TabsTrigger value="nearby">
            Nearby Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {availableJobs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No available jobs at the moment</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back later or expand your service area
                </p>
              </CardContent>
            </Card>
          ) : (
            <AvailableJobsList
              jobs={availableJobs}
              onAcceptJob={onAcceptJob}
              onViewDetails={onViewJob}
            />
          )}
        </TabsContent>

        <TabsContent value="nearby" className="space-y-4">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Enable location to see nearby jobs</p>
              <Button className="mt-4" variant="outline">
                Enable Location
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}