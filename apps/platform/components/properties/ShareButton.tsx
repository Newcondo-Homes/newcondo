"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@newcondo/ui/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@newcondo/ui/components/ui/tooltip";
import { cn } from "@/lib/utils/helpers";
import { ShareModal } from "./ShareModal";
import { toast } from "@newcondo/ui/hooks/use-toast";

interface ShareButtonProps {
  propertyId: string;
  propertyTitle: string;
  shareableLink?: string | null;
  onGenerateLink?: () => Promise<string>;
  variant?: "default" | "outline" | "ghost" | "icon";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function ShareButton({
  propertyId,
  propertyTitle,
  shareableLink,
  onGenerateLink,
  variant = "outline",
  size = "default",
  showLabel = true,
  className,
}: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleQuickShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If Web Share API is available and not on desktop
    if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        const link = shareableLink || await generateShareLink();
        await navigator.share({
          title: propertyTitle,
          text: `Check out this property: ${propertyTitle}`,
          url: link,
        });
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          // User canceled share, ignore
          setIsModalOpen(true);
        }
      }
    } else {
      setIsModalOpen(true);
    }
  };

  const generateShareLink = async (): Promise<string> => {
    if (shareableLink) return shareableLink;

    if (onGenerateLink) {
      setIsGenerating(true);
      try {
        const link = await onGenerateLink();
        return link;
      } catch (error) {
        toast({
          title: "Failed to generate link",
          description: "Please try again later.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsGenerating(false);
      }
    }

    // Fallback to direct property URL
    return `${window.location.origin}/properties/${propertyId}`;
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const link = await generateShareLink();
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with anyone.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy link",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Icon-only variant
  if (variant === "icon" || size === "icon") {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleQuickShare}
                disabled={isGenerating}
                className={cn("h-9 w-9", className)}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share property</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ShareModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          propertyId={propertyId}
          propertyTitle={propertyTitle}
          shareableLink={shareableLink}
          onGenerateLink={onGenerateLink}
        />
      </>
    );
  }

  // Button with label
  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleQuickShare}
        disabled={isGenerating}
        className={cn("gap-2", className)}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            {showLabel && <span>Copied!</span>}
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            {showLabel && <span>Share</span>}
          </>
        )}
      </Button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        propertyId={propertyId}
        propertyTitle={propertyTitle}
        shareableLink={shareableLink}
        onGenerateLink={onGenerateLink}
      />
    </>
  );
}

// Compact variant for property cards
export function CompactShareButton(
  props: Omit<ShareButtonProps, "variant" | "size" | "showLabel">
) {
  return (
    <ShareButton
      {...props}
      variant="icon"
      size="icon"
      showLabel={false}
    />
  );
}