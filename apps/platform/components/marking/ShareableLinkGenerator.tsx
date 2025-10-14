import React, { useState, useEffect } from 'react';
import { Button } from '@newcondo/ui';
import {
  Copy,
  Check,
  Share2,
  QrCode,
  Link as LinkIcon,
  Loader,
} from 'lucide-react';

interface ShareableLinkGeneratorProps {
  propertyId: string;
  propertyTitle: string;
  contactPersonName: string;
  onGenerateLink: () => Promise<string>;
  isLoading?: boolean;
}

interface GeneratedLink {
  url: string;
  expiresAt: Date;
  token: string;
}

export const ShareableLinkGenerator: React.FC<ShareableLinkGeneratorProps> = ({
  propertyId,
  propertyTitle,
  contactPersonName,
  onGenerateLink,
  isLoading = false,
}) => {
  const [generatedLink, setGeneratedLink] = useState<GeneratedLink | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Generate the shareable link
  const handleGenerateLink = async () => {
    try {
      setIsGenerating(true);
      const linkUrl = await onGenerateLink();

      // Calculate expiry (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      setGeneratedLink({
        url: linkUrl,
        expiresAt,
        token: extractTokenFromUrl(linkUrl),
      });
    } catch (error) {
      console.error('Failed to generate link:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Extract token from URL for display
  const extractTokenFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('token') || '';
    } catch {
      return '';
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    if (generatedLink?.url) {
      await navigator.clipboard.writeText(generatedLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Share via different platforms
  const handleShare = (platform: 'whatsapp' | 'sms' | 'email') => {
    if (!generatedLink?.url) return;

    const message = `Hi ${contactPersonName}, I need you to mark my property "${propertyTitle}" on Newcondo. Please use this link to complete the marking: ${generatedLink.url}`;

    const encodedMessage = encodeURIComponent(message);

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
        break;
      case 'sms':
        window.open(`sms:?body=${encodedMessage}`, '_blank');
        break;
      case 'email':
        window.open(
          `mailto:?subject=Property Marking Request&body=${encodedMessage}`,
          '_blank'
        );
        break;
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Share Marking Link
        </h3>

        {/* Info Section */}
        <div className="mb-6 space-y-2 rounded-lg bg-green-50 p-4">
          <div className="flex gap-3">
            <LinkIcon className="h-5 w-5 flex-shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Send to Someone You Know
              </p>
              <p className="text-sm text-green-800">
                This link allows them to mark your property remotely. They'll need
                access to the property location.
              </p>
            </div>
          </div>
        </div>

        {/* Link Generation */}
        {!generatedLink ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Generate a unique shareable link that you can send to someone you
              trust to mark your property.
            </p>
            <Button
              onClick={handleGenerateLink}
              disabled={isLoading || isGenerating}
              className="w-full"
              size="lg"
              variant="outline"
            >
              {isGenerating ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Generate Shareable Link
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Generated Link Display */}
            <div className="rounded-lg bg-gray-50 p-4">
              <label className="block text-sm font-medium text-gray-700">
                Your Marking Link
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={generatedLink.url}
                  readOnly
                  className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 focus:outline-none"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                  className="px-3"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Expiry Info */}
              <p className="mt-2 text-xs text-gray-500">
                Link expires on{' '}
                {generatedLink.expiresAt.toLocaleDateString('en-NG', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Share Options */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Share via:</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => handleShare('whatsapp')}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                >
                  WhatsApp
                </Button>
                <Button
                  onClick={() => handleShare('sms')}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                >
                  SMS
                </Button>
                <Button
                  onClick={() => handleShare('email')}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                >
                  Email
                </Button>
              </div>
            </div>

            {/* QR Code Option */}
            <div className="border-t border-gray-200 pt-4">
              <Button
                onClick={() => setShowQR(!showQR)}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <QrCode className="mr-2 h-4 w-4" />
                {showQR ? 'Hide' : 'Show'} QR Code
              </Button>
              {showQR && (
                <div className="mt-4 flex justify-center">
                  <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
                    <p className="text-xs text-gray-500 text-center mb-2">
                      Scan to mark property
                    </p>
                    {/* Placeholder for QR code - would use a library like qr-code in production */}
                    <div className="h-48 w-48 bg-gray-100 flex items-center justify-center rounded">
                      <span className="text-sm text-gray-400">
                        QR Code Here
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reset */}
            <Button
              onClick={() => setGeneratedLink(null)}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Generate New Link
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="font-semibold text-gray-900">Instructions:</h4>
          <ol className="mt-3 space-y-2 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="font-semibold text-gray-900">1.</span>
              <span>
                Share this link with someone who can physically access your
                property
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-gray-900">2.</span>
              <span>They will use the link to mark your property boundaries</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-gray-900">3.</span>
              <span>
                They will upload photos of key building parts for verification
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-gray-900">4.</span>
              <span>
                You'll receive a notification and have 2-3 days to confirm the
                marking
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};