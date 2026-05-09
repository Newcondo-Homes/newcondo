"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@newcondo/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@newcondo/ui/components/tooltip";
import { cn } from "@newcondo/ui";
import { ShareModal } from "./ShareModal";
import { toast } from "@newcondo/ui/";

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
  // const [copied, setCopied] = useState(false);

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
        toast.error("Failed to generate link", {
          description: "Please try again later.",
        });
        throw error;
      } finally {
        setIsGenerating(false);
      }
    }

    // Fallback to direct property URL
    return `${window.location.origin}/properties/${propertyId}`;
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
                <Share2 className="h-4 w-4" />
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
        <Share2 className="h-4 w-4" />
        {showLabel && <span>Share</span>}
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