"use client";

/* Owner home — quick actions, needs-attention queue, rent chart, property list. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { useRole } from "@/components/providers/role-provider";
import { PageHead, DBtn, StatCard, StatusBadge, Card, CardH, Row, Thumb, SkeletonRows, Banner, Countdown } from "@/components/dashboard/primitives";
import { LineChart } from "@/components/dashboard/charts";
import { ngn } from "@/lib/dashboard/format";
import { useMyProperties, usePendingEscrow, useOwnerMarkingJobs, useCharts } from "@/hooks/dashboard/useDashboardData";
import { CreateListingModal } from "@/components/dashboard/properties/CreateListingModal";
import { SubAgentRequestsCard } from "@/components/dashboard/properties/SubAgentRequests";
import { QuickAction } from "./QuickAction";

export function OwnerHome() {
  const router = useRouter();
  const { user } = useRole();
  const props = useMyProperties();
  const escrow = usePendingEscrow("OWNER");
  const marking = useOwnerMarkingJobs();
  const charts = useCharts();
  const [create, setCreate] = useState(false);
  const first = user.name.split(" ")[0];
  if (props.isLoading || escrow.isLoading || marking.isLoading) {
    return (<><PageHead title={`Good afternoon, ${first}`} sub="Loading your portfolio…" /><SkeletonRows n={4} h={92} /></>);
  }
  const list = props.data ?? [];
  const live = list.filter((p) => p.status === "PUBLISHED").length;
  const rented = list.filter((p) => p.status === "RENTED").length;
  const attention = [
    ...(marking.data ?? []).filter((j) => j.status === "AWAITING_CONFIRMATION").map((j) => ({
      icon: "map-pin", title: `Confirm marking — ${j.property}`, sub: `Marked by ${j.marker} · ${j.photos} photos uploaded`, cta: "Review & confirm",
      chip: <Countdown hoursLeft={j.confirmDeadlineH} label="to confirm" />, to: "/marking",
    })),
    ...(escrow.data ?? []).map((e) => ({
      icon: "lock", title: `${ngn(e.amount)} in escrow — ${e.property} (${e.flat})`, sub: `Paid by ${e.renter}. Releases after the renter's 24-hour confirmation window.`, cta: "View payment",
      chip: <Countdown hoursLeft={e.hoursLeft} />, to: "/payments",
    })),
    ...list.filter((p) => p.status === "PENDING_MARKING").map((p) => ({
      icon: "triangle-alert", title: `${p.title} isn't marked yet`, sub: "A property must be GPS-marked before it can go live.", cta: "Start marking", chip: null as React.ReactNode, to: "/marking",
    })),
  ];
  return (
    <>
      <PageHead title={`Good afternoon, ${first}`} sub={`${live} live · ${rented} rented · ${ngn(1200000)} in escrow`}
        actions={<DBtn onClick={() => setCreate(true)}><Icon name="plus" size={15} strokeWidth={2.2} />List a property</DBtn>} />
      <div className="mb-4 grid grid-cols-4 gap-3 max-[1060px]:grid-cols-2 max-sm:gap-2.5">
        <QuickAction icon="plus" title="List a property" sub="Create a listing — marking included" onClick={() => setCreate(true)} />
        <QuickAction icon="map-pin" title="Request marking" sub="Send an agent to mark your property" onClick={() => router.push("/marking")} />
        <QuickAction icon="wallet" title="Withdraw funds" sub={`${ngn(680000)} available`} onClick={() => router.push("/wallet")} />
        <QuickAction icon="gift" title="Refer an owner" sub="You both earn a free month" onClick={() => router.push("/referrals")} />
      </div>
      <div className="mb-4 grid grid-cols-4 gap-4 max-[1060px]:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-2.5">
        <StatCard label="Rent collected (2026)" value={ngn(2730000)} icon="trending-up" trend={12} sub="vs. last quarter" mono />
        <StatCard label="In escrow" value={ngn(1200000)} icon="lock" sub="1 payment · 24h window" mono />
        <StatCard label="Listing views (7 days)" value="502" icon="eye" trend={18} sub="across 2 live listings" />
        <StatCard label="Occupancy" value={`${rented + 1}/${list.reduce((a, p) => a + p.flats, 0)} flats`} icon="building-2" sub="1 flat vacant in Owerri" />
      </div>
      {attention.length > 0 && (
        <Card className="mb-4">
          <CardH title="Needs your attention" right={<StatusBadge s="PENDING">{attention.length}</StatusBadge>} />
          <div className="flex flex-col gap-2.5">
            {attention.map((a, i) => (
              <Banner key={i} tone="warn" icon={a.icon}
                action={<div className="flex flex-wrap items-center justify-end gap-2.5 max-sm:w-full max-sm:justify-between">{a.chip}<DBtn sm className="whitespace-nowrap" onClick={() => router.push(a.to)}>{a.cta}</DBtn></div>}>
                <b className="font-semibold">{a.title}</b>
                <div className="mt-0.5 text-[12.5px]">{a.sub}</div>
              </Banner>
            ))}
          </div>
        </Card>
      )}
      <div className="mb-4"><SubAgentRequestsCard /></div>
      <div className="grid grid-cols-[1.6fr_1fr] gap-4 max-[860px]:grid-cols-1">
        <Card>
          <CardH title="Rent collected" right={<span className="text-[12px] text-text-tertiary">₦ thousands · last 6 months</span>} />
          {charts.data && <LineChart series={charts.data.revenue} />}
        </Card>
        <Card tight>
          <CardH pad title="Your properties" right={<Link href="/properties" className="flex items-center gap-1 text-[13px] font-semibold text-green-dark no-underline hover:text-ink">All<Icon name="chevron-right" size={13} /></Link>} />
          {list.slice(0, 4).map((p) => (
            <Row key={p.id} onClick={() => router.push(`/properties/${p.id}`)}>
              <Thumb />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{p.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-text-tertiary"><StatusBadge s={p.status} />{p.views > 0 && <span>{p.views} views</span>}</div>
              </div>
              <Icon name="chevron-right" size={15} className="text-text-tertiary" />
            </Row>
          ))}
        </Card>
      </div>
      <AnimatePresence>{create && <CreateListingModal onClose={() => setCreate(false)} />}</AnimatePresence>
    </>
  );
}
