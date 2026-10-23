"use client";
// apps/admin/app/(dashboard)/overview/page.tsx — queues the caller can open (server returns null for the rest).
import Link from "next/link";
import { ShieldCheck, MapPin, AlertTriangle, Wallet, Gift, Briefcase, ChevronRight, Lock, Building2, LifeBuoy, Wrench } from "lucide-react";
import { useOverview } from "@/hooks/useAdmin";
import { useCan } from "@/components/auth/Can";
import { Stat, SkeletonRows, Empty } from "@/components/ui/primitives";

const QUEUES = [
  { key: ["identity"], href: "/approvals", icon: ShieldCheck, t: "Identity checks", sub: "Government ID + selfie, one card per person" },
  { key: ["listings"], href: "/approvals", icon: Building2, t: "Listings to approve", sub: "Ownership proof, consent and the marked boundary" },
  { key: ["newMarking"], href: "/marking", icon: MapPin, t: "NewCondo marking jobs", sub: "Paid — assign a field marker" },
  { key: ["markingDisputes"], href: "/marking", icon: MapPin, t: "Marking disputes", sub: "Owner rejected a marker’s boundary" },
  { key: ["openDisputes"], href: "/disputes", icon: AlertTriangle, t: "Rent disputes", sub: "Rent stays in escrow until you decide" },
  { key: ["visitIssues"], href: "/disputes", icon: Wrench, t: "Vendor visit issues", sub: "Missed or reported visits" },
  { key: ["openTickets"], href: "/support", icon: LifeBuoy, t: "Support tickets", sub: "Open and in progress" },
  { key: ["failedTransfers"], href: "/payments", icon: Wallet, t: "Failed transfers (30 days)", sub: "Already reversed or re-queued — check for patterns" },
  { key: ["referralHolds"], href: "/referrals", icon: Gift, t: "Referrals on fraud hold", sub: "Same device, BVN, phone or bank" },
  { key: ["pendingVendors"], href: "/vendors", icon: Briefcase, t: "Vendors to approve", sub: "Bank and service area required" },
];

export default function Overview() {
  const { me } = useCan();
  const { data, isLoading } = useOverview();
  if (isLoading || !data) return <SkeletonRows n={5} />;
  const items = QUEUES.map((x) => ({ ...x, n: x.key.reduce<number | null>((a, k) => { const v = data.queues[k]; return v == null ? a : (a ?? 0) + v; }, null) })).filter((x) => x.n != null && x.n > 0);
  return <>
    <div className="ph"><div><h1>Good day, {me?.name.split(" ")[0]}</h1><p>What needs you right now.</p></div></div>
    <div className="grid g-stats" style={{ marginBottom: 16 }}>
      {data.escrow && <Stat label="Rent held in escrow" value={`₦${data.escrow.naira.toLocaleString("en-NG")}`} mono icon={<Lock size={16} />} sub={`${data.escrow.count} payment(s) · released after 24h unless disputed`} />}
      {data.vendorVisitsToday != null && <Stat label="Vendor visits today" value={data.vendorVisitsToday} icon={<Briefcase size={16} />} sub="Code-verified on site" />}
    </div>
    <div className="card"><div className="card-h"><h3>Needs action</h3><span className="hint">Only queues you have access to</span></div>
      {items.length === 0 ? <Empty title="Nothing waiting on you" sub="New items appear here the moment they arrive." />
        : <div className="a-queue">{items.map((q) => { const Ic = q.icon; return <Link key={q.t} href={q.href} className="a-q"><span className="a-q-ic"><Ic size={17} /></span><div className="a-q-b"><div className="a-name">{q.t}</div><div className="a-sub">{q.sub}</div></div><span className="a-q-n">{q.n}</span><ChevronRight size={15} /></Link>; })}</div>}
    </div>
  </>;
}
