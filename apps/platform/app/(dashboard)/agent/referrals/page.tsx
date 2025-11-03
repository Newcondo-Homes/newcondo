import { Suspense } from "react";
import { Metadata } from "next";
import CommissionsLoading from "../commissions/loading";
import AgentReferralTracking from "@/components/agent/AgentReferralTracking";

export const metadata: Metadata = {
  title: "Agent Referral Tracking | NewCondo",
  description: "Track your referrals, sub-agents, and promotional activities",
};

export default function AgentReferralsPage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<CommissionsLoading />}>
        <AgentReferralTracking />
      </Suspense>
    </div>
  );
}