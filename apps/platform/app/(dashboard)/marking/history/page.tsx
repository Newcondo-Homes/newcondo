"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, DollarSign, CheckCircle, XCircle, Clock, Search, Filter } from "lucide-react";
import { format } from "date-fns";

interface HistoricalJob {
  id: string;
  propertyId: string;
  property: {
    title: string;
    address: string;
    city: string;
    state: string;
  };
  markingFee: number;
  status: string;
  assignedAt: string;
  completedAt?: string;
  completionNotes?: string;
  paymentStatus: string;
  earnedAmount?: number;
}

interface FilterOptions {
  status: string;
  dateRange: string;
  search: string;
}

export default function MarkingHistoryPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<HistoricalJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<HistoricalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    dateRange: "all",
    search: "",
  });

  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalEarned: 0,
    totalCancelled: 0,
    averageCompletionTime: 0,
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, filters]);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/marking/history", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch history");

      const data = await response.json();
      setJobs(data.jobs);
      setStats(data.stats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((job) => job.status === filters.status);
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }

      filtered = filtered.filter(
        (job) => new Date(job.assignedAt) >= filterDate
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.property.title.toLowerCase().includes(searchLower) ||
          job.property.address.toLowerCase().includes(searchLower) ||
          job.property.city.toLowerCase().includes(searchLower)
      );
    }

    setFilteredJobs(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Clock className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "RELEASED":
        return <Badge variant="outline" className="bg-green-50">Paid</Badge>;
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50">Pending</Badge>;
      case "HELD":
        return <Badge variant="outline" className="bg-orange-50">Held</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Marking History</h1>
        <p className="text-muted-foreground">
          View your completed and past marking jobs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Completed</CardDescription>
            <CardTitle className="text-3xl">{stats.totalCompleted}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Earned</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              ₦{stats.totalEarned.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cancelled Jobs</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.totalCancelled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Completion</CardDescription>
            <CardTitle className="text-3xl">{stats.averageCompletionTime}h</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Job List */}
      {filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No History Found</h3>
            <p className="text-muted-foreground text-center">
              {filters.status !== "all" || filters.dateRange !== "all" || filters.search
                ? "Try adjusting your filters"
                : "You haven't completed any marking jobs yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{job.property.title}</CardTitle>
                      {getStatusBadge(job.status)}
                      {getPaymentBadge(job.paymentStatus)}
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {job.property.address}, {job.property.city}, {job.property.state}
                    </CardDescription>
                  </div>
                  {job.earnedAmount && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ₦{job.earnedAmount.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Earned</div>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Assigned</div>
                      <div className="text-muted-foreground">
                        {format(new Date(job.assignedAt), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </div>
                  {job.completedAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Completed</div>
                        <div className="text-muted-foreground">
                          {format(new Date(job.completedAt), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Marking Fee</div>
                      <div className="text-muted-foreground">
                        ₦{job.markingFee.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {job.completionNotes && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <div className="text-sm font-medium mb-1">Completion Notes</div>
                    <div className="text-sm text-muted-foreground">{job.completionNotes}</div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/marking/${job.id}/details`)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}











// import { Suspense } from "react";
// import { Metadata } from "next";
// import CommissionsLoading from "../../agent/commissions/loading";
// import MarkingServiceHistory from "@/components/marking/MarkingServiceHistory";

// export const metadata: Metadata = {
//   title: "Marking Service History | NewCondo",
//   description: "View your property marking service history and status",
// };

// export default function MarkingHistoryPage() {
//   return (
//     <div className="container mx-auto p-6">
//       <Suspense fallback={<CommissionsLoading />}>
//         <MarkingServiceHistory />
//       </Suspense>
//     </div>
//   );
// }