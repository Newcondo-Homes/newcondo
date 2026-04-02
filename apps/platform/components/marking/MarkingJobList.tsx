// apps/platform/components/marking/MarkingJobList.tsx

import { useState, useEffect } from 'react';
import { MarkingJobCard } from './MarkingJobCard';
import { Button } from '@newcondo/ui/components/button';
import { Input } from '@newcondo/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/components/select';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';

interface MarkingJob {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyImages?: string[];
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  markingFee: number;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'HELD' | 'RELEASED';
  assignedAgent?: {
    id: string;
    name: string;
    image?: string;
    phone?: string;
  };
  assignedAt?: string;
  completedAt?: string;
  timeSlotExpiry?: string;
  queuePosition?: number;
  createdAt: string;
}

interface MarkingJobListProps {
  viewType: 'owner' | 'agent';
  onViewDetails?: (jobId: string) => void;
  onVerify?: (jobId: string) => void;
  onCancel?: (jobId: string) => void;
  onComplete?: (jobId: string) => void;
}

export function MarkingJobList({
  viewType,
  onViewDetails,
  onVerify,
  onCancel,
  onComplete,
}: MarkingJobListProps) {
  const [jobs, setJobs] = useState<MarkingJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<MarkingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  useEffect(() => {
    fetchJobs();
  }, [viewType]);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchQuery, statusFilter, paymentFilter]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const endpoint = viewType === 'owner' 
        ? '/api/marking/my-jobs'
        : '/api/marking/available-jobs';

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error('Failed to fetch marking jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load marking jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.propertyTitle.toLowerCase().includes(query) ||
          job.propertyAddress.toLowerCase().includes(query) ||
          job.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter((job) => job.paymentStatus === paymentFilter);
    }

    setFilteredJobs(filtered);
  };

  const handleRefresh = () => {
    fetchJobs();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading marking jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by property name, address, or job ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="QUEUED">Queued</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="SUCCESS">Success</SelectItem>
            <SelectItem value="HELD">Held</SelectItem>
            <SelectItem value="RELEASED">Released</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredJobs.length} of {jobs.length} job{jobs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Job Cards */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <MarkingJobCard
              key={job.id}
              job={job}
              viewType={viewType}
              onViewDetails={() => onViewDetails?.(job.id)}
              onVerify={() => onVerify?.(job.id)}
              onCancel={() => onCancel?.(job.id)}
              onComplete={() => onComplete?.(job.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
              ? 'No marking jobs match your filters'
              : viewType === 'owner'
              ? 'You haven\'t requested any marking jobs yet'
              : 'No marking jobs available in your area'}
          </p>
        </div>
      )}
    </div>
  );
}


















// // apps/platform/components/marking/MarkingJobList.tsx
// "use client";

// import { useState } from "react";
// import { MarkingJobCard } from "./MarkingJobCard";
// import { Input } from "@newcondo/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@newcondo/ui/select";
// import { Search, Filter } from "lucide-react";
// import { Button } from "@newcondo/ui/button";

// interface MarkingJobListProps {
//   jobs: any[];
//   variant?: "agent" | "owner";
//   onAction?: (action: string, jobId: string) => void;
//   isLoading?: boolean;
// }

// export function MarkingJobList({ jobs, variant = "owner", onAction, isLoading }: MarkingJobListProps) {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [urgencyFilter, setUrgencyFilter] = useState("all");

//   const filteredJobs = jobs.filter((job) => {
//     const matchesSearch = 
//       job.property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       job.property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       job.property.city.toLowerCase().includes(searchQuery.toLowerCase());

//     const matchesStatus = statusFilter === "all" || job.status === statusFilter;
//     const matchesUrgency = urgencyFilter === "all" || job.urgencyLevel === urgencyFilter;

//     return matchesSearch && matchesStatus && matchesUrgency;
//   });

//   if (isLoading) {
//     return (
//       <div className="space-y-4">
//         {[1, 2, 3].map((i) => (
//           <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-lg" />
//         ))}
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Filters */}
//       <div className="bg-white rounded-lg border p-4 space-y-4">
//         <div className="flex items-center gap-2">
//           <Filter className="h-5 w-5 text-muted-foreground" />
//           <h3 className="font-semibold">Filters</h3>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {/* Search */}
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <Input
//               placeholder="Search properties..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="pl-9"
//             />
//           </div>

//           {/* Status Filter */}
//           <Select value={statusFilter} onValueChange={setStatusFilter}>
//             <SelectTrigger>
//               <SelectValue placeholder="All Statuses" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Statuses</SelectItem>
//               <SelectItem value="QUEUED">In Queue</SelectItem>
//               <SelectItem value="ASSIGNED">Assigned</SelectItem>
//               <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
//               <SelectItem value="COMPLETED">Completed</SelectItem>
//               <SelectItem value="CANCELLED">Cancelled</SelectItem>
//               <SelectItem value="EXPIRED">Expired</SelectItem>
//             </SelectContent>
//           </Select>

//           {/* Urgency Filter */}
//           <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
//             <SelectTrigger>
//               <SelectValue placeholder="All Urgency Levels" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Urgency Levels</SelectItem>
//               <SelectItem value="LOW">Low</SelectItem>
//               <SelectItem value="NORMAL">Normal</SelectItem>
//               <SelectItem value="HIGH">High</SelectItem>
//               <SelectItem value="URGENT">Urgent</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         {(searchQuery || statusFilter !== "all" || urgencyFilter !== "all") && (
//           <div className="flex items-center justify-between pt-2 border-t">
//             <span className="text-sm text-muted-foreground">
//               {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
//             </span>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={() => {
//                 setSearchQuery("");
//                 setStatusFilter("all");
//                 setUrgencyFilter("all");
//               }}
//             >
//               Clear Filters
//             </Button>
//           </div>
//         )}
//       </div>

//       {/* Jobs Grid */}
//       {filteredJobs.length === 0 ? (
//         <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
//           <p className="text-muted-foreground">No marking jobs found</p>
//           {(searchQuery || statusFilter !== "all" || urgencyFilter !== "all") && (
//             <p className="text-sm text-muted-foreground mt-2">
//               Try adjusting your filters
//             </p>
//           )}
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredJobs.map((job) => (
//             <MarkingJobCard
//               key={job.id}
//               job={job}
//               variant={variant}
//               onAction={onAction}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }