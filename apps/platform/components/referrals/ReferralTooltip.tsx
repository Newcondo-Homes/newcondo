// apps/platform/components/referrals/ReferralTooltip.tsx
"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@newcondo/ui/components/tooltip";
import { HelpCircle, Info, Gift, Users, TrendingUp } from "lucide-react";
import { ReactNode } from "react";

interface ReferralTooltipProps {
  type:
    | "referralCode"
    | "shareLink"
    | "rewards"
    | "qualification"
    | "tracking"
    | "expiration"
    | "custom";
  children?: ReactNode;
  content?: string;
  icon?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

const tooltipContent = {
  referralCode: {
    icon: <HelpCircle className="h-4 w-4" />,
    title: "Your Referral Code",
    description:
      "This unique code identifies your referrals. Share it with friends so they can enter it during signup.",
  },
  shareLink: {
    icon: <Info className="h-4 w-4" />,
    title: "Share Link",
    description:
      "This link automatically applies your referral code. Anyone who signs up through this link will be credited to you.",
  },
  rewards: {
    icon: <Gift className="h-4 w-4" />,
    title: "How Rewards Work",
    description:
      "You earn rewards when your referrals complete their first qualifying transaction. Rewards are credited as service credits to your account.",
  },
  qualification: {
    icon: <Users className="h-4 w-4" />,
    title: "Qualification Criteria",
    description:
      "A referral qualifies when the new user signs up, verifies their account, and completes their first paid transaction (subscription or rent payment).",
  },
  tracking: {
    icon: <TrendingUp className="h-4 w-4" />,
    title: "Tracking Your Referrals",
    description:
      "Track all your referrals in real-time. See who clicked your link, who signed up, and who qualified for rewards.",
  },
  expiration: {
    icon: <Info className="h-4 w-4" />,
    title: "Reward Expiration",
    description:
      "Service credit rewards expire after 12 months if unused. Use them for subscriptions, rent payments, or other platform services.",
  },
};

export function ReferralTooltip({
  type,
  children,
  content,
  icon,
  side = "top",
}: ReferralTooltipProps) {
  const tooltipInfo = type !== "custom" ? tooltipContent[type] : null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="More information"
            >
              {icon || tooltipInfo?.icon || <HelpCircle className="h-4 w-4" />}
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs space-y-2 p-4"
          sideOffset={5}
        >
          {type !== "custom" && tooltipInfo ? (
            <>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-1.5">
                  {tooltipInfo.icon}
                </div>
                <p className="font-semibold">{tooltipInfo.title}</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tooltipInfo.description}
              </p>
            </>
          ) : (
            <p className="text-sm">{content}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Specialized tooltip components for common use cases
export function ReferralCodeTooltip() {
  return <ReferralTooltip type="referralCode" />;
}

export function ShareLinkTooltip() {
  return <ReferralTooltip type="shareLink" />;
}

export function RewardsTooltip() {
  return <ReferralTooltip type="rewards" />;
}

export function QualificationTooltip() {
  return <ReferralTooltip type="qualification" />;
}

export function TrackingTooltip() {
  return <ReferralTooltip type="tracking" />;
}

export function ExpirationTooltip() {
  return <ReferralTooltip type="expiration" />;
}

// Inline info text with tooltip
export function ReferralInfoText({
  label,
  tooltipType,
}: {
  label: string;
  tooltipType: ReferralTooltipProps["type"];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <ReferralTooltip type={tooltipType} />
    </div>
  );
}