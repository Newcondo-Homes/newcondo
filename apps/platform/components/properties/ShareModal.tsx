"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@newcondo/ui/components/dialog";
import { Button } from "@newcondo/ui/components/button";
import { Input } from "@newcondo/ui/components/input";
import { Label } from "@newcondo/ui/components/label";
import { Separator } from "@newcondo/ui/components/separator";
import {
  Copy,
  Check,
  Mail,
  MessageCircle,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  // ExternalLink,
} from "lucide-react";
import { toast } from "@newcondo/ui/";
import { cn } from "@newcondo/ui";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  shareableLink?: string | null;
  onGenerateLink?: () => Promise<string>;
}

export function ShareModal({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  shareableLink,
  onGenerateLink,
}: ShareModalProps) {
  const [link, setLink] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const initializeLink = useCallback(async () => {
    if (shareableLink) {
      setLink(shareableLink);
      return;
    }

    if (onGenerateLink) {
      setIsGenerating(true);
      try {
        const generatedLink = await onGenerateLink();
        setLink(generatedLink);
      } catch {
        setLink(`${window.location.origin}/properties/${propertyId}`);
        toast.success("Using default link", {
          description: "Could not generate custom share link.",
        });
      } finally {
        setIsGenerating(false);
      }
    } else {
      setLink(`${window.location.origin}/properties/${propertyId}`);
    }
  }, [shareableLink, onGenerateLink, propertyId]);

  useEffect(() => {
    if (isOpen) {
      initializeLink();
    }
  }, [isOpen, initializeLink]); // replace shareableLink with initializeLink

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied!", {
        description: "You can now share this link anywhere.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy", {
        description: "Please copy the link manually.",
      });
    }
  };

  const shareVia = {
    email: () => {
      const subject = encodeURIComponent(`Check out: ${propertyTitle}`);
      const body = encodeURIComponent(
        `I found this property that might interest you:\n\n${propertyTitle}\n\n${link}`
      );
      window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    },
    whatsapp: () => {
      const text = encodeURIComponent(
        `Check out this property: ${propertyTitle}\n${link}`
      );
      window.open(`https://wa.me/?text=${text}`, "_blank");
    },
    facebook: () => {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
        "_blank",
        "width=600,height=400"
      );
    },
    twitter: () => {
      const text = encodeURIComponent(`Check out: ${propertyTitle}`);
      window.open(
        `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(link)}`,
        "_blank",
        "width=600,height=400"
      );
    },
    linkedin: () => {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
        "_blank",
        "width=600,height=400"
      );
    },
  };

  const shareOptions = [
    {
      name: "Email",
      icon: Mail,
      action: shareVia.email,
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      action: shareVia.whatsapp,
      color: "text-green-600",
      bgColor: "bg-green-50 hover:bg-green-100",
    },
    {
      name: "Facebook",
      icon: Facebook,
      action: shareVia.facebook,
      color: "text-blue-700",
      bgColor: "bg-blue-50 hover:bg-blue-100",
    },
    {
      name: "Twitter",
      icon: Twitter,
      action: shareVia.twitter,
      color: "text-sky-500",
      bgColor: "bg-sky-50 hover:bg-sky-100",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      action: shareVia.linkedin,
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Property
          </DialogTitle>
          <DialogDescription>
            Share this property with others via link or social media
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Copy Link Section */}
          <div className="space-y-2">
            <Label htmlFor="share-link">Property Link</Label>
            <div className="flex gap-2">
              <Input
                id="share-link"
                value={isGenerating ? "Generating link..." : link}
                readOnly
                className="flex-1"
                disabled={isGenerating}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleCopyLink}
                disabled={isGenerating || !link}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the property details
            </p>
          </div>

          <Separator />

          {/* Share Options */}
          <div className="space-y-3">
            <Label>Share via</Label>
            <div className="grid grid-cols-3 gap-3">
              {shareOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.name}
                    onClick={option.action}
                    disabled={isGenerating || !link}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-colors",
                      option.bgColor,
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <Icon className={cn("h-6 w-6", option.color)} />
                    <span className="text-xs font-medium">{option.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Property Info */}
          <div className="rounded-lg bg-muted p-3 space-y-1">
            <p className="text-sm font-medium">Sharing:</p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {propertyTitle}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleCopyLink} disabled={isGenerating || !link}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// QR Code variant (optional enhancement)
export function ShareModalWithQR(props: ShareModalProps) {
  // Implementation would include QR code generation
  // using a library like qrcode.react
  return <ShareModal {...props} />;
}