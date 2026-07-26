"use client";

/* Referrals — dual-sided, pay-on-success credits.
   Live: GET /api/v1/referrals/stats · /leaderboard · /active-areas
   (referral-service). Leaderboard shows affiliates their actions are
   tracked (agents are the primary affiliates); ActiveAreas + the
   copy-confirm modal reinforce that affiliation only works in the areas
   Newcondo currently covers (constants/business.ts ACTIVE_AREAS). */
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { useRole } from "@/components/providers/role-provider";
import { PageHead, StatCard, StatusBadge, Card, CardH, Row, CopyField, SkeletonRows } from "@/components/dashboard/primitives";
import { useReferrals } from "@/hooks/dashboard/useDashboardData";
import { LeaderboardCard, ActiveAreasCard, CopiedLinkModal } from "@/components/dashboard/referrals/Leaderboard";
import { ngn, initials } from "@/lib/dashboard/format";
import type { Role } from "@/lib/dashboard/data";

const COPY: Record<Role, string> = {
  OWNER: "Refer another owner — you both get a free month when they subscribe.",
  AGENT: "Refer owners or agents — credits land in your wallet after their first transaction.",
  RENTER: "Refer friends — earn ₦2,000 in credits when they complete a rental.",
};

export default function ReferralsPage() {
  const { role } = useRole();
  const { data, isLoading } = useReferrals();
  const [copied, setCopied] = useState(false);
  if (isLoading || !data) return (<><PageHead title="Referrals" sub="Loading…" /><SkeletonRows n={4} h={70} /></>);
  return (
    <>
      <PageHead title="Referrals" sub={COPY[role]} />
      <div className="mb-4 rounded-[22px] bg-ink p-[22px] text-cream max-sm:rounded-[18px] max-sm:p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[240px] flex-1">
            <div className="text-[17px] font-bold tracking-[-0.02em]">Your referral link</div>
            <div className="mt-1 text-[12.5px] text-text-on-dark-2">Rewards trigger only after your invitee pays — that&rsquo;s how both sides earn.</div>
          </div>
          {/* onCopied opens the confirm modal/sheet listing the active areas */}
          <div className="max-w-[420px] flex-[1_1_320px]"><CopyField value={data.link} silent onCopied={() => setCopied(true)} /></div>
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Join me on Newcondo — verified rentals, escrow-protected payments: https://${data.link}`)}`, "_blank", "noopener")}
            className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2.5 text-[13px] font-semibold text-white max-sm:w-full max-sm:justify-center">
            <Icon name="send" size={14} />Share on WhatsApp
          </button>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-4 gap-4 max-[1060px]:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-2.5">
        <StatCard label="Invited" value={data.invited} icon="send" />
        <StatCard label="Signed up" value={data.signedUp} icon="users" />
        <StatCard label="Converted (paid)" value={data.converted} icon="check" sub="rewards released" />
        <StatCard label="Credits earned" value={ngn(data.credits)} icon="gift" mono sub="redeemable against fees" />
      </div>
      {/* Agents are the primary affiliates — leaderboard sits beside activity */}
      <div className="mb-4 grid grid-cols-[1.5fr_1fr] gap-4 max-[960px]:grid-cols-1">
        <Card tight className="self-start">
          <CardH pad title="Referral activity" />
          {data.history.map((r) => (
            <Row key={r.id}>
              <div className="grid size-10 flex-none place-items-center rounded-full bg-ink text-[12px] font-bold text-cream">{initials(r.name)}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{r.name}</div>
                <div className="mt-1 text-[12.5px] text-text-tertiary">{r.date}{"note" in r && r.note ? ` · ${r.note}` : ""}</div>
              </div>
              <div className="flex flex-none items-center gap-2.5">
                {r.reward > 0 && <span className="font-mono text-[13px] font-semibold text-green-dark">+{ngn(r.reward)}</span>}
                <StatusBadge s={r.status} />
              </div>
            </Row>
          ))}
        </Card>
        <div className="self-start"><LeaderboardCard /></div>
      </div>
      <ActiveAreasCard />
      <AnimatePresence>
        {copied && <CopiedLinkModal link={data.link} onClose={() => setCopied(false)} />}
      </AnimatePresence>
    </>
  );
}
