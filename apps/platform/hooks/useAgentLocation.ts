// apps/platform/hooks/useAgentLocation.ts
'use client'

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Coordinates, ServiceArea } from '@/types/marking';

// This would connect to your backend API for updating agent location
// For now, we'll define the structure

interface AgentLocationState {
  coordinates: Coordinates | null;
  isAvailableForMarking: boolean;
  serviceAreas: ServiceArea[];
  isTracking: boolean;
  error: string | null;
}

interface UpdateAgentLocationData {
  coordinates: Coordinates;
  isAvailableForMarking: boolean;
  serviceAreas: ServiceArea[];
}

/**
 * Hook to manage agent location and availability for marking jobs
 */
export function useAgentLocation() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AgentLocationState>({
    coordinates: null,
    isAvailableForMarking: false,
    serviceAreas: [],
    isTracking: false,
    error: null,
  });

  // Get current location from browser
  const getCurrentLocation = useCallback((): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(`Failed to get location: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  // Start tracking location
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isTracking: true, error: null }));

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState((prev) => ({
          ...prev,
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          error: null,
        }));
      },
      (error) => {
        setState((prev) => ({
          ...prev,
          error: `Location tracking error: ${error.message}`,
          isTracking: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000, // Update every minute
      }
    );

    // Return cleanup function
    return () => {
      navigator.geolocation.clearWatch(watchId);
      setState((prev) => ({ ...prev, isTracking: false }));
    };
  }, []);

  // Stop tracking location
  const stopTracking = useCallback(() => {
    setState((prev) => ({ ...prev, isTracking: false }));
  }, []);

  // Update agent location mutation (would call backend API)
  const updateLocationMutation = useMutation({
    mutationFn: async (data: UpdateAgentLocationData) => {
      // This would be replaced with actual API call
      // return client.put('/agent/location', data);
      
      // Simulated API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, data });
        }, 500);
      });
    },
    onSuccess: (response, variables) => {
      toast.success('Location updated successfully');
      setState((prev) => ({
        ...prev,
        coordinates: variables.coordinates,
        isAvailableForMarking: variables.isAvailableForMarking,
        serviceAreas: variables.serviceAreas,
      }));
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['marking-jobs', 'available'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update location');
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to update location',
      }));
    },
  });

  // Set availability for marking
  const setAvailability = useCallback(
    async (isAvailable: boolean) => {
      try {
        const currentLocation = state.coordinates || (await getCurrentLocation());
        
        await updateLocationMutation.mutateAsync({
          coordinates: currentLocation,
          isAvailableForMarking: isAvailable,
          serviceAreas: state.serviceAreas,
        });
      } catch (error: any) {
        toast.error(error.message || 'Failed to update availability');
      }
    },
    [state.coordinates, state.serviceAreas, getCurrentLocation, updateLocationMutation]
  );

  // Update service areas
  const updateServiceAreas = useCallback(
    async (serviceAreas: ServiceArea[]) => {
      try {
        const currentLocation = state.coordinates || (await getCurrentLocation());
        
        await updateLocationMutation.mutateAsync({
          coordinates: currentLocation,
          isAvailableForMarking: state.isAvailableForMarking,
          serviceAreas,
        });
      } catch (error: any) {
        toast.error(error.message || 'Failed to update service areas');
      }
    },
    [state.coordinates, state.isAvailableForMarking, getCurrentLocation, updateLocationMutation]
  );

  // Update location manually
  const updateLocation = useCallback(async () => {
    try {
      const currentLocation = await getCurrentLocation();
      
      await updateLocationMutation.mutateAsync({
        coordinates: currentLocation,
        isAvailableForMarking: state.isAvailableForMarking,
        serviceAreas: state.serviceAreas,
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update location');
    }
  }, [state.isAvailableForMarking, state.serviceAreas, getCurrentLocation, updateLocationMutation]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback(
    (coord1: Coordinates, coord2: Coordinates): number => {
      const R = 6371; // Radius of the Earth in kilometers
      const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
      const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((coord1.lat * Math.PI) / 180) *
          Math.cos((coord2.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in kilometers
    },
    []
  );

  // Check if coordinates are within service area
  const isWithinServiceArea = useCallback(
    (jobLocation: Coordinates): boolean => {
      if (!state.coordinates) return false;
      
      const distance = calculateDistance(state.coordinates, jobLocation);
      
      // Check against service areas (simplified - in reality, you'd check state/LGA)
      // For now, we'll use a simple radius check of 50km
      return distance <= 50;
    },
    [state.coordinates, calculateDistance]
  );

  // Request location permission
  const requestLocationPermission = useCallback(async () => {
    try {
      const location = await getCurrentLocation();
      setState((prev) => ({
        ...prev,
        coordinates: location,
        error: null,
      }));
      toast.success('Location permission granted');
      return location;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
      toast.error(error.message);
      throw error;
    }
  }, [getCurrentLocation]);

  return {
    // State
    coordinates: state.coordinates,
    isAvailableForMarking: state.isAvailableForMarking,
    serviceAreas: state.serviceAreas,
    isTracking: state.isTracking,
    error: state.error,
    isLoading: updateLocationMutation.isPending,

    // Actions
    getCurrentLocation,
    startTracking,
    stopTracking,
    setAvailability,
    updateServiceAreas,
    updateLocation,
    requestLocationPermission,

    // Utilities
    calculateDistance,
    isWithinServiceArea,
  };
}

// Helper hook to check location permission status
export function useLocationPermission() {
  const [permissionStatus, setPermissionStatus] = useState<
    'granted' | 'denied' | 'prompt' | 'unknown'
  >('unknown');

  useEffect(() => {
    if (!navigator.permissions) {
      setPermissionStatus('unknown');
      return;
    }

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((result) => {
        setPermissionStatus(result.state);

        result.addEventListener('change', () => {
          setPermissionStatus(result.state);
        });
      })
      .catch(() => {
        setPermissionStatus('unknown');
      });
  }, []);

  return permissionStatus;
}

// Helper hook for formatted distance
export function useFormattedDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}