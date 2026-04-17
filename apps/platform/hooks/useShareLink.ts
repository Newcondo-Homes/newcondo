import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@newcondo/ui';

interface ShareLinkData {
  id: string;
  propertyId: string;
  unitId?: string;
  shareableLink: string;
  shortCode: string;
  expiresAt?: Date;
  viewCount: number;
  clickCount: number;
  createdAt: Date;
}

interface GenerateLinkParams {
  propertyId: string;
  unitId?: string;
  expiryDays?: number;
  includeTracking?: boolean;
}

interface ShareLinkAnalytics {
  totalViews: number;
  totalClicks: number;
  uniqueVisitors: number;
  conversionRate: number;
  viewsByDate: Array<{ date: string; views: number }>;
  referrerSources: Array<{ source: string; count: number }>;
}

export function useShareLink(propertyId?: string, unitId?: string) {
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  // Fetch existing share link
  const { data: shareLink, isLoading } = useQuery<ShareLinkData | null>({
    queryKey: ['shareLink', propertyId, unitId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (unitId) params.append('unitId', unitId);

      const response = await fetch(
        `/api/properties/share-link?${params.toString()}`
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch share link');
      }

      return response.json();
    },
    enabled: !!propertyId,
  });

  // Fetch analytics
  const { data: analytics } = useQuery<ShareLinkAnalytics>({
    queryKey: ['shareLinkAnalytics', propertyId, unitId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (unitId) params.append('unitId', unitId);

      const response = await fetch(
        `/api/properties/share-link/analytics?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      return response.json();
    },
    enabled: !!shareLink,
  });

  // Generate new share link
  const generateMutation = useMutation({
    mutationFn: async ({ 
      propertyId, 
      unitId, 
      expiryDays = 30,
      includeTracking = true 
    }: GenerateLinkParams) => {
      const response = await fetch('/api/properties/share-link/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          propertyId, 
          unitId, 
          expiryDays,
          includeTracking 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate share link');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shareLink', propertyId, unitId] });
      
      toast.success('Share Link Generated',{
        description: 'Your property share link is ready!',
      });
    },
    onError: (error: Error) => {
      toast.error('Generation Failed',{
        description: error.message,
      });
    },
  });

  // Revoke share link
  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!shareLink?.id) throw new Error('No share link to revoke');

      const response = await fetch(`/api/properties/share-link/${shareLink.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke share link');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareLink', propertyId, unitId] });
      
      toast('Share Link Revoked',{
        description: 'The share link has been deactivated.',
      });
    },
  });

  // Copy link to clipboard
  const copyToClipboard = useCallback(async () => {
    if (!shareLink?.shareableLink) {
      toast('No Link Available',{
        description: 'Generate a share link first.',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(shareLink.shareableLink);
      setCopied(true);
      
      toast.success('Link Copied!',{
        description: 'Share link copied to clipboard.',
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Copy Failed',{
        description: 'Failed to copy link to clipboard.',
      });
    }
  }, [shareLink, toast]);

  // Get short URL
  const getShortUrl = useCallback(() => {
    if (!shareLink) return '';
    return `${process.env.NEXT_PUBLIC_APP_URL}/p/${shareLink.shortCode}`;
  }, [shareLink]);

  // Get full URL with tracking params
  const getFullUrl = useCallback((source?: string, medium?: string) => {
    if (!shareLink) return '';
    
    const url = new URL(shareLink.shareableLink);
    if (source) url.searchParams.set('utm_source', source);
    if (medium) url.searchParams.set('utm_medium', medium);
    
    return url.toString();
  }, [shareLink]);

  // Share via social media
  const shareVia = useCallback((platform: 'whatsapp' | 'facebook' | 'twitter' | 'email') => {
    if (!shareLink) return;

    const url = encodeURIComponent(shareLink.shareableLink);
    const text = encodeURIComponent('Check out this property!');

    const shareUrls = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      email: `mailto:?subject=Property Listing&body=${text}%20${url}`,
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  }, [shareLink]);

  // Check if link is expired
  const isExpired = useCallback(() => {
    if (!shareLink?.expiresAt) return false;
    return new Date(shareLink.expiresAt) <= new Date();
  }, [shareLink]);

  return {
    shareLink,
    analytics,
    isLoading,
    copied,
    
    // Actions
    generateLink: generateMutation.mutate,
    revokeLink: revokeMutation.mutate,
    copyToClipboard,
    shareVia,
    
    // URL getters
    shortUrl: getShortUrl(),
    getFullUrl,
    
    // Status checks
    hasLink: !!shareLink,
    isExpired: isExpired(),
    
    // Loading states
    isGenerating: generateMutation.isPending,
    isRevoking: revokeMutation.isPending,
  };
}