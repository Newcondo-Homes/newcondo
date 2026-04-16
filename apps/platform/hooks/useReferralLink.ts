// apps/platform/hooks/useReferralLink.ts

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReferralStore } from '@/store/referralStore';
import * as referralApi from '@/lib/api/referrals';
import { copyToClipboard } from '@/lib/utils/shareHelpers';
import { generateReferralLink } from '@/lib/utils/referralHelpers';
import type { ReferralLink } from '@/types/referral';
import { toast } from 'sonner';

export function useReferralLink() {
  const addRecentlyCopiedLink = useReferralStore((s) => s.addRecentlyCopiedLink);
  const [isCopying, setIsCopying] = useState(false);
  const [ referralLink, setReferralLink ] = useState<ReferralLink | null>(null);

  // Fetch referral link
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<ReferralLink>({
    queryKey: ['referral-link'],
    queryFn: referralApi.getReferralLink,
    staleTime: Infinity, // Cache indefinitely unless manually refetched
  });

   useEffect(() => {
    if (data) {
      setReferralLink(data);
    }
  }, [data]);

  const link = data ?? referralLink;

  // Copy link to clipboard
  const copyLink = useCallback(async () => {
    if (!link?.url) {
      toast.error('Referral link not available');
      return false;
    }

    setIsCopying(true);
    const success = await copyToClipboard(link.url);
    setIsCopying(false);

    if (success) {
      toast.success('Link copied to clipboard!');
      addRecentlyCopiedLink(link.url);
    } else {
      toast.error('Failed to copy link');
    }

    return success;
  }, [link, addRecentlyCopiedLink]);

  // Copy code to clipboard
  const copyCode = useCallback(async () => {
    if (!link?.code) {
      toast.error('Referral code not available');
      return false;
    }

    setIsCopying(true);
    const success = await copyToClipboard(link.code);
    setIsCopying(false);

    if (success) {
      toast.success('Code copied to clipboard!');
    } else {
      toast.error('Failed to copy code');
    }

    return success;
  }, [link]);

  // Get full referral URL
  const getFullUrl = useCallback(() => {
    if (!link?.code) return '';
    return generateReferralLink(link.code);
  }, [link]);

  return {
    link,
    code: link?.code ?? '',
    url: link?.url ?? '',
    shortUrl: link?.shortUrl,
    isLoading,
    error,
    isCopying,
    copyLink,
    copyCode,
    getFullUrl,
    refetch,
  };
}

export function useReferralLinkGeneration() {
  const generateCustomLink = useCallback((code: string, params?: Record<string, string>) => {
    let url = generateReferralLink(code);
    
    if (params && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams(params);
      url += `?${queryParams.toString()}`;
    }
    
    return url;
  }, []);

  const generateShortenedLink = useCallback(async (fullUrl: string): Promise<string> => {
    // In production, integrate with URL shortener service
    // For now, return the full URL
    try {
      // Example: Call to URL shortener API
      // const response = await fetch('https://api.short.io/links', {
      //   method: 'POST',
      //   body: JSON.stringify({ originalURL: fullUrl }),
      // });
      // const data = await response.json();
      // return data.shortURL;
      
      return fullUrl;
    } catch (error) {
      console.error('Failed to shorten URL:', error);
      return fullUrl;
    }
  }, []);

  return {
    generateCustomLink,
    generateShortenedLink,
  };
}