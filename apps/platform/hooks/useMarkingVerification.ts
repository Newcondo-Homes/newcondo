// apps/platform/hooks/useMarkingVerification.ts
'use client'

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MarkingVerificationData {
  markingJobId: string;
  propertyId: string;
  completionImages: string[];
  boundaryData: {
    coordinates: Array<{ lat: number; lng: number }>;
    area: number;
  };
  completionNotes?: string;
  agentId: string;
  agentName: string;
  completedAt: string;
  verificationDeadline: string;
}

interface VerificationStatus {
  isVerified: boolean;
  verifiedAt?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  rejectionReason?: string;
  remainingTime?: number; // in milliseconds
}

interface UseMarkingVerificationOptions {
  markingJobId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseMarkingVerificationReturn {
  verificationData: MarkingVerificationData | null;
  verificationStatus: VerificationStatus | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  verifyMarking: (markingJobId: string, notes?: string) => Promise<void>;
  rejectMarking: (markingJobId: string, reason: string) => Promise<void>;
  isVerifying: boolean;
  isRejecting: boolean;
  verifyError: Error | null;
  rejectError: Error | null;
  canVerify: boolean;
  canReject: boolean;
  hasExpired: boolean;
  refetch: () => void;
}

export const useMarkingVerification = ({
  markingJobId,
  autoRefresh = true,
  refreshInterval = 60000 // 1 minute
}: UseMarkingVerificationOptions = {}): UseMarkingVerificationReturn => {
  const queryClient = useQueryClient();
  const [verifyError, setVerifyError] = useState<Error | null>(null);
  const [rejectError, setRejectError] = useState<Error | null>(null);

  // Fetch marking verification data
  const {
    data: verificationData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<MarkingVerificationData | null, Error>({
    queryKey: ['markingVerification', markingJobId],
    queryFn: async () => {
      if (!markingJobId) return null;

      const response = await fetch(`/api/marking/verification/${markingJobId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch verification data');
      }

      return response.json();
    },
    enabled: !!markingJobId,
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchOnWindowFocus: autoRefresh
  });

  // Fetch verification status
  const { data: verificationStatus } = useQuery<VerificationStatus | null>({
    queryKey: ['verificationStatus', markingJobId],
    queryFn: async () => {
      if (!markingJobId) return null;

      const response = await fetch(`/api/marking/verification/${markingJobId}/status`);

      if (!response.ok) {
        throw new Error('Failed to fetch verification status');
      }

      return response.json();
    },
    enabled: !!markingJobId,
    refetchInterval: autoRefresh ? refreshInterval : false
  });

  // Verify marking mutation
  const { mutateAsync: verifyMarkingMutation, isPending: isVerifying } = useMutation({
    mutationFn: async ({ markingJobId, notes }: { markingJobId: string; notes?: string }) => {
      const response = await fetch(`/api/marking/verification/${markingJobId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify marking');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['markingVerification', markingJobId] });
      queryClient.invalidateQueries({ queryKey: ['verificationStatus', markingJobId] });
      queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
      setVerifyError(null);
    },
    onError: (error: Error) => {
      setVerifyError(error);
    }
  });

  // Reject marking mutation
  const { mutateAsync: rejectMarkingMutation, isPending: isRejecting } = useMutation({
    mutationFn: async ({ markingJobId, reason }: { markingJobId: string; reason: string }) => {
      const response = await fetch(`/api/marking/verification/${markingJobId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject marking');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['markingVerification', markingJobId] });
      queryClient.invalidateQueries({ queryKey: ['verificationStatus', markingJobId] });
      queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
      setRejectError(null);
    },
    onError: (error: Error) => {
      setRejectError(error);
    }
  });

  const verifyMarking = useCallback(
    async (jobId: string, notes?: string) => {
      try {
        await verifyMarkingMutation({ markingJobId: jobId, notes });
      } catch (error) {
        console.error('Error verifying marking:', error);
      }
    },
    [verifyMarkingMutation]
  );

  const rejectMarking = useCallback(
    async (jobId: string, reason: string) => {
      try {
        await rejectMarkingMutation({ markingJobId: jobId, reason });
      } catch (error) {
        console.error('Error rejecting marking:', error);
      }
    },
    [rejectMarkingMutation]
  );

  // Calculate derived states
  const hasExpired = verificationStatus?.status === 'EXPIRED';
  const canVerify = 
    verificationStatus?.status === 'PENDING' && 
    !hasExpired && 
    !isVerifying && 
    !isRejecting;
  const canReject = 
    verificationStatus?.status === 'PENDING' && 
    !hasExpired && 
    !isVerifying && 
    !isRejecting;

  return {
    verificationData: verificationData || null,
    verificationStatus: verificationStatus || null,
    isLoading,
    isError,
    error: error as Error | null,
    verifyMarking,
    rejectMarking,
    isVerifying,
    isRejecting,
    verifyError,
    rejectError,
    canVerify,
    canReject,
    hasExpired,
    refetch
  };
};

// Hook to check if images are valid for verification
export const useVerifyMarkingImages = () => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateImages = useCallback((images: string[]): boolean => {
    const errors: string[] = [];

    if (!images || images.length === 0) {
      errors.push('At least one image is required');
    }

    if (images.length < 3) {
      errors.push('Minimum 3 images required for verification');
    }

    if (images.length > 20) {
      errors.push('Maximum 20 images allowed');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, []);

  return {
    validateImages,
    validationErrors
  };
};

// Hook to compare boundary data with expected coordinates
export const useBoundaryValidation = () => {
  const validateBoundary = useCallback((
    markedBoundary: Array<{ lat: number; lng: number }>,
    expectedLocation: { lat: number; lng: number },
    toleranceMeters: number = 50
  ): { isValid: boolean; distance: number } => {
    // Calculate if marked boundary is within tolerance of expected location
    const boundaryCenter = calculateCentroid(markedBoundary);
    const distance = calculateDistance(boundaryCenter, expectedLocation);
    const isValid = distance <= toleranceMeters;

    return { isValid, distance };
  }, []);

  const calculateCentroid = (
    coordinates: Array<{ lat: number; lng: number }>
  ): { lat: number; lng: number } => {
    const sum = coordinates.reduce(
      (acc, coord) => ({
        lat: acc.lat + coord.lat,
        lng: acc.lng + coord.lng
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: sum.lat / coordinates.length,
      lng: sum.lng / coordinates.length
    };
  };

  const calculateDistance = (
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
  ): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (value: number): number => {
    return (value * Math.PI) / 180;
  };

  return { validateBoundary };
};