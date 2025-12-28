// apps/platform/components/referrals/ReferralBanner.tsx
"use client";

import { X, Gift, TrendingUp, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@newcondo/ui/components/button";
import { Card } from "@newcondo/ui/components/card";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface ReferralBannerProps {
  variant?: "default" | "compact" | "floating";
  showClose?: boolean;
  className?: string;
}

export function ReferralBanner({
  variant = "default",
  showClose = true,
  className = "",
}: ReferralBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem("referralBannerDismissed");
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    
    // Show banner again after 7 days
    const shouldShow =
      !dismissedDate ||
      Date.now() - dismissedDate.getTime() > 7 * 24 * 60 * 60 * 1000;

    setIsVisible(shouldShow);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("referralBannerDismissed", new Date().toISOString());
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible || !user) return null;

  // Compact variant
  if (variant === "compact") {
    return (
      <Card
        className={`relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4 ${
          isDismissed ? "animate-out fade-out slide-out-to-top-2" : ""
        } ${className}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Gift className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">
                Earn rewards by referring friends!
              </p>
              <p className="text-xs text-muted-foreground">
                Get ₦5,000 for each successful referral
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="default">
              <Link href="/dashboard/referrals">Start Referring</Link>
            </Button>
            {showClose && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDismiss}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Floating variant
  if (variant === "floating") {
    return (
      <div
        className={`fixed bottom-6 right-6 z-50 max-w-sm ${
          isDismissed ? "animate-out fade-out slide-out-to-right-2" : "animate-in fade-in slide-in-from-right-2"
        } ${className}`}
      >
        <Card className="relative overflow-hidden border-primary bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-2xl">
          {showClose && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDismiss}
              className="absolute right-2 top-2 h-8 w-8 text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary-foreground/20 p-3">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Refer & Earn!</h3>
                <p className="text-sm text-primary-foreground/90">
                  Share the love, earn rewards
                </p>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/90">
              Earn ₦5,000 for every friend who signs up and makes their first
              transaction. Your friends get ₦3,000 too!
            </p>
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="w-full"
            >
              <Link href="/dashboard/referrals">Get Your Referral Link</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Default variant
  return (
    <Card
      className={`relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background ${
        isDismissed ? "animate-out fade-out slide-out-to-top-2" : ""
      } ${className}`}
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
      
      <div className="relative p-6 md:p-8">
        {showClose && (
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            className="absolute right-4 top-4 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <div className="grid gap-6 md:grid-cols-[1fr,auto] md:items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Gift className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Refer Friends, Earn Rewards!
                </h2>
                <p className="text-muted-foreground">
                  Share NewCondo and get rewarded for every successful referral
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-lg bg-background/50 p-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Unlimited Referrals</p>
                  <p className="text-xs text-muted-foreground">
                    No limits on earnings
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-background/50 p-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">₦5,000 per referral</p>
                  <p className="text-xs text-muted-foreground">
                    For qualified users
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-background/50 p-3">
                <Gift className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Instant Credits</p>
                  <p className="text-xs text-muted-foreground">
                    Applied automatically
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="w-full md:w-auto">
              <Link href="/dashboard/referrals">
                Get Your Referral Link
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full md:w-auto"
            >
              <Link href="/dashboard/referrals/terms">
                View Terms & Conditions
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}