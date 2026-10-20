"use client";
// Job detail sheet — address, owner's window, contacts (masked), reminder
// calls, verification + payout state. "Can't make it" asks the backend to
// rebook inside the owner's availability.
import { useState } from "react";
import { toast } from "sonner";
import { Phone, Info, ShieldCheck } from "lucide-react";
import { Modal, Badge, SkeletonRows } from "@/components/ui/primitives";
import { useJob, useRefreshJobs } from "@/hooks/useVendor";
import { rescheduleJob } from "@/lib/api/vendor";
import { fmtDay, fmtTime, isTodayLagos, naira } from "@/lib/constants";
import { useUI } from "@/store/ui";
import { JobStatus, svcLabel, windowLabel } from "./JobRow";

const ROLE = { TENANT: "Tenant", LISTING_AGENT: "Listing agent", OWNER: "Owner" } as Record<string, string>;

export function JobSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: j, isLoading } = useJob(id);
  const { setVerifyJob } = useUI();
  const refresh = useRefreshJobs();
  const [moving, setMoving] = useState(false);
  const [reason, setReason] = useState("");
  if (isLoading || !j) return <Modal title="Loading job…" onClose={onClose}><SkeletonRows n={4} /></Modal>;
  const today = ["SCHEDULED", "ACTIVE"].includes(j.status) && !!j.scheduledFor && isTodayLagos(j.scheduledFor);
  const move = async () => {
    const t = toast.loading("Asking for a new date…");
    try { await rescheduleJob(j.id, reason); await refresh(); toast.success("Visit moved", { id: t, description: "A new date inside the owner's availability is in your schedule." }); onClose(); }
    catch (e) { toast.error("Couldn't move the visit", { id: t, description: (e as Error).message }); }
  };
  return <Modal wide title={j.property} sub={`${svcLabel(j.service)} · ${j.ref}${j.planType ? ` · ${j.planType.replace("OWNER_", "").toLowerCase()} plan` : ""}`} onClose={onClose}
    footer={moving
      ? <><button className="btn btn-line" onClick={() => setMoving(false)}>Back</button><button className="btn btn-dark" disabled={reason.trim().length < 3} onClick={move}>Request new date</button></>
      : <>{["SCHEDULED", "RESCHEDULE_REQUESTED"].includes(j.status) && <button className="btn btn-line" onClick={() => setMoving(true)}>Can&apos;t make it</button>}
        {today ? <button className="btn btn-dark" onClick={() => setVerifyJob(j.id)}><ShieldCheck size={15} />Finish & verify visit</button> : <button className="btn btn-dark" onClick={onClose}>Done</button>}</>}>
    {moving ? <div className="field"><label>Why can&apos;t you make it?</label><textarea className="inp" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Team member sick — can do any day next week" /><span className="hint">The owner is told and a new date is booked automatically.</span></div> : <>
      <div className="grid g-2" style={{ gap: 14 }}>
        <div>
          <div className="kv"><span className="k">Date</span><span className="v">{j.scheduledFor ? (isTodayLagos(j.scheduledFor) ? "Today" : fmtDay(j.scheduledFor)) : "—"}</span></div>
          <div className="kv"><span className="k">Arrival window</span><span className="v">{windowLabel(j)}</span></div>
          <div className="kv"><span className="k">Address</span><span className="v">{j.address}</span></div>
          <div className="kv"><span className="k">You receive</span><span className="v mono">{naira(j.receive)}</span></div>
        </div>
        <div>
          <div className="kv"><span className="k">Owner</span><span className="v">{j.owner.name}{j.owner.phoneMasked && <div className="sub mono">{j.owner.phoneMasked}</div>}</span></div>
          <div className="kv"><span className="k">Occupant</span><span className="v">{j.occupant.label}{j.occupant.phoneMasked && <div className="sub mono">{j.occupant.phoneMasked}</div>}</span></div>
          {j.agent && <div className="kv"><span className="k">Listing agent</span><span className="v">{j.agent}</span></div>}
          <div className="kv"><span className="k">Status</span><span className="v"><JobStatus j={j} /></span></div>
        </div>
      </div>
      {j.notes && <div className="banner info" style={{ marginTop: 14 }}><Info size={17} /><span>{j.notes}</span></div>}
      {j.service !== "WASTE_MANAGEMENT" && <>
        <div className="divider" />
        <div className="card-h" style={{ marginBottom: 8 }}><h3 style={{ fontSize: 14.5 }}>Reminder calls</h3><span className="hint">Newcondo rings someone at the property so you&apos;re not turned away.</span></div>
        {j.reminders.length === 0 ? <p className="hint" style={{ margin: 0 }}>First call goes out 2 days before the visit, then on the morning of the visit.</p>
          : <div className="v-calls">{j.reminders.map((r, i) => <div key={i} className="v-call"><Phone size={14} /><span><b>{ROLE[r.contactRole] ?? r.contactRole}</b><span className="hint"> · {r.dayOffset === 0 ? "visit day" : `${r.dayOffset} days before`}, {fmtTime(r.at)}</span></span><Badge s={r.status} /></div>)}</div>}
      </>}
      {j.status === "COMPLETED" && <><div className="divider" />
        <div className="kv"><span className="k">Verified</span><span className="v">{j.verifiedAt ? `${fmtDay(j.verifiedAt)}, ${fmtTime(j.verifiedAt)} · ${j.verifiedVia === "QR" ? "QR" : "code"}` : "—"}</span></div>
        <div className="kv"><span className="k">Payout</span><span className="v">{j.payout === "PAID" && j.paidOutAt ? `Sent ${fmtDay(j.paidOutAt)}` : j.payout === "BATCHED" ? "In today's 6:00 pm payout" : "Transfer processing"}</span></div>
      </>}
    </>}
  </Modal>;
}
