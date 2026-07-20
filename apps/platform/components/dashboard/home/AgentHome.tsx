"use client";

/* Agent home — availability toggle, active slot, earnings, jobs nearby, sub-agent requests. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { toast } from "@newcondo/ui";
import { useRole } from "@/components/providers/role-provider";
import { PageHead, DBtn, StatCard, Card, CardH, Row, Thumb, SkeletonRows, Countdown } from "@/components/dashboard/primitives";
import { BarChart } from "@/components/dashboard/charts";
import { ngn, initials } from "@/lib/dashboard/format";
import { useActiveJob, useAvailableJobs, useSubAgentRequests, useCharts, useCacheUpdate, useAgentListings } from "@/hooks/dashboard/useDashboardData";
import { useState } from "react";
import type { SubAgentRequest } from "@/lib/dashboard/data";

export function AgentHome() {
  const router = useRouter();
  const { user } = useRole();
  const active = useActiveJob();
  const available = useAvailableJobs();
  const requests = useSubAgentRequests();
  const listings = useAgentListings();
  const charts = useCharts();
  const cache = useCacheUpdate();
  const [availableForMarking, setAvailable] = useState(true);
  const first = user.name.split(" ")[0];
  if (available.isLoading || listings.isLoading) {
    return (<><PageHead title={`Welcome back, ${first}`} sub="Loading your desk…" /><SkeletonRows n={4} h={92} /></>);
  }
  const toggleAvail = () => {
    /* TODO(backend): PATCH /api/agent/availability { isAvailableForMarking } */
    setAvailable((a) => !a);
    toast.success(availableForMarking ? "You are now unavailable for marking jobs" : "You are available for marking jobs",
      { description: availableForMarking ? "You will stop receiving nearby job broadcasts." : "Nearby broadcasts will notify you instantly." });
  };
  const respond = (r: SubAgentRequest, approve: boolean) => {
    /* TODO(backend): POST /api/agent/sub-agent-requests/:id/(approve|decline) */
    cache.update<SubAgentRequest[]>(["agent", "sub-agent-requests"], (l) => l.filter((x) => x.id !== r.id));
    if (approve) toast.success(`${r.name} approved as sub-agent`, { description: "Their tracked promo link is now active. Splits are enforced automatically." });
    else toast.info("Request declined");
  };
  return (
    <>
      <PageHead title={`Welcome back, ${first}`} sub={`Reliability ${user.reliability} ★ · ${(listings.data ?? []).length} listings · ${ngn(132500)} available`}
        actions={<>
          <DBtn variant={availableForMarking ? "green" : "line"} onClick={toggleAvail}><Icon name="zap" size={15} />{availableForMarking ? "Available for marking" : "Unavailable"}</DBtn>
          <DBtn onClick={() => router.push("/properties")}><Icon name="plus" size={15} strokeWidth={2.2} />New listing</DBtn>
        </>} />
      {active.data && (
        <div className="mb-4 rounded-[22px] bg-ink p-[22px] text-cream max-sm:rounded-[18px] max-sm:p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid size-11 place-items-center rounded-[14px] bg-green-bright/15 text-green-bright"><Icon name="map-pin" size={20} /></span>
            <div className="min-w-[220px] flex-1">
              <div className="text-[15.5px] font-bold tracking-[-0.02em]">Active marking slot — {active.data.title}</div>
              <div className="mt-1 text-[12.5px] text-text-on-dark-2">{active.data.area} · position {active.data.position} in queue · guide: {active.data.contactName}, {active.data.contactPhone}</div>
            </div>
            <Countdown minsLeft={active.data.slotMinsLeft} label="in your slot" />
            <Link href="/marking" className="inline-flex items-center gap-1.5 rounded-full bg-green-bright px-4 py-2.5 text-[13px] font-semibold text-ink no-underline">
              Open job<Icon name="arrow-right" size={14} strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      )}
      <div className="mb-4 grid grid-cols-4 gap-4 max-[1060px]:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-2.5">
        <StatCard label="Earnings (2026)" value={ngn(467500)} icon="trending-up" trend={22} sub="commissions + marking" mono />
        <StatCard label="Pending release" value={ngn(1000)} icon="lock" sub="1 marking payout held" mono />
        <StatCard label="Marking jobs done" value="14" icon="map-pin" sub="reliability 4.8 ★" />
        <StatCard label="Sub-agent views" value="615" icon="users" trend={9} sub="via your promo network" />
      </div>
      <div className="mb-4 grid grid-cols-[1.6fr_1fr] gap-4 max-[860px]:grid-cols-1">
        <Card>
          <CardH title="Earnings" right={<span className="text-[12px] text-text-tertiary">₦ thousands · last 6 months</span>} />
          {charts.data && <BarChart series={charts.data.agentEarnings} />}
        </Card>
        <Card tight>
          <CardH pad title="Jobs near you" right={<Link href="/marking" className="flex items-center gap-1 text-[13px] font-semibold text-green-dark no-underline hover:text-ink">Queue<Icon name="chevron-right" size={13} /></Link>} />
          {(available.data ?? []).slice(0, 3).map((j) => (
            <Row key={j.id} onClick={() => router.push("/marking")}>
              <Thumb icon="map-pin" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{j.title}</div>
                <div className="mt-1 text-[12.5px] text-text-tertiary">{j.distanceKm} km · {j.queue} in queue</div>
              </div>
              <span className="font-mono text-[13px] font-semibold">{ngn(j.payout)}</span>
            </Row>
          ))}
        </Card>
      </div>
      {(requests.data ?? []).length > 0 && (
        <Card tight>
          <CardH pad title="Sub-agent requests" right={<StatusBadgePending n={(requests.data ?? []).length} />} />
          {(requests.data ?? []).map((r) => (
            <Row key={r.id}>
              <div className="grid size-10 flex-none place-items-center rounded-full bg-ink text-[12px] font-bold text-cream">{initials(r.name)}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold tracking-[-0.01em]">{r.name} wants to promote {r.property}</div>
                <div className="mt-1 text-[12.5px] text-text-tertiary">{r.reliability} ★ reliability · requested {r.requested}</div>
              </div>
              <div className="flex gap-2 max-sm:w-full max-sm:justify-end">
                <DBtn variant="line" sm onClick={() => respond(r, false)}>Decline</DBtn>
                <DBtn sm onClick={() => respond(r, true)}>Approve</DBtn>
              </div>
            </Row>
          ))}
        </Card>
      )}
    </>
  );
}
function StatusBadgePending({ n }: { n: number }) {
  return <span className="rounded-full bg-[#B8860B]/10 px-2.5 py-1 text-[11.5px] font-semibold text-[#8a6508]">{n} pending</span>;
}
