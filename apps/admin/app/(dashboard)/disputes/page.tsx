"use client";
// apps/admin/app/(dashboard)/disputes/page.tsx — Rent disputes (money held until decided) · Vendor visit issues.
// Marking disputes live on the Marking page (they move marker money through marking-service).
import { useState } from "react";
import { A, type DisputeRow, type VisitIssue } from "@/lib/api/admin";
import { useAction } from "@/hooks/useAdmin";
import { RequireScope, useCan } from "@/components/auth/Can";
import { DataTable, Person, when } from "@/components/ui/DataTable";
import { Badge, Modal, Tabs, usePersistedTab } from "@/components/ui/primitives";

type O = "NO_REFUND" | "FULL_REFUND" | "PROPERTY_FIX_REQUIRED" | "REQUEST_EVIDENCE" | "DISMISSED";
const OUTCOMES: { v: O; t: string; sub: string; scope?: "payments.refund" }[] = [
  { v: "FULL_REFUND", t: "Uphold — refund the renter", sub: "Rent minus Flutterwave’s reversal and transfer cost. Service and processing fees are non-refundable. Referral rewards from this payment are voided; the flat is relisted.", scope: "payments.refund" },
  { v: "NO_REFUND", t: "Not upheld — release to owner", sub: "The normal split runs (plan commission, agents’ share, owner net)." },
  { v: "PROPERTY_FIX_REQUIRED", t: "Owner must fix first", sub: "Rent stays in escrow. Decide again once the fix is confirmed." },
  { v: "REQUEST_EVIDENCE", t: "Ask both sides for evidence", sub: "48 hours to add photos or documents. Rent stays held." },
  { v: "DISMISSED", t: "Dismiss — release to owner", sub: "Invalid or withdrawn claim." },
];
const OPEN = ["PENDING", "UNDER_REVIEW", "INVESTIGATING"];

function DisputeDialog({ d, onClose }: { d: DisputeRow; onClose: () => void }) {
  const { can } = useCan();
  const [pick, setPick] = useState<O | null>(null); const [note, setNote] = useState("");
  const resolve = useAction(() => A.resolveDispute(d.id, pick!, note.trim()), { pending: "Saving decision…", success: "Decision saved", sub: "Renter, owner and agent notified." }, ["disputes", "rent"]);
  const open = OPEN.includes(d.status) && d.payment.status === "HELD";
  const canAct = can("disputes.manage") && open;
  return <Modal wide title={d.rental.property.title} sub={`${d.renter.name} vs ${d.rental.property.owner.name} · ₦${d.payment.amount.toLocaleString("en-NG")} · opened ${when(d.createdAt)}`} onClose={onClose}
    footer={canAct ? <><button className="btn btn-line" onClick={onClose}>Cancel</button><button className="btn btn-dark" disabled={!pick || note.trim().length < 8 || resolve.isPending} onClick={() => resolve.mutate(undefined, { onSuccess: onClose })}>Save decision</button></> : <button className="btn btn-dark" onClick={onClose}>Close</button>}>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}><Badge s={d.status} /><span className="badge b-grey">{d.reason.toLowerCase().replace(/_/g, " ")}</span><span className="badge b-grey">wants: {d.preferredResolution.toLowerCase().replace(/_/g, " ")}</span><span className="badge b-grey">{d._count.evidence} evidence · {d._count.comments} comments</span></div>
    <div className="banner info" style={{ marginBottom: 14 }}>{d.description}</div>
    {d.resolutionNotes && <div className="kv"><span className="k">Last note</span><span className="v">{d.resolutionNotes}</span></div>}
    {canAct ? <>
      {OUTCOMES.map((o) => { const off = o.scope && !can(o.scope); return <div key={o.v} className={`opt${pick === o.v ? " sel" : ""}`} style={off ? { opacity: .5, pointerEvents: "none" } : undefined} onClick={() => setPick(o.v)}><div><b>{o.t}</b><p>{o.sub}{off ? " · needs the Refunds permission" : ""}</p></div></div>; })}
      <div className="field"><label>Explain the decision to both parties</label><textarea className="inp" value={note} onChange={(e) => setNote(e.target.value)} /><span className="hint">Required, min 8 characters. Sent to renter, owner and listing agent.</span></div>
    </> : <p className="hint">{!open ? "This dispute is closed." : "Support can view disputes. Deciding needs disputes.manage."}</p>}
  </Modal>;
}

function IssueDialog({ j, onClose }: { j: VisitIssue; onClose: () => void }) {
  const { can, canAny } = useCan(); const [note, setNote] = useState("");
  const act = useAction((o: "REBOOK" | "CLOSE_VERIFIED") => A.resolveVisit(j.id, o, note.trim() || undefined), { pending: "Saving…", success: "Visit issue resolved" }, ["visits", "vendors"]);
  const ok = canAny(["vendors.write", "disputes.manage"]);
  return <Modal title={j.property.title} sub={`${j.serviceType.toLowerCase().replace(/_/g, " ")} · ${j.vendor?.name ?? "No vendor"} · ${when(j.scheduledFor)}`} onClose={onClose}
    footer={ok ? <><button className="btn btn-line" onClick={onClose}>Close</button>{j.verifiedAt && <button className="btn btn-line" onClick={() => act.mutate("CLOSE_VERIFIED", { onSuccess: onClose })}>Close — code was verified</button>}<button className="btn btn-dark" onClick={() => act.mutate("REBOOK", { onSuccess: onClose })}>Rebook at no cost</button></> : <button className="btn btn-dark" onClick={onClose}>Close</button>}>
    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}><Badge s={j.status} />{j.verifiedAt ? <span className="badge b-green">Code verified on site</span> : <span className="badge b-amber">No code verified</span>}</div>
    {j.issueReason && <div className="banner warn" style={{ marginBottom: 12 }}><b>Owner reported:</b>&nbsp;{j.issueReason}</div>}
    <p className="hint">A visit counts — and the vendor is paid — only when the on-site code is verified. Without it, the only option is to rebook; the scheduler picks the next funded date.</p>
    {ok && <div className="field"><label>Note (optional)</label><textarea className="inp" value={note} onChange={(e) => setNote(e.target.value)} /></div>}
    {!can("vendors.write") && !can("disputes.manage") && <p className="hint">Needs vendors.write or disputes.manage.</p>}
  </Modal>;
}

export default function Disputes() {
  const { can } = useCan();
  const [tab, setTab] = usePersistedTab<"rent" | "visits">("adm.disp", "rent");
  const [open, setOpen] = useState<DisputeRow | null>(null); const [issue, setIssue] = useState<VisitIssue | null>(null);
  return <RequireScope any={["disputes.manage", "support.tickets"]}>
    <div className="ph"><div><h1>Disputes</h1><p>Rent stays in escrow while a dispute is open.</p></div></div>
    <div style={{ marginBottom: 14 }}><Tabs value={tab} onChange={setTab} items={[{ id: "rent", label: "Rent" }, ...(can("vendors.read") ? [{ id: "visits" as const, label: "Vendor visits" }] : [])]} /></div>
    {tab === "rent" && <DataTable<DisputeRow> name="disputes" fetcher={A.disputes} onRow={setOpen}
      filters={[{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }, { value: "all", label: "All" }]}
      cols={[{ label: "Dispute", cell: (d) => <div><div className="a-name">{d.rental.property.title}{d.rental.unit ? ` · ${d.rental.unit.unitNumber}` : ""}</div><div className="a-sub">{d.reason.toLowerCase().replace(/_/g, " ")}</div></div> }, { label: "Raised by", cell: (d) => <Person name={d.renter.name} sub="renter" /> }, { label: "Held", cell: (d) => <span className="a-mono">₦{d.payment.amount.toLocaleString("en-NG")}</span> }, { label: "Opened", cell: (d) => when(d.createdAt) }, { label: "Status", cell: (d) => <Badge s={d.status} /> }]} />}
    {tab === "visits" && <DataTable<VisitIssue> name="visits" fetcher={A.visitIssues} onRow={setIssue}
      cols={[{ label: "Visit", cell: (j) => <div><div className="a-name">{j.property.title}</div><div className="a-sub">{j.serviceType.toLowerCase().replace(/_/g, " ")} · {j.property.owner.name}</div></div> }, { label: "Vendor", cell: (j) => j.vendor?.name ?? "—" }, { label: "Scheduled", cell: (j) => when(j.scheduledFor) }, { label: "Status", cell: (j) => <Badge s={j.status} /> }]} />}
    {open && <DisputeDialog d={open} onClose={() => setOpen(null)} />}
    {issue && <IssueDialog j={issue} onClose={() => setIssue(null)} />}
  </RequireScope>;
}
