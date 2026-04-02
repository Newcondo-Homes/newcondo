'use client';

import React, { useState } from 'react';
import { Share2, Copy, MessageCircle, Mail, Facebook, Twitter, Link2 } from 'lucide-react';
import { Button } from '@newcondo/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@newcondo/ui/components/dialog';
import { Input } from '@newcondo/ui/components/input';
import { toast } from '@newcondo/ui/';

interface PropertyShareProps {
  propertyId: string;
  propertyTitle: string;
  propertyPrice: string;
  propertyImage?: string;
  className?: string;
  variant?: 'button' | 'icon';
}

interface ShareOption {
  name: string;
  icon: React.ReactNode;
  action: (url: string, title: string) => void;
  color: string;
}

const PropertyShare: React.FC<PropertyShareProps> = ({
  propertyId,
  propertyTitle,
  propertyPrice,
  propertyImage,
  className = '',
  variant = 'button'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate shareable URL
  const shareUrl = `${window.location.origin}/properties/${propertyId}`;
  const shareText = `Check out this amazing property: ${propertyTitle} - ${propertyPrice}`;

  // Copy to clipboard function
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied!",{
        description: "Property link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy", {
        description: "Please copy the link manually",
      });
    }
  };

  // Share options configuration
  const shareOptions: ShareOption[] = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      action: (url: string, text: string) => {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank');
      },
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'Email',
      icon: <Mail className="w-5 h-5" />,
      action: (url: string, text: string) => {
        const subject = encodeURIComponent(`Property Listing: ${propertyTitle}`);
        const body = encodeURIComponent(`${text}\n\nView property: ${url}`);
        window.open(`mailto:?subject=${subject}&body=${body}`);
      },
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      action: (url: string) => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      },
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      action: (url: string, text: string) => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
      },
      color: 'bg-sky-500 hover:bg-sky-600'
    }
  ];

  // Use native Web Share API if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: propertyTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error occurred, fall back to dialog
        if ((err as Error).name !== 'AbortError') {
          setIsOpen(true);
        }
      }
    } else {
      setIsOpen(true);
    }
  };

  const TriggerButton = () => {
    if (variant === 'icon') {
      return (
        <Button
          variant="ghost"
          size="sm"
          className={`p-2 ${className}`}
          onClick={handleNativeShare}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        className={`flex items-center gap-2 ${className}`}
        onClick={handleNativeShare}
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div style={{ display: 'none' }} />
      </DialogTrigger>
      
      <TriggerButton />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Property</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Property Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {propertyImage && (
              <img
                src={propertyImage}
                alt={propertyTitle}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h4 className="font-medium text-sm line-clamp-1">{propertyTitle}</h4>
              <p className="text-sm text-gray-600">{propertyPrice}</p>
            </div>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share Link</label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                type="button"
                variant={copied ? "default" : "outline"}
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Copy className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share via</label>
            <div className="grid grid-cols-2 gap-2">
              {shareOptions.map((option) => (
                <Button
                  key={option.name}
                  variant="outline"
                  className={`flex items-center gap-2 justify-start text-white ${option.color}`}
                  onClick={() => {
                    option.action(shareUrl, shareText);
                    setIsOpen(false);
                  }}
                >
                  {option.icon}
                  {option.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyShare;