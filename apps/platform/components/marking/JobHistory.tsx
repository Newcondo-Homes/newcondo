"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import { Skeleton } from "@newcondo/ui/components/skeleton";
import { Input } from "@newcondo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@newcondo/ui/components/select";
import {
  MapPin,
  Clock,
  DollarSign,
  Eye,
  Search,
  Filter,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api/client";
import { format } from "date-fns";

interface JobHistoryItem {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  status: string;
  markingFee: number;
  agentEarnings: number;
  assignedAt: string;
  completedAt?: string;
  timeTaken?: number;
  photoCount?: number;
  ownerRating?: number;
  ownerFeedback?: string;
}

interface JobHistoryFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const statusColors = {
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  EXPIRED: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
};

const statusLabels = {
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  IN_PROGRESS: "In Progress",
};

export default function JobHistory() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobHistoryItem[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobHistoryFilters>({});

  useEffect(() => {
    const fetchJobHistory = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await api.get(`/marking/agents/${user.id}/history`);
        const data = response.data as JobHistoryItem[];
        setJobs(data);
        setFilteredJobs(data);
        setError(null);
      } catch (err) {
        const apiErr = err as ApiError;
        console.error("Error fetching job history:", apiErr);
        setError(apiErr.response?.data?.message ?? "Failed to load job history");
      } finally {
        setLoading(false);
      }
    };

    fetchJobHistory();
  }, [user]);

  useEffect(() => {
    let filtered = [...jobs];

    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((job) => job.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.propertyTitle.toLowerCase().includes(searchLower) ||
          job.propertyAddress.toLowerCase().includes(searchLower)
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(
        (job) => new Date(job.assignedAt) >= new Date(filters.dateFrom!)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(
        (job) => new Date(job.assignedAt) <= new Date(filters.dateTo!)
      );
    }

    setFilteredJobs(filtered);
  }, [filters, jobs]);

  const handleViewDetails = (jobId: string) => {
    window.location.href = `/dashboard/marking/jobs/${jobId}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search properties..."
                className="pl-10"
                value={filters.search || ""}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <Select
              value={filters.status || "all"}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From date"
              value={filters.dateFrom || ""}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />

            <Input
              type="date"
              placeholder="To date"
              value={filters.dateTo || ""}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredJobs.length}</div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {filteredJobs.filter((j) => j.status === "COMPLETED").length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {filteredJobs.filter((j) => j.status === "IN_PROGRESS").length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              ₦{filteredJobs.reduce((sum, job) => sum + job.agentEarnings, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Earnings</div>
          </CardContent>
        </Card>
      </div>

      {/* Job History List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500 py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No jobs found matching your filters</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{job.propertyTitle}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.propertyAddress}</span>
                        </div>
                      </div>
                      <Badge className={statusColors[job.status as keyof typeof statusColors]}>
                        {statusLabels[job.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          Assigned: {format(new Date(job.assignedAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                      {job.completedAt && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>
                            Completed: {format(new Date(job.completedAt), "MMM dd, yyyy")}
                          </span>
                        </div>
                      )}
                      {job.timeTaken && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Time: {job.timeTaken.toFixed(1)}h</span>
                        </div>
                      )}
                    </div>

                    {job.ownerRating && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${
                                i < job.ownerRating! ? "text-yellow-400" : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        {job.ownerFeedback && (
                          <span className="text-sm text-gray-600 italic">
                            {job.ownerFeedback}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col items-center md:items-end gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                        <DollarSign className="h-5 w-5" />
                        ₦{job.agentEarnings.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        of ₦{job.markingFee.toLocaleString()}
                      </div>
                      {job.photoCount && (
                        <div className="text-xs text-gray-500 mt-1">
                          {job.photoCount} photos uploaded
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(job.id)}
                      className="whitespace-nowrap"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}