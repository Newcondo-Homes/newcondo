// apps/platform/components/referrals/RewardExpirationAlert.tsx
"use client";

import { Alert, AlertDescription, AlertTitle } from "@newcondo/ui/components/alert";
import { Button } from "@newcondo/ui/components/button";
import { Card } from "@newcondo/ui/components/card";
import { AlertCircle, Clock, Gift, X } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ExpiringReward {
  id: string;
  amount: number;
  rewardType: string;
  expiresAt: Date;
  daysUntilExpiration: number;
}

interface RewardExpirationAlertProps {
  rewards?: ExpiringReward[];
  onDismiss?: (rewardId: string) => void;
  variant?: "alert" | "card" | "inline";
  showDismiss?: boolean;
}

export function RewardExpirationAlert({
  rewards = [],
  onDismiss,
  variant = "alert",
  showDismiss = true,
}: RewardExpirationAlertProps) {
  const [dismissedRewards, setDismissedRewards] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    // Load dismissed rewards from localStorage
    const dismissed = localStorage.getItem("dismissedExpiringRewards");
    if (dismissed) {
      setDismissedRewards(new Set(JSON.parse(dismissed)));
    }
  }, []);

  const handleDismiss = (rewardId: string) => {
    const newDismissed = new Set(dismissedRewards);
    newDismissed.add(rewardId);
    setDismissedRewards(newDismissed);
    localStorage.setItem(
      "dismissedExpiringRewards",
      JSON.stringify(Array.from(newDismissed))
    );
    onDismiss?.(rewardId);
  };

  // Filter out dismissed rewards and expired ones
  const activeRewards = rewards.filter(
    (reward) =>
      !dismissedRewards.has(reward.id) &&
      new Date(reward.expiresAt) > new Date()
  );

  // Sort by expiration date (soonest first)
  const sortedRewards = activeRewards.sort(
    (a, b) =>
      new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
  );

  if (sortedRewards.length === 0) return null;

  // Calculate urgency level
  const getUrgencyLevel = (daysUntilExpiration: number) => {
    if (daysUntilExpiration <= 3) return "critical";
    if (daysUntilExpiration <= 7) return "high";
    if (daysUntilExpiration <= 30) return "medium";
    return "low";
  };

  const mostUrgentReward = sortedRewards[0];
  // const urgencyLevel = getUrgencyLevel(mostUrgentReward.daysUntilExpiration);

  // Alert variant (default)
  if (variant === "alert") {
    return (
      <div className="space-y-3">
        {sortedRewards.slice(0, 3).map((reward) => {
          const level = getUrgencyLevel(reward.daysUntilExpiration);
          return (
            <Alert
              key={reward.id}
              variant={level === "critical" ? "destructive" : "default"}
              className={
                level === "high"
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                  : ""
              }
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <AlertTitle>
                    {level === "critical"
                      ? "Urgent: Reward Expiring Soon!"
                      : "Reward Expiring"}
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    Your ₦{reward.amount.toLocaleString()} {reward.rewardType}{" "}
                    expires{" "}
                    {formatDistanceToNow(new Date(reward.expiresAt), {
                      addSuffix: true,
                    })}
                    . Use it before it&apos;s gone!
                  </AlertDescription>
                  <div className="flex gap-2 mt-2">
                    <Button asChild size="sm" variant="default">
                      <Link href="/dashboard/referrals?tab=rewards">
                        Use Now
                      </Link>
                    </Button>
                    {showDismiss && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismiss(reward.id)}
                      >
                        Dismiss
                      </Button>
                    )}
                  </div>
                </div>
                {showDismiss && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDismiss(reward.id)}
                    className="h-8 w-8 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Alert>
          );
        })}
        {sortedRewards.length > 3 && (
          <p className="text-sm text-muted-foreground text-center">
            And {sortedRewards.length - 3} more reward
            {sortedRewards.length - 3 > 1 ? "s" : ""} expiring soon.{" "}
            <Link
              href="/dashboard/referrals?tab=rewards"
              className="text-primary hover:underline font-medium"
            >
              View all
            </Link>
          </p>
        )}
      </div>
    );
  }

  // Card variant
  if (variant === "card") {
    return (
      <Card className="overflow-hidden border-orange-200 bg-gradient-to-br from-orange-50 to-background dark:from-orange-950/20 dark:border-orange-800">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/30">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {sortedRewards.length} Reward
                  {sortedRewards.length > 1 ? "s" : ""} Expiring
                </h3>
                <p className="text-sm text-muted-foreground">
                  Use your credits before they expire
                </p>
              </div>
            </div>
            {showDismiss && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDismiss(mostUrgentReward.id)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {sortedRewards.slice(0, 3).map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between rounded-lg bg-background/80 p-3 border"
              >
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      ₦{reward.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires{" "}
                      {formatDistanceToNow(new Date(reward.expiresAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/referrals?tab=rewards">Use</Link>
                </Button>
              </div>
            ))}
          </div>

          {sortedRewards.length > 3 && (
            <Button asChild variant="link" className="w-full">
              <Link href="/dashboard/referrals?tab=rewards">
                View all {sortedRewards.length} expiring rewards →
              </Link>
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Inline variant
  return (
    <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-4">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
        <p className="text-sm flex-1">
          You have {sortedRewards.length} reward
          {sortedRewards.length > 1 ? "s" : ""} expiring soon (₦
          {sortedRewards
            .reduce((sum, r) => sum + r.amount, 0)
            .toLocaleString()}
          ).
        </p>
        <Button asChild size="sm" variant="default">
          <Link href="/dashboard/referrals?tab=rewards">View</Link>
        </Button>
        {showDismiss && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDismiss(mostUrgentReward.id)}
            className="h-8 w-8 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}