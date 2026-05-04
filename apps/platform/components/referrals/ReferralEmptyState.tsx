// apps/platform/components/referrals/ReferralEmptyState.tsx

'use client';

import { Button } from '@/components/ui/button';
import { UserPlus, Share2, Gift } from 'lucide-react';
import { useReferralStore } from '@/store/referralStore';

export function ReferralEmptyState() {
  const { toggleInviteModal, toggleShareModal } = useReferralStore();

  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <UserPlus className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">
        No Referrals Yet
      </h3>
      
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        Start inviting friends to NewCondo and earn rewards when they join.
        You&apos;ll earn rewards for every qualified referral!
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={toggleInviteModal} className="gap-2">
          <Share2 className="h-4 w-4" />
          Invite Friends
        </Button>
        <Button variant="outline" onClick={toggleShareModal} className="gap-2">
          <Gift className="h-4 w-4" />
          View Rewards
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <div className="text-2xl mb-2">📤</div>
          <p className="text-xs font-medium mb-1">1. Share Your Link</p>
          <p className="text-xs text-muted-foreground">
            Send your unique referral link
          </p>
        </div>
        
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <div className="text-2xl mb-2">👥</div>
          <p className="text-xs font-medium mb-1">2. Friends Join</p>
          <p className="text-xs text-muted-foreground">
            They sign up and subscribe
          </p>
        </div>
        
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <div className="text-2xl mb-2">🎁</div>
          <p className="text-xs font-medium mb-1">3. Earn Rewards</p>
          <p className="text-xs text-muted-foreground">
            Get credits and bonuses
          </p>
        </div>
      </div>
    </div>
  );
}