// File: apps/platform/hooks/useAvailableJobs.ts

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface AvailableJob {
  id: string;
  propertyId: string;
  requestedBy: string;
  status: string;
  markingFee: number;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  contactPersonName: string;
  accessInstructions?: string;
  preferredTime?: string;
  createdAt: string;
  queueCount: number; // Number of agents already in queue
  distance?: number; // Distance from agent's service area in km
  locationCity: string;
  locationState: string;
}

interface JobFilters {
  urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  maxDistance?: number; // in kilometers
  minFee?: number;
  maxFee?: number;
  sortBy?: 'recent' | 'urgency' | 'distance' | 'fee';
  limit?: number;
}

interface AvailableJobsState {
  jobs: AvailableJob[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  filters: JobFilters;
}

export function useAvailableJobs(initialFilters: JobFilters = {}) {
  const { user } = useAuth();
  const [state, setState] = useState<AvailableJobsState>({
    jobs: [],
    totalCount: 0,
    loading: false,
    error: null,
    filters: {
      sortBy: 'recent',
      limit: 20,
      ...initialFilters,
    },
  });

  // Fetch available jobs with filters
  const fetchAvailableJobs = useCallback(async () => {
    if (!user?.id || !user.isAvailableForMarking) {
      setState((prev) => ({
        ...prev,
        error: 'User must be available for marking',
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const params = new URLSearchParams();

      if (state.filters.urgency) {
        params.append('urgency', state.filters.urgency);
      }
      if (state.filters.maxDistance) {
        params.append('maxDistance', state.filters.maxDistance.toString());
      }
      if (state.filters.minFee) {
        params.append('minFee', state.filters.minFee.toString());
      }
      if (state.filters.maxFee) {
        params.append('maxFee', state.filters.maxFee.toString());
      }
      if (state.filters.sortBy) {
        params.append('sortBy', state.filters.sortBy);
      }
      if (state.filters.limit) {
        params.append('limit', state.filters.limit.toString());
      }

      const res = await fetch(
        `/api/marking/available-jobs?${params.toString()}`
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch available jobs: ${res.statusText}`);
      }

      const data = await res.json();
      setState((prev) => ({
        ...prev,
        jobs: data.jobs || [],
        totalCount: data.totalCount || 0,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({ ...prev, error: errorMsg }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [user?.id, user?.isAvailableForMarking, state.filters]);

  // Update filters and refetch
  const updateFilters = useCallback(
    (newFilters: Partial<JobFilters>) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, ...newFilters },
      }));
    },
    []
  );

  // Get single job details
  const getJobDetails = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/marking/available-jobs/${jobId}`);

      if (!res.ok) {
        throw new Error('Failed to fetch job details');
      }

      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error fetching job details:', err);
      return null;
    }
  }, []);

  // Refresh available jobs
  const refreshJobs = useCallback(() => {
    fetchAvailableJobs();
  }, [fetchAvailableJobs]);

  // Auto-refresh available jobs when filters change
  useEffect(() => {
    fetchAvailableJobs();
  }, [state.filters, fetchAvailableJobs]);

  // Set up polling for new jobs (every 60 seconds)
  useEffect(() => {
    if (!user?.isAvailableForMarking) return;

    const interval = setInterval(() => {
      fetchAvailableJobs();
    }, 60000);

    return () => clearInterval(interval);
  }, [user?.isAvailableForMarking, fetchAvailableJobs]);

  return {
    jobs: state.jobs,
    totalCount: state.totalCount,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    updateFilters,
    getJobDetails,
    refreshJobs,
  };
}