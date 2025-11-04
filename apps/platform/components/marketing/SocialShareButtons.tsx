// apps/platform/components/marketing/SocialShareButtons.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Facebook, Twitter, Linkedin, Mail, MessageCircle, Copy } from 'lucide-react';

interface SocialShareButtonsProps {
  propertyTitle: string;
  propertyDescription: string;
  shareableLink: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function SocialShareButtons({
  propertyTitle,
  propertyDescription,
  shareableLink,
  variant = 'outline',
  size = 'sm',
}: SocialShareButtonsProps) {
  const { toast } = useToast();

  const shareText = `Check out this property: ${propertyTitle}`;
  const encodedUrl = encodeURIComponent(shareableLink);
  const encodedText = encodeURIComponent(shareText);
  const encodedDescription = encodeURIComponent(propertyDescription);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedText}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    const url = shareLinks[platform];
    
    if (platform === 'email') {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'width=600,height=400');
    }

    toast({
      title: 'Opening share dialog',
      description: `Sharing on ${platform}`,
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      toast({
        title: 'Link copied',
        description: 'Property link copied to clipboard',
      });
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: 'Copy failed',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={variant}
        size={size}
        onClick={() => handleShare('facebook')}
        className="gap-2"
      >
        <Facebook className="h-4 w-4" />
        <span className={size === 'icon' ? 'sr-only' : ''}>Facebook</span>
      </Button>

      <Button
        variant={variant}
        size={size}
        onClick={() => handleShare('twitter')}
        className="gap-2"
      >
        <Twitter className="h-4 w-4" />
        <span className={size === 'icon' ? 'sr-only' : ''}>Twitter</span>
      </Button>

      <Button
        variant={variant}
        size={size}
        onClick={() => handleShare('linkedin')}
        className="gap-2"
      >
        <Linkedin className="h-4 w-4" />
        <span className={size === 'icon' ? 'sr-only' : ''}>LinkedIn</span>
      </Button>

      <Button
        variant={variant}
        size={size}
        onClick={() => handleShare('whatsapp')}
        className="gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        <span className={size === 'icon' ? 'sr-only' : ''}>WhatsApp</span>
      </Button>

      <Button
        variant={variant}
        size={size}
        onClick={() => handleShare('email')}
        className="gap-2"
      >
        <Mail className="h-4 w-4" />
        <span className={size === 'icon' ? 'sr-only' : ''}>Email</span>
      </Button>

      <Button
        variant={variant}
        size={size}
        onClick={handleCopyLink}
        className="gap-2"
      >
        <Copy className="h-4 w-4" />
        <span className={size === 'icon' ? 'sr-only' : ''}>Copy Link</span>
      </Button>
    </div>
  );
}