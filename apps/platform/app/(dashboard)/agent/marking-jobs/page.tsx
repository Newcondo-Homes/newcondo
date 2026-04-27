"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { queueApi } from "@/lib/api/queue";
import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/components/tabs";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { Input } from "@newcondo/ui/components/input";
import {
  MapPin,
  Clock,
  AlertCircle,
  Search,
  Filter,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {LoadingSpinner} from "@/components/shared/feedback/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@newcondo/ui/components/select";

interface AvailableJob {
  id: string;
  propertyId: string;
  markingFee: number;
  urgencyLevel: string;
  queuePosition: number;
  totalInQueue: number;
  distance?: number;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    images: Array<{ url: string }>;
  };
  createdAt: Date;
}

const urgencyColors = {
  LOW: "text-gray-600",
  NORMAL: "text-blue-600",
  HIGH: "text-orange-600",
  URGENT: "text-red-600",
};

export default function AgentMarkingJobsListPage() {
  const router = useRouter();
  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("distance");
  const [activeTab, setActiveTab] = useState("available");

  useEffect(() => {
    fetchJobs();
  }, [urgencyFilter, sortBy]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [availableResponse, myJobsResponse] = await Promise.all([
        queueApi.getAvailableJobs({ urgency: urgencyFilter, sortBy }),
        queueApi.getMyAssignedJobs(),
      ]);

      setAvailableJobs(availableResponse.data);
      setMyJobs(myJobsResponse.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinQueue = async (jobId: string) => {
    try {
      await queueApi.joinQueue(jobId);
      await fetchJobs();
    } catch (err: any) {
      setError(err.message || "Failed to join queue");
    }
  };

  const filteredJobs = availableJobs.filter((job) =>
    job.property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.property.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Marking Jobs</h1>
        <p className="text-gray-600">Find property marking opportunities near you</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">
            Available Jobs ({filteredJobs.length})
          </TabsTrigger>
          <TabsTrigger value="assigned">
            My Assigned Jobs ({myJobs.length})
          </TabsTrigger>
        </TabsList>

        {/* Available Jobs Tab */}
        <TabsContent value="available" className="mt-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by property name, address, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <TrendingUp className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="fee">Highest Fee</SelectItem>
                <SelectItem value="urgency">Urgency</SelectItem>
                <SelectItem value="queue">Queue Position</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">No jobs found</p>
                <p className="text-sm text-gray-400">
                  {searchQuery
                    ? "Try adjusting your search or filters"
                    : "Check back later for new opportunities"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/agent/marking-jobs/${job.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Property Image */}
                      {job.property.images[0] && (
                        <img
                          src={job.property.images[0].url}
                          alt={job.property.title}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      )}

                      {/* Job Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold mb-1">{job.property.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {job.property.address}, {job.property.city}
                              </span>
                              {job.distance && (
                                <span className="text-blue-600">
                                  • {job.distance.toFixed(1)} km away
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              ₦{job.markingFee.toLocaleString()}
                            </div>
                            <p className="text-xs text-gray-500">Marking Fee</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mb-3">
                          <Badge variant="outline" className={urgencyColors[job.urgencyLevel as keyof typeof urgencyColors]}>
                            {job.urgencyLevel}
                          </Badge>
                          <div className="text-sm text-gray-600">
                            <Clock className="inline h-4 w-4 mr-1" />
                            Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                          </div>
                        </div>

                        {/* Queue Info */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{job.totalInQueue}</span> agents in queue
                            {job.queuePosition > 0 && (
                              <span> • Position #{job.queuePosition}</span>
                            )}
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinQueue(job.id);
                            }}
                            size="sm"
                          >
                            Join Queue
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Assigned Jobs Tab */}
        <TabsContent value="assigned" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : myJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No assigned jobs</p>
                <p className="text-sm text-gray-400">
                  Join a queue to get assigned marking jobs
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myJobs.map((job) => (
                <Card
                  key={job.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/agent/marking-jobs/${job.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {job.property?.images[0] && (
                        <img
                          src={job.property.images[0].url}
                          alt={job.property.title}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      )}

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold mb-1">{job.property.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {job.property.address}, {job.property.city}
                              </span>
                            </div>
                          </div>
                          <Badge
                            className={
                              job.status === "IN_PROGRESS"
                                ? "bg-yellow-500"
                                : job.status === "COMPLETED"
                                ? "bg-green-500"
                                : "bg-blue-500"
                            }
                          >
                            {job.status.replace("_", " ")}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-gray-500">Fee</p>
                            <p className="font-semibold">₦{job.markingFee.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Assigned</p>
                            <p className="font-semibold">
                              {formatDistanceToNow(new Date(job.assignedAt), { addSuffix: true })}
                            </p>
                          </div>
                          {job.timeSlotExpiry && (
                            <div>
                              <p className="text-gray-500">Time Slot Expires</p>
                              <p className="font-semibold">
                                {format(new Date(job.timeSlotExpiry), "p")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}