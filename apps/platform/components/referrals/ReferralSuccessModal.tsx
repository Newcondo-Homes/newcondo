// apps/platform/components/referrals/ReferralSuccessModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@newcondo/ui/components/dialog";
import { Button } from "@newcondo/ui/components/button";
import { CheckCircle2, Gift, Share2, Copy, X } from "lucide-react";
import { useState } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/useWindowSize";

interface ReferralSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "link_copied" | "referral_sent" | "referral_qualified" | "reward_earned";
  data?: {
    referralCode?: string;
    shareLink?: string;
    referredName?: string;
    rewardAmount?: number;
    rewardType?: string;
  };
}

export function ReferralSuccessModal({
  isOpen,
  onClose,
  type,
  data,
}: ReferralSuccessModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  const handleOpen = () => {
    if (type === "reward_earned" || type === "referral_qualified") {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  const getModalContent = () => {
    switch (type) {
      case "link_copied":
        return {
          icon: <Copy className="h-12 w-12 text-primary" />,
          title: "Link Copied!",
          description: "Your referral link has been copied to clipboard. Share it with friends to start earning rewards!",
          actions: [
            {
              label: "Share on WhatsApp",
              icon: <Share2 className="h-4 w-4" />,
              onClick: () => {
                const message = `Join NewCondo using my referral link and get ₦3,000 credit! ${data?.shareLink}`;
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(message)}`,
                  "_blank"
                );
              },
            },
          ],
        };

      case "referral_sent":
        return {
          icon: <Share2 className="h-12 w-12 text-blue-600" />,
          title: "Referral Sent!",
          description: "Your referral invitation has been sent successfully. You'll be notified when they sign up!",
          actions: [],
        };

      case "referral_qualified":
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
          title: "Referral Qualified!",
          description: `${data?.referredName || "Your referral"} has completed their first transaction. You're one step closer to earning your reward!`,
          actions: [
            {
              label: "View Referral Dashboard",
              variant: "default" as const,
              onClick: () => {
                window.location.href = "/dashboard/referrals";
              },
            },
          ],
        };

      case "reward_earned":
        return {
          icon: <Gift className="h-12 w-12 text-purple-600" />,
          title: "Reward Earned!",
          description: `Congratulations! You've earned ₦${data?.rewardAmount?.toLocaleString() || "0"} in ${data?.rewardType || "service credits"}. Your reward has been added to your account.`,
          actions: [
            {
              label: "View My Rewards",
              variant: "default" as const,
              onClick: () => {
                window.location.href = "/dashboard/referrals?tab=rewards";
              },
            },
            {
              label: "Refer More Friends",
              variant: "outline" as const,
              onClick: onClose,
            },
          ],
        };

      default:
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
          title: "Success!",
          description: "Action completed successfully.",
          actions: [],
        };
    }
  };

  const content = getModalContent();

  return (
    <>
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="sm:max-w-md"
          onOpenAutoFocus={handleOpen}
        >
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="absolute right-4 top-4 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>

          <DialogHeader className="space-y-4 text-center">
            <div className="mx-auto rounded-full bg-primary/10 p-4 w-fit">
              {content.icon}
            </div>
            <DialogTitle className="text-2xl">{content.title}</DialogTitle>
            <DialogDescription className="text-base">
              {content.description}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-6">
            {content.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "default"}
                onClick={action.onClick}
                className="w-full"
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </Button>
            ))}
            {content.actions.length === 0 && (
              <Button onClick={onClose} className="w-full">
                Got it!
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}