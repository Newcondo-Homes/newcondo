// apps/platform/hooks/useViewTracking.ts
'use client'

import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { trackPropertyView, trackPropertyEngagement } from '@/lib/api/propertyAnalytics';

export interface ViewMetadata {
  referrer?: string;
  source?: string;
  campaign?: string;
  agentReferralCode?: string;
  subAgentId?: string;
}

export const useViewTracking = (
  propertyId: string | undefined,
  metadata?: ViewMetadata
) => {
  const viewTracked = useRef(false);
  const viewStartTime = useRef<number>(Date.now());

  const trackViewMutation = useMutation({
    mutationFn: (data: { propertyId: string; metadata?: ViewMetadata }) =>
      trackPropertyView(data.propertyId, data.metadata),
  });

  const trackEngagementMutation = useMutation({
    mutationFn: (data: {
      propertyId: string;
      duration: number;
      interactions: string[];
    }) => trackPropertyEngagement(data.propertyId, data.duration, data.interactions),
  });

  // Track view on mount
  useEffect(() => {
    if (propertyId && !viewTracked.current) {
      trackViewMutation.mutate({ propertyId, metadata });
      viewTracked.current = true;
      viewStartTime.current = Date.now();
    }
  }, [propertyId, metadata]);

  // Track engagement on unmount
  useEffect(() => {
    return () => {
      if (propertyId && viewTracked.current) {
        const duration = Math.floor((Date.now() - viewStartTime.current) / 1000);
        
        // Only track if user spent at least 3 seconds
        if (duration >= 3) {
          trackEngagementMutation.mutate({
            propertyId,
            duration,
            interactions: [], // Can be enhanced to track specific interactions
          });
        }
      }
    };
  }, [propertyId]);

  const trackInteraction = (interactionType: string) => {
    // Track specific interactions like image view, favorite, share, etc.
    // Can be enhanced with more detailed tracking
  };

  return {
    trackInteraction,
    isTrackingView: trackViewMutation.isPending,
  };
};

// Hook for tracking property shares
export const useShareTracking = () => {
  const trackShareMutation = useMutation({
    mutationFn: ({ propertyId, platform }: { propertyId: string; platform: string }) =>
      trackPropertyEngagement(propertyId, 0, [`share_${platform}`]),
  });

  const trackShare = (propertyId: string, platform: string) => {
    trackShareMutation.mutate({ propertyId, platform });
  };

  return {
    trackShare,
    isTracking: trackShareMutation.isPending,
  };
};

// Hook for tracking favorites
export const useFavoriteTracking = () => {
  const trackFavoriteMutation = useMutation({
    mutationFn: ({ propertyId, action }: { propertyId: string; action: 'add' | 'remove' }) =>
      trackPropertyEngagement(propertyId, 0, [`favorite_${action}`]),
  });

  const trackFavorite = (propertyId: string, action: 'add' | 'remove') => {
    trackFavoriteMutation.mutate({ propertyId, action });
  };

  return {
    trackFavorite,
    isTracking: trackFavoriteMutation.isPending,
  };
};