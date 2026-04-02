"use client";

import React, { useState } from 'react';
import { Button } from '@newcondo/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { Input } from '@newcondo/ui';
import { Alert, AlertDescription } from '@newcondo/ui';
import { Check, Copy, ExternalLink, Share2 } from 'lucide-react';
import { toast } from '@newcondo/ui';

interface ShareableLinkCopyProps {
  link: string;
  title?: string;
  description?: string;
  propertyId?: string;
  markingJobId?: string;
  showQRCode?: boolean;
  onShare?: () => void;
}

export const ShareableLinkCopy: React.FC<ShareableLinkCopyProps> = ({
  link,
  title = 'Shareable Marking Link',
  description = 'Share this link with someone to mark your property remotely',
  propertyId,
  markingJobId,
  showQRCode = false,
  onShare,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link Copied!',{
        description: 'The shareable link has been copied to your clipboard.',
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Copy Failed',{
        description: 'Unable to copy link. Please try again.',
      });
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Property Marking Request',
          text: 'Please help me mark my property on Newcondo',
          url: link,
        });
        onShare?.();
      } else {
        // Fallback for browsers that don't support Web Share API
        await handleCopyLink();
      }
    } catch (error) {
      // User cancelled share or error occurred
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleOpenLink = () => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Link Display and Copy */}
        <div className="flex gap-2">
          <Input
            value={link}
            readOnly
            className="font-mono text-sm"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyLink}
            className="flex-shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleShare} disabled={isSharing} className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Share Link
          </Button>
          <Button onClick={handleOpenLink} variant="outline" className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Link
          </Button>
        </div>

        {/* Instructions */}
        <Alert>
          <AlertDescription>
            <p className="font-semibold mb-2">How to use this link:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Share this link with the person who will mark your property</li>
              <li>They should open the link when they arrive at the property</li>
              <li>The link will guide them through the marking process</li>
              <li>You'll receive a notification when marking is complete</li>
              <li>You must verify the marking within 2-3 days</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* QR Code Section (Optional) */}
        {showQRCode && (
          <div className="border rounded-lg p-4 flex flex-col items-center">
            <p className="text-sm text-muted-foreground mb-3">
              Or scan this QR code:
            </p>
            <div className="w-48 h-48 bg-muted flex items-center justify-center rounded-md">
              {/* QR Code would be generated here using a QR library */}
              <p className="text-xs text-center text-muted-foreground px-4">
                QR Code<br />
                (Scan to open link)
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              The person marking can scan this with their phone camera
            </p>
          </div>
        )}

        {/* Additional Info */}
        {(propertyId || markingJobId) && (
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            {propertyId && (
              <p>
                <span className="font-semibold">Property ID:</span> {propertyId}
              </p>
            )}
            {markingJobId && (
              <p>
                <span className="font-semibold">Marking Job ID:</span> {markingJobId}
              </p>
            )}
          </div>
        )}

        {/* Security Notice */}
        <Alert variant="destructive" className="border-amber-500 bg-amber-50">
          <AlertDescription className="text-amber-900">
            <p className="font-semibold mb-1">⚠️ Security Notice:</p>
            <p className="text-sm">
              Only share this link with trusted individuals. The person with this link
              will be able to mark your property and view its location details.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};