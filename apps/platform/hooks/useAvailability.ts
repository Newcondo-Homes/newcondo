'use client'

import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@newcondo/ui';

interface AvailabilityStatus {
  propertyId: string;
  unitId?: string;
  isAvailable: boolean;
  isLocked: boolean;
  lockExpiry: Date | null;
  lastUpdated: Date;
  status: 'AVAILABLE' | 'LOCKED' | 'RENTED' | 'UNAVAILABLE';
  totalUnits?: number;
  availableUnits?: number;
}

interface AvailabilityChangeEvent {
  propertyId: string;
  unitId?: string;
  previousStatus: string;
  newStatus: string;
  timestamp: Date;
}

export function useAvailability(
  propertyId?: string,
  unitId?: string,
  options?: {
    enableRealtime?: boolean;
    onAvailabilityChange?: (event: AvailabilityChangeEvent) => void;
  }
) {
  const queryClient = useQueryClient();
  const { enableRealtime = true, onAvailabilityChange } = options || {};

  // Fetch availability status
  const { data: availability, isLoading, error } = useQuery<AvailabilityStatus>({
    queryKey: ['availability', propertyId, unitId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (unitId) params.append('unitId', unitId);

      const response = await fetch(
        `/api/properties/availability?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      return response.json();
    },
    enabled: !!propertyId,
    refetchInterval: enableRealtime ? 3000 : false, // Poll every 3 seconds
    staleTime: 2000, // Consider data stale after 2 seconds
  });

  // Set up WebSocket connection for real-time updates (optional enhancement)
  useEffect(() => {
    if (!enableRealtime || !propertyId) return;

    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/availability?propertyId=${propertyId}${unitId ? `&unitId=${unitId}` : ''}`
    );

    ws.onmessage = (event) => {
      const data: AvailabilityStatus = JSON.parse(event.data);
      
      // Update query cache
      queryClient.setQueryData(['availability', propertyId, unitId], data);
      
      // Trigger callback if provided
      if (onAvailabilityChange && availability) {
        onAvailabilityChange({
          propertyId,
          unitId,
          previousStatus: availability.status,
          newStatus: data.status,
          timestamp: new Date(),
        });
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [propertyId, unitId, enableRealtime, queryClient, availability, onAvailabilityChange]);

  // Monitor availability changes
  useEffect(() => {
    if (!availability) return;

    // Notify if property becomes unavailable
    if (availability.status === 'RENTED' || availability.status === 'UNAVAILABLE') {
      toast.error('Property No Longer Available',{
        description: 'This property has been rented or marked unavailable.',
      });
    }

    // Notify if property is locked by someone else
    if (availability.isLocked && availability.status === 'LOCKED') {
      toast.error('Property Currently Locked',{
        description: 'Someone else is processing payment for this property.',
      });
    }
  }, [availability?.status, availability?.isLocked, toast]);

  // Check if property/unit is available
  const isAvailable = useCallback(() => {
    if (!availability) return false;
    return availability.status === 'AVAILABLE' && !availability.isLocked;
  }, [availability]);

  // Check if locked by current time
  const isLockExpired = useCallback(() => {
    if (!availability?.lockExpiry) return true;
    return new Date(availability.lockExpiry) <= new Date();
  }, [availability]);

  // Get time until lock expires
  const getTimeUntilUnlock = useCallback(() => {
    if (!availability?.lockExpiry) return 0;
    const expiry = new Date(availability.lockExpiry).getTime();
    const now = Date.now();
    return Math.max(0, expiry - now);
  }, [availability]);

  // Format availability status message
  const getAvailabilityMessage = useCallback(() => {
    if (!availability) return 'Loading...';

    switch (availability.status) {
      case 'AVAILABLE':
        return 'Available for rent';
      case 'LOCKED':
        const minutes = Math.ceil(getTimeUntilUnlock() / 60000);
        return `Locked for payment (${minutes} min remaining)`;
      case 'RENTED':
        return 'Currently rented';
      case 'UNAVAILABLE':
        return 'Not available';
      default:
        return 'Status unknown';
    }
  }, [availability, getTimeUntilUnlock]);

  // Get unit availability summary (for multi-family properties)
  const getUnitSummary = useCallback(() => {
    if (!availability?.totalUnits) return null;
    
    return {
      total: availability.totalUnits,
      available: availability.availableUnits ?? 0,
      occupied: availability.totalUnits - (availability.availableUnits ?? 0),
      percentageAvailable: ((availability.availableUnits ?? 0) / availability.totalUnits) * 100,
    };
  }, [availability]);

  return {
    availability,
    isLoading,
    error,
    
    // Status checks
    isAvailable: isAvailable(),
    isLocked: availability?.isLocked ?? false,
    isRented: availability?.status === 'RENTED',
    isLockExpired: isLockExpired(),
    
    // Time calculations
    timeUntilUnlock: getTimeUntilUnlock(),
    
    // Messages and summaries
    availabilityMessage: getAvailabilityMessage(),
    unitSummary: getUnitSummary(),
    
    // Refresh function
    refresh: () => queryClient.invalidateQueries({ 
      queryKey: ['availability', propertyId, unitId] 
    }),
  };
}