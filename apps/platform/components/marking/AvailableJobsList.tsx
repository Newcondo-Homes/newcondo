// apps/platform/components/marking/AvailableJobsList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import JobCard from './JobCard';
import { useMarkingJobs } from '@/hooks/useMarkingJobs';
import { Button } from '@/components/ui/button';
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
  }, [user?.isAvailableForMarking, userLocation, maxDistance]);

  useEffect(() => {
    let sorted = [...availableJobs];

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