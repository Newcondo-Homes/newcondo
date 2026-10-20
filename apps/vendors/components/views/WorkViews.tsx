"use client";
// Today + Jobs views.
import Link from "next/link";
import { Briefcase, Clock, RefreshCw, Wallet, ShieldCheck } from "lucide-react";
import { useMe, useOverview, useJobs } from "@/hooks/useVendor";
import { Stat, Empty, SkeletonRows, Tabs, usePersistedTab } from "@/components/ui/primitives";
import { JobRow } from "@/components/jobs/JobRow";
import { koboToNaira, naira } from "@/lib/constants";
import { useUI } from "@/store/ui";

const greet = () => { const h = Number(new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos", hour: "numeric", hour12: false })); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

export function TodayView() {
  const { data: me } = useMe();
  const { data: ov, isLoading } = useOverview();
  const { setVerifyJob } = useUI();
  const next = ov?.today.find((j) => ["SCHEDULED", "ACTIVE"].includes(j.status));
  const first = (me?.contactName ?? me?.name ?? "").split(" ")[0];
  return <>
    <div className="ph"><div><h1>{greet()}{first ? `, ${first}` : ""}</h1><p>{new Date().toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", weekday: "long", day: "numeric", month: "long" })} · {ov ? (ov.counts.todayLeft ? `${ov.counts.todayLeft} visit(s) left today` : "Nothing left for today") : "…"}</p></div>
      <div className="ph-actions"><Link className="btn btn-line" href="/schedule"><Clock size={15} />This week</Link>{next && <button className="btn btn-dark" onClick={() => setVerifyJob(next.id)}><ShieldCheck size={15} />Verify next visit</button>}</div></div>
    <div className="grid g-stats" style={{ marginBottom: 16 }}>
      <Stat label="Visits today" value={ov?.counts.todayTotal ?? "–"} sub={ov ? `${ov.counts.todayTotal - ov.counts.todayLeft} done · ${ov.counts.todayLeft} to go` : undefined} icon={<Briefcase size={16} />} />
      <Stat label="Coming up" value={ov?.counts.upcoming7d ?? "–"} sub="Booked, next 7 days" icon={<Clock size={16} />} />
      <Stat label="Awaiting payment" mono value={ov ? naira(koboToNaira(ov.counts.pendingPaymentKobo)) : "–"} sub={ov ? `${ov.counts.pendingJobs} verified job(s)` : undefined} icon={<RefreshCw size={16} />} />
      <Stat label="Paid this month" mono value={ov ? naira(koboToNaira(ov.counts.paidThisMonthKobo)) : "–"} sub={me?.bank.bankName ? `To ${me.bank.bankName} ${me.bank.accountNumberMasked}` : "Add a bank in Settings"} icon={<Wallet size={16} />} />
    </div>
    <div className="grid g-32">
      <div className="card tight">
        <div className="card-h" style={{ padding: "18px 20px 0" }}><h3>Today&apos;s visits</h3><Link className="card-link" href="/jobs">All jobs</Link></div>
        {isLoading ? <SkeletonRows n={3} /> : ov?.today.length ? ov.today.map((j) => <JobRow key={j.id} j={j} showDate={false} />) : <Empty title="No visits today" sub="Visits are booked as your clients' plans fund them, inside each owner's availability." />}
      </div>
      <div className="card">
        <div className="card-h"><h3>How you get paid</h3><span className="badge b-green">{me?.releaseMode === "END_OF_DAY" ? "End of day" : "Instant"}</span></div>
        <ol className="v-steps">
          <li><b>Do the job</b><span>Photos of the work, then ask for the visit code.</span></li>
          <li><b>Enter the code or scan the QR</b><span>Only the tenant, owner or listing agent can create it — on the visit day.</span></li>
          <li><b>Get paid</b><span>{me?.releaseMode === "END_OF_DAY" ? "Everything verified today is sent together at 6:00 pm." : "Sent to your bank the moment the code matches."}</span></li>
        </ol>
        <Link className="card-link" href="/payouts">Change payout timing</Link>
      </div>
    </div>
  </>;
}

type Tab = "todo" | "pending" | "paid" | "all";
export function JobsView() {
  const [tab, setTab] = usePersistedTab<Tab>("v-jobs-tab", "todo");
  const { data, isLoading } = useJobs(tab);
  return <>
    <div className="ph"><div><h1>Jobs</h1><p>Every visit assigned to you, from booked to paid.</p></div></div>
    <div style={{ marginBottom: 14 }}><Tabs value={tab} onChange={setTab} items={[{ id: "todo", label: "To do" }, { id: "pending", label: "Pending payment" }, { id: "paid", label: "Paid" }, { id: "all", label: "All" }]} /></div>
    <div className="card tight">{isLoading ? <SkeletonRows n={4} /> : data?.jobs.length ? data.jobs.map((j) => <JobRow key={j.id} j={j} />) : <Empty title={tab === "todo" ? "Nothing booked" : "Nothing here yet"} sub="New visits appear as clients' service dates come up." />}</div>
  </>;
}
