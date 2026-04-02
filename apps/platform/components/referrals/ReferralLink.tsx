// apps/platform/components/referrals/ReferralLink.tsx

'use client';

import { useState } from 'react';
import { Copy, Check, Share2, QrCode } from 'lucide-react';
import { Button } from '@newcondo/ui/components/button';
import { Card, CardContent } from '@newcondo/ui/components/card';
import { Input } from '@newcondo/ui/components/input';
import { useReferralLink } from '@/hooks/useReferralLink';
import { useShareReferral } from '@/hooks/useShareReferral';
import { Skeleton } from '@newcondo/ui/components/skeleton';

export function ReferralLink() {
  const { link, url, isLoading, copyLink } = useReferralLink();
  const { canShareNatively, shareViaNativeAPI } = useShareReferral();
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    shareViaNativeAPI({
      referrerName: 'User',
      referrerRole: 'USER',
      referredAmount: 5000,
      referrerAmount: 5000,
      rewardType: 'service credit',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!link) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Referral link not available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Your Referral Link
          </label>
          <div className="flex gap-2">
            <Input
              value={url}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              disabled={copied}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            {canShareNatively && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowQR(!showQR)}
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showQR && (
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`}
              alt="QR Code"
              className="w-48 h-48"
            />
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Share this link with friends to earn rewards when they join NewCondo
        </p>
      </CardContent>
    </Card>
  );
}