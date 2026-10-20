"use client";
// Schedule (Mon–Sat week, Friday closed) + Clients.
import { useMemo, useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { useClients, useJobs, useMe } from "@/hooks/useVendor";
import { Modal, Empty, SkeletonRows, Badge } from "@/components/ui/primitives";
import { DAY_NAMES, VENDORS, fmtDay, minuteLabel } from "@/lib/constants";
import { useUI } from "@/store/ui";
import { svcLabel, windowLabel } from "@/components/jobs/JobRow";
import type { VendorClientDTO } from "@/lib/types";

const lagosKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

export function ScheduleView() {
  const { data: me } = useMe();
  const { data, isLoading } = useJobs("all");
  const { setOpenJob } = useUI();
  const days = useMemo(() => {
    const now = new Date();
    const wd = Number(new Date(now.toLocaleString("en-US", { timeZone: "Africa/Lagos" })).getDay());
    const monday = new Date(now.getTime() - ((wd + 6) % 7) * 86_400_000);
    return [1, 2, 3, 4, 5, 6].map((d) => { const date = new Date(monday.getTime() + (d - 1) * 86_400_000); return { d, date, key: lagosKey(date) }; });
  }, []);
  const [pick, setPick] = useState(days.find((x) => x.key === lagosKey(new Date()))?.d ?? 1);
  const jobsOn = (key: string) => (data?.jobs ?? []).filter((j) => j.scheduledFor && lagosKey(new Date(j.scheduledFor)) === key && !["CANCELLED", "PAUSED"].includes(j.status));
  const Col = ({ x }: { x: (typeof days)[number] }) => {
    const closed = !VENDORS.hours.allowedDays.includes(x.d);
    const js = closed ? [] : jobsOn(x.key);
    return <div className={`v-day${closed ? " closed" : ""}${x.key === lagosKey(new Date()) ? " today" : ""}`}>
      <div className="v-day-h"><span>{DAY_NAMES[x.d]}</span><b>{x.date.toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", day: "numeric" })}</b></div>
      {closed ? <div className="v-closed">No visits<br />on Fridays</div> : js.length ? js.map((j) => <button key={j.id} className={`v-blk ${j.service}${j.status === "COMPLETED" ? " done" : ""}`} onClick={() => setOpenJob(j.id)}>
        <span className="t">{windowLabel(j)}</span><b>{j.property}</b><span>{svcLabel(j.service)}{j.status === "COMPLETED" ? " · done" : ""}</span></button>) : <div className="v-free">Free</div>}
      {!closed && <div className="v-cap">{js.length} / {me?.capacityPerDay ?? "–"} visits</div>}
    </div>;
  };
  return <>
    <div className="ph"><div><h1>Schedule</h1><p>This week · visits are booked inside each owner&apos;s availability.</p></div></div>
    <div className="banner info" style={{ marginBottom: 14 }}><span>Visits run <b>Monday – Thursday and Saturday, {minuteLabel(VENDORS.hours.startMinute)} – {minuteLabel(VENDORS.hours.endMinute)}</b>. Fridays and Sundays stay free for worship. Newcondo books no more than <b>{me?.capacityPerDay ?? "–"}</b> visits for you a day.</span></div>
    {isLoading ? <SkeletonRows n={2} h={200} /> : <>
      <div className="v-daypick v-mobile-only">{days.map((x) => <button key={x.d} className={pick === x.d ? "on" : ""} disabled={!VENDORS.hours.allowedDays.includes(x.d)} onClick={() => setPick(x.d)}><span>{DAY_NAMES[x.d]}</span><b>{x.date.toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", day: "numeric" })}</b></button>)}</div>
      <div className="v-mobile-only"><Col x={days.find((x) => x.d === pick)!} /></div>
      <div className="v-week v-desktop-only">{days.map((x) => <Col key={x.d} x={x} />)}</div>
    </>}
  </>;
}

export function ClientsView() {
  const { data = [], isLoading } = useClients();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<VendorClientDTO | null>(null);
  const list = data.filter((c) => `${c.property} ${c.owner} ${c.area}`.toLowerCase().includes(q.toLowerCase()));
  return <>
    <div className="ph"><div><h1>Clients</h1><p>{data.filter((c) => c.status === "ACTIVE").length} properties assigned to you. Each owner in your areas is served by one vendor only.</p></div></div>
    <div className="card tight">
      <div style={{ padding: 14, borderBottom: "1px solid var(--border-hair)" }}><div className="v-search"><Search size={16} /><input className="inp" placeholder="Search property, owner or area" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
      {isLoading ? <SkeletonRows n={4} /> : <div className="v-tbl-wrap"><table className="tbl v-clients">
        <thead><tr><th>Property</th><th>Plan & services</th><th>Availability</th><th>Next visit</th><th /></tr></thead>
        <tbody>{list.map((c) => <tr key={c.propertyId} onClick={() => setOpen(c)} style={{ cursor: "pointer" }}>
          <td data-l="Property"><b style={{ fontWeight: 600 }}>{c.property}</b><div className="sub">{c.owner} · {c.area}</div></td>
          <td data-l="Plan"><span className="badge b-grey">{c.planType.replace("OWNER_", "").replace("_ANNUAL", " · annual").toLowerCase()}</span><div className="sub">{c.services.map(svcLabel).join(" · ")}</div></td>
          <td data-l="Availability">{c.window.days.map((d) => DAY_NAMES[d]).join(", ")}<div className="sub">{minuteLabel(c.window.startMinute)} – {minuteLabel(c.window.endMinute)}</div></td>
          <td data-l="Next visit">{c.nextVisit ? fmtDay(c.nextVisit) : "Not booked yet"}</td>
          <td data-l=""><Badge s={c.status} /></td>
        </tr>)}</tbody>
      </table></div>}
      {!isLoading && !list.length && <Empty title={data.length ? "No match" : "No clients yet"} sub={data.length ? "Try another name or area." : "Subscribed properties inside your service areas are assigned to you automatically."} />}
    </div>
    {open && <Modal wide title={open.property} sub={`${open.owner} · client since ${fmtDay(open.since)}`} onClose={() => setOpen(null)} footer={<button className="btn btn-dark" onClick={() => setOpen(null)}>Done</button>}>
      {open.status === "PAUSED" && <div className="banner warn" style={{ marginBottom: 14 }}><AlertTriangle size={17} /><span>The owner&apos;s plan isn&apos;t active, so visits are on hold. Don&apos;t visit — it won&apos;t be paid.</span></div>}
      <div className="kv"><span className="k">Your services</span><span className="v">{open.services.map(svcLabel).join(" · ")}</span></div>
      <div className="kv"><span className="k">Next visit</span><span className="v">{open.nextVisit ? fmtDay(open.nextVisit) : "Booked once the plan has funded it"}</span></div>
      <div className="divider" />
      <div className="field"><label>Owner&apos;s availability</label><div className="v-days">{[1, 2, 3, 4, 5, 6].map((d) => <span key={d} className={`v-dchip${open.window.days.includes(d) ? " on" : ""}${d === 5 ? " off" : ""}`}>{DAY_NAMES[d]}</span>)}</div>
        <span className="hint">{minuteLabel(open.window.startMinute)} – {minuteLabel(open.window.endMinute)} · set by the owner, always inside service hours.</span></div>
      <p className="hint" style={{ margin: 0 }}>Visit dates are set when the owner&apos;s subscription has covered the visit cost — upgrades bring visits forward, downgrades push them back.</p>
    </Modal>}
  </>;
}
