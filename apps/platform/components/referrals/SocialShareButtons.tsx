// apps/platform/components/referrals/SocialShareButtons.tsx

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useShareReferral } from '@/hooks/useShareReferral';
import { useReferralLink } from '@/hooks/useReferralLink';
import { SHARE_CHANNEL_CONFIG } from '@/lib/constants/shareMessages';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface SocialShareButtonsProps {
  referrerRole?: string;
  referredAmount?: number;
  referrerAmount?: number;
}

export function SocialShareButtons({
  referrerRole = 'USER',
  referredAmount = 5000,
  referrerAmount = 5000,
}: SocialShareButtonsProps) {
  const { data: session } = useSession();
  const { code } = useReferralLink();
  const { shareViaChannel, isSharing } = useShareReferral();

  const handleShare = (channel: string) => {
    shareViaChannel(
      channel,
      {
        referrerName: session?.user?.name || 'NewCondo User',
        referrerRole,
        referredAmount,
        referrerAmount,
        rewardType: 'service credit',
      }
    );
  };

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, string> = {
      whatsapp: '📱',
      email: '📧',
      sms: '💬',
      facebook: '👍',
      twitter: '🐦',
      linkedin: '💼',
      copy: '🔗',
    };
    return icons[channel] || '📤';
  };

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      whatsapp: 'hover:bg-green-50 hover:border-green-300',
      email: 'hover:bg-red-50 hover:border-red-300',
      sms: 'hover:bg-blue-50 hover:border-blue-300',
      facebook: 'hover:bg-blue-50 hover:border-blue-400',
      twitter: 'hover:bg-sky-50 hover:border-sky-300',
      linkedin: 'hover:bg-blue-50 hover:border-blue-500',
      copy: 'hover:bg-gray-50 hover:border-gray-300',
    };
    return colors[channel] || 'hover:bg-gray-50';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Your Referral</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SHARE_CHANNEL_CONFIG.filter(c => c.isAvailable).map((channel) => (
            <Button
              key={channel.id}
              variant="outline"
              className={`h-auto flex-col gap-2 py-4 ${getChannelColor(channel.id)}`}
              onClick={() => handleShare(channel.id)}
              disabled={isSharing || !code}
            >
              {isSharing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="text-2xl">{getChannelIcon(channel.id)}</span>
              )}
              <span className="text-xs font-medium">{channel.name}</span>
            </Button>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground mt-4">
          Choose your preferred method to share your referral link
        </p>
      </CardContent>
    </Card>
  );
}