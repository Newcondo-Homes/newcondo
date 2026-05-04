// apps/platform/hooks/useShareableLink.ts
'use client'

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ShareableLink {
  id: string;
  jobId: string;
  token: string;
  url: string;
  expiresAt: Date;
  isActive: boolean;
  usedAt?: Date;
  usedBy?: string;
  maxUses: number;
  currentUses: number;
}

interface LinkAccessData {
  token: string;
  markerName?: string;
  markerPhone?: string;
}

interface LinkUsageData {
  jobId: string;
  boundaryData: any;
  images: string[];
  notes?: string;
}

export function useShareableLink() {
  const queryClient = useQueryClient();
  const [isCopied, setIsCopied] = useState(false);

  // Generate shareable link
  const generateLink = useMutation({
    mutationFn: async ({ 
      jobId, 
      expiryHours = 72, 
      maxUses = 1 
    }: { 
      jobId: string; 
      expiryHours?: number; 
      maxUses?: number 
    }) => {
      const res = await fetch('/api/marking-jobs/shareable-link/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ jobId, expiryHours, maxUses }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to generate link');
      }
      return res.json() as Promise<ShareableLink>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shareableLinks'] });
      toast.success('Shareable link generated successfully');
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Verify and access link
  const accessLink = useMutation({
    mutationFn: async (data: LinkAccessData) => {
      const res = await fetch('/api/marking-jobs/shareable-link/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Invalid or expired link');
      }
      return res.json();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Submit marking via shareable link
  const submitViaLink = useMutation({
    mutationFn: async ({ token, ...data }: LinkUsageData & { token: string }) => {
      const res = await fetch('/api/marking-jobs/shareable-link/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to submit marking');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Marking submitted successfully! The property owner will be notified.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Revoke shareable link
  const revokeLink = useMutation({
    mutationFn: async (linkId: string) => {
      const res = await fetch(`/api/marking-jobs/shareable-link/${linkId}/revoke`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to revoke link');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareableLinks'] });
      toast.success('Link revoked successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Fetch user's shareable links
  const {
    data: shareableLinks,
    isLoading,
    refetch
  } = useQuery<ShareableLink[]>({
    queryKey: ['shareableLinks'],
    queryFn: async () => {
      const res = await fetch('/api/marking-jobs/shareable-link', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch shareable links');
      return res.json();
    },
  });

  // Copy link to clipboard
  const copyToClipboard = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast.success('Link copied to clipboard!');
      
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
      
      return true;
    } catch (error) {
      toast.error('Failed to copy link');
      return false;
    }
  }, []);

  // Share via native share API
  const shareViaDevice = useCallback(async (url: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'Property Marking Link',
          text: 'Please mark this property using the link below',
          url,
        });
        toast.success('Link shared successfully');
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share link');
        }
        return false;
      }
    } else {
      // Fallback to copy
      return copyToClipboard(url);
    }
  }, [copyToClipboard]);

  // Check if link is valid
  const isLinkValid = useCallback((link: ShareableLink): boolean => {
    const now = new Date();
    const expiresAt = new Date(link.expiresAt);
    return (
      link.isActive && 
      expiresAt > now && 
      link.currentUses < link.maxUses
    );
  }, []);

  // Get link by job ID
  const getLinkByJobId = useCallback((jobId: string) => {
    return shareableLinks?.find(link => link.jobId === jobId);
  }, [shareableLinks]);

  // Get active links
  const activeLinks = shareableLinks?.filter(isLinkValid) || [];

  // Get expired links
  const expiredLinks = shareableLinks?.filter(link => !isLinkValid(link)) || [];

  return {
    shareableLinks,
    activeLinks,
    expiredLinks,
    isLoading,
    isCopied,
    refetch,
    generateLink: generateLink.mutateAsync,
    accessLink: accessLink.mutateAsync,
    submitViaLink: submitViaLink.mutateAsync,
    revokeLink: revokeLink.mutateAsync,
    copyToClipboard,
    shareViaDevice,
    isLinkValid,
    getLinkByJobId,
    isGenerating: generateLink.isPending,
    isAccessing: accessLink.isPending,
    isSubmitting: submitViaLink.isPending,
  };
}