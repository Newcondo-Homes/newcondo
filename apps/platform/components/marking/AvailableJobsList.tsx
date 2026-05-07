'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import JobCard from './JobCard';
import { useMarkingJobs } from '@/hooks/useMarkingJobs';
import { Button } from '@newcondo/ui/components/button';
import { AlertCircle, Loader2, MapPin } from 'lucide-react';
import { type Job } from '@/types/marking';


interface AvailableJobsListProps {
  jobs: Job[];
  onAcceptJob: (jobId: string) => void;
  onViewDetails: (jobId: string) => void;
  userLocation?: { lat: number; lng: number };
  maxDistance?: number;
}

export default function AvailableJobsList({
  jobs,
  onAcceptJob,
  onViewDetails,
  userLocation,
  maxDistance = 10,
}: AvailableJobsListProps) {
  const { user } = useAuth();
  const { loading, error, acceptJob, fetchAvailableJobs } = useMarkingJobs();
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(jobs);
  const [sortBy, setSortBy] = useState<'distance' | 'urgency' | 'reward'>('distance');
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  useEffect(() => {
    if (user?.isAvailableForMarking) {
      fetchAvailableJobs(userLocation, maxDistance);
    }
  }, [user?.isAvailableForMarking, userLocation, maxDistance, fetchAvailableJobs]);

  useEffect(() => {
    const sorted = [...jobs];

    if (sortBy === 'distance' && userLocation) {
      sorted.sort(
        (a, b) =>
          (a.distanceFromAgent ?? Infinity) - (b.distanceFromAgent ?? Infinity)
      );
    } else if (sortBy === 'urgency') {
      const urgencyOrder: Record<string, number> = {
        URGENT: 0,
        HIGH: 1,
        NORMAL: 2,
        LOW: 3,
      };
      sorted.sort(
        (a, b) =>
          (urgencyOrder[a.urgencyLevel ?? ''] ?? 99) -
          (urgencyOrder[b.urgencyLevel ?? ''] ?? 99)
      );
    } else if (sortBy === 'reward') {
      sorted.sort((a, b) => Number(b.markingFee ?? 0) - Number(a.markingFee ?? 0));
    }

    setFilteredJobs(sorted);
  }, [jobs, sortBy, userLocation]);

  const handleAcceptJob = useCallback(
    async (jobId: string) => {
      setIsAccepting(jobId);
      try {
        await acceptJob(jobId);
        onAcceptJob(jobId);
      } finally {
        setIsAccepting(null);
      }
    },
    [acceptJob, onAcceptJob]
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
            onViewDetails={() => onViewDetails(job.id)}
            isAccepting={isAccepting === job.id}
            userLocation={userLocation}
          />
        ))}
      </div>
    </div>
  );
}