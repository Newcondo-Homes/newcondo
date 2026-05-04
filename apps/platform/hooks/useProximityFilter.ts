'use client'

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Types for proximity and location filtering
interface GeoCoordinates {
  lat: number;
  lng: number;
}

interface JobLocation {
  jobId: string;
  propertyId: string;
  address: string;
  city: string;
  state: string;
  coordinates: GeoCoordinates;
  urgencyLevel: string;
  markingFee: number;
  queuePosition: number;
}

interface ProximityResult {
  jobId: string;
  propertyId: string;
  address: string;
  distance: number; // in kilometers
  estimatedTravelTime: number; // in minutes
  coordinates: GeoCoordinates;
  urgencyLevel: string;
  markingFee: number;
  queuePosition: number;
  serviceArea: string; // city/LGA
}

interface ProximityFilterOptions {
  maxDistance?: number; // in kilometers, default 5km
  serviceAreas?: string[]; // specific cities/LGAs
  includeUrgentOnly?: boolean;
  minFee?: number;
  maxFee?: number;
  sortBy?: 'distance' | 'travelTime' | 'fee' | 'urgency' | 'queuePosition';
}

interface GeolocationStatus {
  isSupported: boolean;
  isEnabled: boolean;
  hasPermission: boolean;
  error?: string;
}

/**
 * Hook to manage proximity-based filtering of marking jobs
 * Uses geolocation to find jobs within reasonable distance from agent
 */
export const useProximityFilter = () => {
  const [agentLocation, setAgentLocation] = useState<GeoCoordinates | null>(null);
  const [geolocationStatus, setGeolocationStatus] = useState<GeolocationStatus>({
    isSupported: false,
    isEnabled: false,
    hasPermission: false,
  });
  const [proximityOptions, setProximityOptions] = useState<ProximityFilterOptions>({
    maxDistance: 5,
    sortBy: 'distance',
  });

  // Check geolocation support on mount
  useEffect(() => {
    const isSupported = 'geolocation' in navigator;
    setGeolocationStatus((prev) => ({
      ...prev,
      isSupported,
    }));
  }, []);

  // Request user's current location
  const requestLocationPermission = useCallback(() => {
    if (!geolocationStatus.isSupported) {
      setGeolocationStatus((prev) => ({
        ...prev,
        error: 'Geolocation is not supported in your browser',
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAgentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGeolocationStatus((prev) => ({
          ...prev,
          hasPermission: true,
          isEnabled: true,
          error: undefined,
        }));
      },
      (error) => {
        let errorMessage = 'Failed to get location';

        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied by user';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information is unavailable';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out';
        }

        setGeolocationStatus((prev) => ({
          ...prev,
          error: errorMessage,
          hasPermission: error.code !== error.PERMISSION_DENIED,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache location for 5 minutes
      }
    );
  }, [geolocationStatus.isSupported]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback((coord1: GeoCoordinates, coord2: GeoCoordinates): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coord1.lat * Math.PI) / 180) *
        Math.cos((coord2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimals
  }, []);

  // Estimate travel time (rough estimate: ~20 min per km in Lagos traffic)
  const estimateTravelTime = useCallback((distanceKm: number): number => {
    // Nigerian urban average: ~15-30 min per km depending on traffic
    // Using conservative estimate for peak hours
    const trafficFactor = 1.5; // Accounts for heavy traffic
    return Math.round(distanceKm * 3 * trafficFactor);
  }, []);

  // Fetch jobs within proximity
  const {
    data: proximityJobs = [],
    isLoading: isLoadingProximity,
    error: proximityError,
    refetch: refetchProximityJobs,
  } = useQuery({
    queryKey: ['proximityJobs', agentLocation, proximityOptions],
    queryFn: async () => {
      if (!agentLocation) return [];

      const params = new URLSearchParams();
      params.append('lat', agentLocation.lat.toString());
      params.append('lng', agentLocation.lng.toString());

      if (proximityOptions.maxDistance) {
        params.append('maxDistance', proximityOptions.maxDistance.toString());
      }
      if (proximityOptions.serviceAreas?.length) {
        params.append('serviceAreas', proximityOptions.serviceAreas.join(','));
      }
      if (proximityOptions.includeUrgentOnly) {
        params.append('urgentOnly', 'true');
      }
      if (proximityOptions.minFee) {
        params.append('minFee', proximityOptions.minFee.toString());
      }
      if (proximityOptions.maxFee) {
        params.append('maxFee', proximityOptions.maxFee.toString());
      }

      const response = await fetch(`/api/marking-jobs/proximity?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch proximity jobs');
      }

      return (await response.json()) as JobLocation[];
    },
    enabled: !!agentLocation,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
  });

  // Filter and sort jobs based on proximity and options
  const getFilteredAndSortedJobs = useCallback(() => {
    if (!agentLocation) return [];

    const jobsWithProximity: ProximityResult[] = proximityJobs.map((job) => {
      const distance = calculateDistance(agentLocation, job.coordinates);
      const estimatedTravelTime = estimateTravelTime(distance);

      return {
        jobId: job.jobId,
        propertyId: job.propertyId,
        address: job.address,
        distance,
        estimatedTravelTime,
        coordinates: job.coordinates,
        urgencyLevel: job.urgencyLevel,
        markingFee: job.markingFee,
        queuePosition: job.queuePosition,
        serviceArea: job.city,
      };
    });

    // Filter by max distance
    let filtered = jobsWithProximity.filter(
      (job) => job.distance <= (proximityOptions.maxDistance || 5)
    );

    // Filter by service areas if specified
    if (proximityOptions.serviceAreas?.length) {
      filtered = filtered.filter((job) =>
        proximityOptions.serviceAreas?.includes(job.serviceArea)
      );
    }

    // Filter by fee range if specified
    if (proximityOptions.minFee) {
      filtered = filtered.filter((job) => job.markingFee >= proximityOptions.minFee!);
    }
    if (proximityOptions.maxFee) {
      filtered = filtered.filter((job) => job.markingFee <= proximityOptions.maxFee!);
    }

    // Filter by urgency if specified
    if (proximityOptions.includeUrgentOnly) {
      filtered = filtered.filter((job) =>
        ['HIGH', 'URGENT'].includes(job.urgencyLevel)
      );
    }

    // Sort by selected criteria
    const sortBy = proximityOptions.sortBy || 'distance';
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.distance - b.distance;
        case 'travelTime':
          return a.estimatedTravelTime - b.estimatedTravelTime;
        case 'fee':
          return b.markingFee - a.markingFee;
        case 'urgency': {
          const urgencyOrder: Record<string, number> = {
            URGENT: 0,
            HIGH: 1,
            NORMAL: 2,
            LOW: 3,
          };
          return (urgencyOrder[a.urgencyLevel] || 2) - (urgencyOrder[b.urgencyLevel] || 2);
        }
        case 'queuePosition':
          return a.queuePosition - b.queuePosition;
        default:
          return a.distance - b.distance;
      }
    });

    return filtered;
  }, [agentLocation, proximityJobs, proximityOptions, calculateDistance, estimateTravelTime]);

  // Get nearby jobs (distance-wise)
  const getNearbyJobs = useCallback(
    (maxDistance?: number) => {
      const filtered = getFilteredAndSortedJobs();
      return filtered.filter((job) => job.distance <= (maxDistance || 2)); // Within 2km is very close
    },
    [getFilteredAndSortedJobs]
  );

  // Get closest job
  const getClosestJob = useCallback(() => {
    const filtered = getFilteredAndSortedJobs();
    return filtered.length > 0 ? filtered[0] : null;
  }, [getFilteredAndSortedJobs]);

  // Get highest fee job within range
  const getHighestFeeJob = useCallback(() => {
    const filtered = getFilteredAndSortedJobs();
    if (filtered.length === 0) return null;

    return [...filtered].sort((a, b) => b.markingFee - a.markingFee)[0];
  }, [getFilteredAndSortedJobs]);

  // Get most urgent job
  const getMostUrgentJob = useCallback(() => {
    const filtered = getFilteredAndSortedJobs();
    const urgencyOrder: Record<string, number> = {
      URGENT: 0,
      HIGH: 1,
      NORMAL: 2,
      LOW: 3,
    };

    if (filtered.length === 0) return null;

    return [...filtered].sort(
      (a, b) =>
        (urgencyOrder[a.urgencyLevel] || 2) - (urgencyOrder[b.urgencyLevel] || 2)
    )[0];
  }, [getFilteredAndSortedJobs]);

  // Get job with earliest queue position
  const getFirstInQueueJob = useCallback(() => {
    const filtered = getFilteredAndSortedJobs();
    if (filtered.length === 0) return null;

    return [...filtered].sort((a, b) => a.queuePosition - b.queuePosition)[0];
  }, [getFilteredAndSortedJobs]);

  // Check if there are any jobs available
  const hasAvailableJobs = useCallback(() => {
    return getFilteredAndSortedJobs().length > 0;
  }, [getFilteredAndSortedJobs]);

  // Get job count by urgency level
  const getJobCountByUrgency = useCallback(() => {
    const filtered = getFilteredAndSortedJobs();
    return {
      urgent: filtered.filter((j) => j.urgencyLevel === 'URGENT').length,
      high: filtered.filter((j) => j.urgencyLevel === 'HIGH').length,
      normal: filtered.filter((j) => j.urgencyLevel === 'NORMAL').length,
      low: filtered.filter((j) => j.urgencyLevel === 'LOW').length,
      total: filtered.length,
    };
  }, [getFilteredAndSortedJobs]);

  // Get average distance to all filtered jobs
  const getAverageDistance = useCallback(() => {
    const filtered = getFilteredAndSortedJobs();
    if (filtered.length === 0) return 0;

    const totalDistance = filtered.reduce((sum, job) => sum + job.distance, 0);
    return Math.round((totalDistance / filtered.length) * 100) / 100;
  }, [getFilteredAndSortedJobs]);

  // Get distance breakdown (jobs by distance tier)
  const getDistanceBreakdown = useCallback(() => {
    const filtered = getFilteredAndSortedJobs();
    return {
      veryClose: filtered.filter((j) => j.distance <= 1).length, // <= 1km
      close: filtered.filter((j) => j.distance > 1 && j.distance <= 2).length, // 1-2km
      moderate: filtered.filter((j) => j.distance > 2 && j.distance <= 5).length, // 2-5km
      far: filtered.filter((j) => j.distance > 5).length, // > 5km
    };
  }, [getFilteredAndSortedJobs]);

  // Watch location and auto-refetch when it changes
  useEffect(() => {
    if (agentLocation) {
      refetchProximityJobs();
    }
  }, [agentLocation, refetchProximityJobs]);

  return {
    // Location data
    agentLocation,
    setAgentLocation,
    geolocationStatus,
    requestLocationPermission,

    // Filter options
    proximityOptions,
    setProximityOptions,

    // Data
    proximityJobs,
    filteredAndSortedJobs: getFilteredAndSortedJobs(),

    // Loading and errors
    isLoadingProximity,
    proximityError,

    // Job selection utilities
    getNearbyJobs,
    getClosestJob,
    getHighestFeeJob,
    getMostUrgentJob,
    getFirstInQueueJob,
    hasAvailableJobs,

    // Analytics
    getJobCountByUrgency,
    getAverageDistance,
    getDistanceBreakdown,

    // Utilities
    calculateDistance,
    estimateTravelTime,

    // Refetch
    refetchProximityJobs,
  };
};

export default useProximityFilter;