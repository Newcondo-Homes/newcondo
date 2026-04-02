// apps/platform/hooks/usePromotionLink.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  generatePromotionLink,
  requestPromotionAccess,
  getPromotionLinkStats,
  updatePromotionSettings,
} from '@/lib/api/subAgents';
import { useToast } from '@/hooks/useToast';
import { useState } from 'react';

export interface PromotionSettings {
  allowPublicPromotion?: boolean;
  allowPermissionBasedPromotion?: boolean;
  requireApproval?: boolean;
  commissionSplitPercentage?: number; // Sub-agent's share (0-50)
}

export const usePromotionLink = (propertyId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Generate promotion link mutation
  const generateLinkMutation = useMutation({
    mutationFn: () => generatePromotionLink(propertyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agent-referrals'] });
      
      // Copy to clipboard
      if (navigator.clipboard && data.promotionLink) {
        navigator.clipboard.writeText(data.promotionLink);
        setCopiedLink(data.promotionLink);
        
        toast({
          title: 'Success',
          description: 'Promotion link copied to clipboard',
        });
        
        // Reset copied state after 3 seconds
        setTimeout(() => setCopiedLink(null), 3000);
      }
      
      return data;
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate promotion link',
        variant: 'destructive',
      });
    },
  });

  // Request promotion access mutation (for sub-agents)
  const requestAccessMutation = useMutation({
    mutationFn: (message?: string) => requestPromotionAccess(propertyId, message),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Promotion access requested. Awaiting approval.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request promotion access',
        variant: 'destructive',
      });
    },
  });

  // Update promotion settings mutation (for property owners/listing agents)
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: PromotionSettings) => 
      updatePromotionSettings(propertyId, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-settings', propertyId] });
      toast({
        title: 'Success',
        description: 'Promotion settings updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update promotion settings',
        variant: 'destructive',
      });
    },
  });

  return {
    // Actions
    generateLink: generateLinkMutation.mutate,
    generateLinkAsync: generateLinkMutation.mutateAsync,
    requestAccess: requestAccessMutation.mutate,
    updateSettings: updateSettingsMutation.mutate,
    
    // States
    isGenerating: generateLinkMutation.isPending,
    isRequesting: requestAccessMutation.isPending,
    isUpdatingSettings: updateSettingsMutation.isPending,
    copiedLink,
    
    // Data
    generatedLink: generateLinkMutation.data?.promotionLink,
    linkId: generateLinkMutation.data?.linkId,
    
    // Errors
    generateError: generateLinkMutation.error,
    requestError: requestAccessMutation.error,
    settingsError: updateSettingsMutation.error,
  };
};

// Hook for promotion link statistics
export const usePromotionLinkStats = (propertyId: string, linkId?: string) => {
  const query = useQuery({
    queryKey: ['promotion-link-stats', propertyId, linkId],
    queryFn: () => getPromotionLinkStats(propertyId, linkId),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 minutes
  });

  return {
    // Stats
    totalClicks: query.data?.totalClicks || 0,
    totalViews: query.data?.totalViews || 0,
    totalConversions: query.data?.totalConversions || 0,
    conversionRate: query.data?.conversionRate || 0,
    
    // Earnings
    totalEarnings: query.data?.totalEarnings || 0,
    pendingEarnings: query.data?.pendingEarnings || 0,
    
    // Recent activity
    recentClicks: query.data?.recentClicks || [],
    recentConversions: query.data?.recentConversions || [],
    
    // Time-series data
    clicksByDay: query.data?.clicksByDay || [],
    viewsByDay: query.data?.viewsByDay || [],
    
    // Link info
    linkCreatedAt: query.data?.createdAt,
    isActive: query.data?.isActive || false,
    
    // States
    isLoading: query.isLoading,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
  };
};

// Hook for getting promotion settings
export const usePromotionSettings = (propertyId: string) => {
  const query = useQuery({
    queryKey: ['promotion-settings', propertyId],
    queryFn: () => updatePromotionSettings(propertyId, {}), // Fetch current settings
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

// Utility hook for sharing property link
export const useShareProperty = () => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const shareProperty = async (propertyId: string, title: string, url: string) => {
    setIsSharing(true);
    
    try {
      if (navigator.share) {
        // Use native share API if available
        await navigator.share({
          title: title,
          text: `Check out this property on Newcondo`,
          url: url,
        });
        
        toast({
          title: 'Success',
          description: 'Property shared successfully',
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
        
        toast({
          title: 'Success',
          description: 'Property link copied to clipboard',
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({
          title: 'Error',
          description: 'Failed to share property',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  return {
    shareProperty,
    isSharing,
  };
};