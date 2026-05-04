// apps/platform/hooks/useShareReferral.ts
'use client'

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as referralApi from '@/lib/api/referrals';
import * as trackingApi from '@/lib/api/referralTracking';
import {
  getShareMessage,
  openShareDialog,
  shareViaNative,
  formatPhoneForWhatsApp,
} from '@/lib/utils/shareHelpers';
import { useReferralLink } from './useReferralLink';
import { ShareData } from '@/lib/utils/shareHelpers';
import { toast } from 'sonner';

export function useShareReferral() {
  const { link, code } = useReferralLink();
  const [isSharing, setIsSharing] = useState(false);

  // Track share mutation
  const trackShareMutation = useMutation({
    mutationFn: trackingApi.trackShare,
  });

  // Share via channel
  const shareViaChannel = useCallback(
    async (
      channel: string,
      shareData: Partial<ShareData>,
      customMessage?: string
    ) => {
      if (!link || !code) {
        toast.error('Referral link not available');
        return;
      }

      setIsSharing(true);

      try {
        const fullShareData: ShareData = {
          code,
          link: link.url,
          referrerName: shareData.referrerName || 'NewCondo User',
          referrerRole: shareData.referrerRole || 'USER',
          referredAmount: shareData.referredAmount || 0,
          referrerAmount: shareData.referrerAmount || 0,
          rewardType: shareData.rewardType || 'service credit',
        };

        const message = getShareMessage(
          channel as any,
          fullShareData,
          customMessage
        );

        // Handle email differently (it returns an object)
        if (channel === 'email' && typeof message === 'object') {
          openShareDialog(channel, link.url, message.template, message.subject);
        } else if (typeof message === 'string') {
          openShareDialog(channel, link.url, message);
        }

        // Track the share
        await trackShareMutation.mutateAsync({
          referralCode: code,
          channel,
        });

        toast.success(`Shared via ${channel}!`);
      } catch (error) {
        console.error('Share error:', error);
        toast.error(`Failed to share via ${channel}`);
      } finally {
        setIsSharing(false);
      }
    },
    [link, code, trackShareMutation]
  );

  // Share via WhatsApp with phone number
  const shareViaWhatsAppWithPhone = useCallback(
    async (phone: string, shareData: Partial<ShareData>, customMessage?: string) => {
      if (!link || !code) {
        toast.error('Referral link not available');
        return;
      }

      setIsSharing(true);

      try {
        const fullShareData: ShareData = {
          code,
          link: link.url,
          referrerName: shareData.referrerName || 'NewCondo User',
          referrerRole: shareData.referrerRole || 'USER',
          referredAmount: shareData.referredAmount || 0,
          referrerAmount: shareData.referrerAmount || 0,
          rewardType: shareData.rewardType || 'service credit',
        };

        const message = getShareMessage('whatsapp', fullShareData, customMessage);
        const formattedPhone = formatPhoneForWhatsApp(phone);
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
          message as string
        )}`;

        window.open(whatsappUrl, '_blank');

        // Track the share
        await trackShareMutation.mutateAsync({
          referralCode: code,
          channel: 'whatsapp',
          recipient: phone,
        });

        toast.success('Opening WhatsApp...');
      } catch (error) {
        console.error('WhatsApp share error:', error);
        toast.error('Failed to share via WhatsApp');
      } finally {
        setIsSharing(false);
      }
    },
    [link, code, trackShareMutation]
  );

  // Share via native API (mobile)
  const shareViaNativeAPI = useCallback(
    async (shareData: Partial<ShareData>) => {
      if (!link || !code) {
        toast.error('Referral link not available');
        return false;
      }

      const shareText = `Join NewCondo using my referral code ${code} and get ₦${shareData.referredAmount} credit!`;

      const success = await shareViaNative({
        title: 'Join NewCondo',
        text: shareText,
        url: link.url,
      });

      if (success) {
        // Track the share
        await trackShareMutation.mutateAsync({
          referralCode: code,
          channel: 'native',
        });
        toast.success('Shared successfully!');
      }

      return success;
    },
    [link, code, trackShareMutation]
  );

  // Check if native share is available
  const canShareNatively = typeof navigator !== 'undefined' && !!navigator.share;

  return {
    isSharing,
    shareViaChannel,
    shareViaWhatsAppWithPhone,
    shareViaNativeAPI,
    canShareNatively,
  };
}

export function useShareTracking() {
  // Track share event
  const trackShare = useMutation({
    mutationFn: trackingApi.trackShare,
  });

  // Track click event
  const trackClick = useMutation({
    mutationFn: trackingApi.trackClick,
  });

  return {
    trackShare: trackShare.mutateAsync,
    trackClick: trackClick.mutateAsync,
    isTracking: trackShare.isPending  || trackClick.isPending ,
  };
}