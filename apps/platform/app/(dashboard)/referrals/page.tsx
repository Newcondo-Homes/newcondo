// apps/platform/app/(dashboard)/referrals/page.tsx

import { Metadata } from 'next';
import { ReferralStats } from '@/components/referrals/ReferralStats';
import { ReferralLink } from '@/components/referrals/ReferralLink';
import { ReferralCode } from '@/components/referrals/ReferralCode';
import { SocialShareButtons } from '@/components/referrals/SocialShareButtons';
import { ReferralList } from '@/components/referrals/ReferralList';
import { ReferralProgress } from '@/components/referrals/ReferralProgress';
import { ReferralTimeline } from '@/components/referrals/ReferralTimeline';
import { Button } from '@/components/ui/button';
import { Gift, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Referrals | NewCondo',
  description: 'Invite friends and earn rewards',
};

export default function ReferralsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Referrals</h1>
          <p className="text-muted-foreground mt-1">
            Invite friends and earn rewards when they join NewCondo
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/referrals/rewards">
            <Button variant="outline" className="gap-2">
              <Gift className="h-4 w-4" />
              My Rewards
            </Button>
          </Link>
          <Link href="/referrals/analytics">
            <Button variant="outline" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Link href="/referrals/leaderboard">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Leaderboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <ReferralStats />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Referral Link & Code */}
          <div className="grid gap-6 md:grid-cols-2">
            <ReferralLink />
            <ReferralCode />
          </div>

          {/* Social Share Buttons */}
          <SocialShareButtons />

          {/* Progress to Next Milestone */}
          <ReferralProgress />

          {/* Referrals List */}
          <ReferralList />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Activity Timeline */}
          <ReferralTimeline />

          {/* Quick Actions */}
          <div className="space-y-3">
            <Link href="/referrals/invite" className="block">
              <Button className="w-full" size="lg">
                Invite Friends Now
              </Button>
            </Link>
            <Link href="/referrals/rewards" className="block">
              <Button variant="outline" className="w-full">
                View All Rewards
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}