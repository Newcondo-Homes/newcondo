// apps/platform/components/referrals/ShareModal.tsx

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@newcondo/ui/components/dialog';
import { Button } from '@newcondo/ui/components/button';
import { Input } from '@newcondo/ui/components/input';
import { Textarea } from '@newcondo/ui/components/textarea';
import { Label } from '@newcondo/ui/components/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui/components/tabs';
import { useReferralLink } from '@/hooks/useReferralLink';
import { useShareReferral } from '@/hooks/useShareReferral';
import { useReferralStore } from '@/store/referralStore';
import { SHARE_CHANNEL_CONFIG } from '@/lib/constants/shareMessages';
import { CopyLinkButton } from './CopyLinkButton';
import { Loader2, Mail, MessageSquare, Phone, Share2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function ShareModal() {
  const { data: session } = useSession();
  const { isShareModalOpen, toggleShareModal } = useReferralStore();
  const { link, code } = useReferralLink();
  const { shareViaChannel, isSharing } = useShareReferral();
  
  const [activeTab, setActiveTab] = useState('social');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const handleSocialShare = (channel: string) => {
    shareViaChannel(
      channel,
      {
        referrerName: session?.user?.name || 'NewCondo User',
        referrerRole: 'USER',
        referredAmount: 5000,
        referrerAmount: 5000,
        rewardType: 'service credit',
      },
      customMessage || undefined
    );
  };

  const handleEmailShare = () => {
    if (!email) return;
    shareViaChannel(
      'email',
      {
        referrerName: session?.user?.name || 'NewCondo User',
        referrerRole: 'USER',
        referredAmount: 5000,
        referrerAmount: 5000,
        rewardType: 'service credit',
      },
      customMessage || undefined
    );
    setEmail('');
    setCustomMessage('');
  };

  const handleSMSShare = () => {
    if (!phone) return;
    shareViaChannel(
      'sms',
      {
        referrerName: session?.user?.name || 'NewCondo User',
        referrerRole: 'USER',
        referredAmount: 5000,
        referrerAmount: 5000,
        rewardType: 'service credit',
      },
      customMessage || undefined
    );
    setPhone('');
    setCustomMessage('');
  };

  const socialChannels = SHARE_CHANNEL_CONFIG.filter(
    c => c.isAvailable && !['email', 'sms', 'copy'].includes(c.id)
  );

  return (
    <Dialog open={isShareModalOpen} onOpenChange={toggleShareModal}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Your Referral</DialogTitle>
          <DialogDescription>
            Invite friends via your preferred method and earn rewards
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="social">
              <Share2 className="h-4 w-4 mr-2" />
              Social
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms">
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS
            </TabsTrigger>
          </TabsList>

          {/* Social Media Sharing */}
          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Your Referral Link</Label>
              <div className="flex gap-2">
                <Input value={link?.url || ''} readOnly className="font-mono text-sm" />
                <CopyLinkButton text={link?.url || ''} size="default" />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Custom Message (Optional)</Label>
              <Textarea
                placeholder="Add a personal touch to your invitation..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Share Via</Label>
              <div className="grid grid-cols-2 gap-3">
                {socialChannels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant="outline"
                    onClick={() => handleSocialShare(channel.id)}
                    disabled={isSharing || !code}
                    className="h-auto flex-col gap-2 py-4"
                  >
                    {isSharing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <span className="text-2xl">{channel.icon}</span>
                    )}
                    <span className="text-xs font-medium">{channel.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* QR Code Section */}
            <div className="border-t pt-4">
              <Label className="mb-3 block">QR Code</Label>
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link?.url || '')}`}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Share this QR code for easy scanning
              </p>
            </div>
          </TabsContent>

          {/* Email Sharing */}
          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label>Custom Message (Optional)</Label>
              <Textarea
                placeholder="Add a personal message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              onClick={handleEmailShare}
              disabled={!email || isSharing}
              className="w-full"
            >
              {isSharing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email Invitation
                </>
              )}
            </Button>
          </TabsContent>

          {/* SMS Sharing */}
          <TabsContent value="sms" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Phone Number</Label>
              <Input
                type="tel"
                placeholder="080XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Nigerian phone number (e.g., 08012345678)
              </p>
            </div>

            <div className="space-y-3">
              <Label>Custom Message (Optional)</Label>
              <Textarea
                placeholder="Add a personal message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground text-right">
                {customMessage.length}/160 characters
              </p>
            </div>

            <Button
              onClick={handleSMSShare}
              disabled={!phone || isSharing}
              className="w-full"
            >
              {isSharing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send SMS Invitation
                </>
              )}
            </Button>

            <div className="flex items-center gap-2">
              <div className="flex-1 border-t" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="flex-1 border-t" />
            </div>

            <Button
              variant="outline"
              onClick={() => handleSocialShare('whatsapp')}
              disabled={isSharing}
              className="w-full bg-green-50 hover:bg-green-100"
            >
              <Phone className="mr-2 h-4 w-4" />
              Open WhatsApp Instead
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}