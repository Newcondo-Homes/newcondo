// apps/platform/components/marking/AvailableJobsList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import JobCard from './JobCard';
import { useMarkingJobs } from '@/hooks/useMarkingJobs';
import { Button } from '@newcondo/ui/components/button';
import { AlertCircle, Loader2, MapPin } from 'lucide-react';

interface AvailableJobsListProps {
  userLocation?: { lat: number; lng: number };
  maxDistance?: number; // in kilometers
  onJobAccepted?: (jobId: string) => void;
}

export default function AvailableJobsList({
  userLocation,
  maxDistance = 10,
  onJobAccepted,
}: AvailableJobsListProps) {
  const { user } = useAuth();
  const { availableJobs, loading, error, acceptJob, fetchAvailableJobs } =
    useMarkingJobs();
  const [filteredJobs, setFilteredJobs] = useState(availableJobs);
  const [sortBy, setSortBy] = useState<'distance' | 'urgency' | 'reward'>(
    'distance'
  );
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  useEffect(() => {
    if (user?.isAvailableForMarking) {
      fetchAvailableJobs(userLocation, maxDistance);
    }
  }, [user?.isAvailableForMarking, userLocation, maxDistance, fetchAvailableJobs]);

  useEffect(() => {
    const sorted = [...availableJobs];

    if (sortBy === 'distance' && userLocation) {
      sorted.sort(
        (a, b) =>
          (a.distanceFromAgent || Infinity) - (b.distanceFromAgent || Infinity)
      );
    } else if (sortBy === 'urgency') {
      const urgencyOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
      sorted.sort(
        (a, b) =>
          (urgencyOrder[a.urgencyLevel as keyof typeof urgencyOrder] ?? 99) -
          (urgencyOrder[b.urgencyLevel as keyof typeof urgencyOrder] ?? 99)
      );
    } else if (sortBy === 'reward') {
      sorted.sort((a, b) => Number(b.markingFee) - Number(a.markingFee));
    }

    setFilteredJobs(sorted);
  }, [availableJobs, sortBy, userLocation]);

  const handleAcceptJob = useCallback(
    async (jobId: string) => {
      setIsAccepting(jobId);
      try {
        await acceptJob(jobId);
        onJobAccepted?.(jobId);
      } finally {
        setIsAccepting(null);
      }
    },
    [acceptJob, onJobAccepted]
  );

  if (!user?.isAvailableForMarking) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-900">
              Marking Service Not Available
            </p>
            <p className="text-sm text-yellow-800">
              You need to enable marking availability in your agent settings to
              view available jobs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading available jobs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-900">Error Loading Jobs</p>
            <p className="text-sm text-red-800">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => fetchAvailableJobs(userLocation, maxDistance)}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (filteredJobs.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <MapPin className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-3 font-medium text-gray-900">No Jobs Available</p>
        <p className="text-sm text-gray-600">
          No marking jobs are available in your service area right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Available Jobs ({filteredJobs.length})
          </h2>
          <p className="text-sm text-gray-600">
            {userLocation && `Within ${maxDistance}km of your location`}
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'distance' | 'urgency' | 'reward')
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <option value="distance">Sort by Distance</option>
            <option value="urgency">Sort by Urgency</option>
            <option value="reward">Sort by Reward</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onAccept={() => handleAcceptJob(job.id)}
            isAccepting={isAccepting === job.id}
            userLocation={userLocation}
          />
        ))}
      </div>
    </div>
  );
}








// // apps/platform/components/marking/AvailableJobsList.tsx
// "use client";

// import { Card, CardContent, CardFooter } from "@newcondo/ui/card";
// import { Button } from "@newcondo/ui/button";
// import { Badge } from "@newcondo/ui/badge";
// import { MapPin, DollarSign, Clock, AlertCircle, Eye } from "lucide-react";
// import { formatDistanceToNow } from "date-fns";

// interface AvailableJobsListProps {
//   jobs: Array<{
//     id: string;
//     property: {
//       title: string;
//       address: string;
//       city: string;
//       state: string;
//     };
//     markingFee: number;
//     urgencyLevel: string;
//     queuePosition?: number;
//     createdAt: string;
//     contactPersonName: string;
//   }>;
//   onAcceptJob: (jobId: string) => void;
//   onViewDetails: (jobId: string) => void;
//   isAccepting?: string; // jobId currently being accepted
// }

// const urgencyConfig = {
//   LOW: { color: "bg-gray-100 text-gray-800", label: "Low Priority" },
//   NORMAL: { color: "bg-blue-100 text-blue-800", label: "Normal" },
//   HIGH: { color: "bg-orange-100 text-orange-800", label: "High Priority" },
//   URGENT: { color: "bg-red-100 text-red-800", label: "Urgent" },
// };

// export function AvailableJobsList({
//   jobs,
//   onAcceptJob,
//   onViewDetails,
//   isAccepting,
// }: AvailableJobsListProps) {
//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//       {jobs.map((job) => {
//         const urgency = urgencyConfig[job.urgencyLevel as keyof typeof urgencyConfig] || urgencyConfig.NORMAL;
//         const agentEarnings = job.markingFee * 0.25; // 25% commission

//         return (
//           <Card key={job.id} className="hover:shadow-lg transition-shadow">
//             <CardContent className="pt-6 space-y-4">
//               {/* Property Title */}
//               <div>
//                 <h3 className="font-semibold text-lg line-clamp-2">
//                   {job.property.title}
//                 </h3>
//                 <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
//                   <MapPin className="h-3 w-3" />
//                   <span className="line-clamp-1">
//                     {job.property.city}, {job.property.state}
//                   </span>
//                 </div>
//               </div>

//               {/* Earnings */}
//               <div className="bg-green-50 border border-green-200 rounded-lg p-3">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <DollarSign className="h-4 w-4 text-green-600" />
//                     <span className="text-sm text-green-700">Your Earnings</span>
//                   </div>
//                   <span className="text-lg font-bold text-green-700">
//                     ₦{agentEarnings.toLocaleString()}
//                   </span>
//                 </div>
//               </div>

//               {/* Urgency & Queue */}
//               <div className="flex items-center justify-between gap-2">
//                 <Badge variant="outline" className={urgency.color}>
//                   {urgency.label}
//                 </Badge>
//                 {job.queuePosition && job.queuePosition > 0 && (
//                   <div className="flex items-center gap-1 text-xs text-muted-foreground">
//                     <Clock className="h-3 w-3" />
//                     <span>#{job.queuePosition} in queue</span>
//                   </div>
//                 )}
//               </div>

//               {/* Contact Person */}
//               <div className="text-sm">
//                 <p className="text-muted-foreground">Contact Person</p>
//                 <p className="font-medium">{job.contactPersonName}</p>
//               </div>

//               {/* Time Posted */}
//               <p className="text-xs text-muted-foreground">
//                 Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
//               </p>

//               {/* Warnings */}
//               {job.urgencyLevel === "URGENT" && (
//                 <div className="bg-red-50 border border-red-200 rounded p-2 flex items-start gap-2">
//                   <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
//                   <p className="text-xs text-red-800">
//                     Urgent job - property owner needs immediate assistance
//                   </p>
//                 </div>
//               )}
//             </CardContent>

//             <CardFooter className="border-t pt-4 flex gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="flex-1"
//                 onClick={() => onViewDetails(job.id)}
//               >
//                 <Eye className="h-4 w-4 mr-1" />
//                 Details
//               </Button>
//               <Button
//                 size="sm"
//                 className="flex-1"
//                 onClick={() => onAcceptJob(job.id)}
//                 disabled={isAccepting === job.id}
//               >
//                 {isAccepting === job.id ? "Accepting..." : "Accept Job"}
//               </Button>
//             </CardFooter>
//           </Card>
//         );
//       })}
//     </div>
//   );
// }