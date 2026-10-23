"use client";
// apps/admin/app/(dashboard)/vendors/[id]/page.tsx — approve/suspend, assigned properties (assign via
// eligible-property picker, remove → auto re-match), visits (rebook via the scheduler), payouts, act as vendor.
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, Eye, Check } from "lucide-react";
import { A, type EligibleProperty, type VendorDetail } from "@/lib/api/admin";
import { useOne, useAction } from "@/hooks/useAdmin";
import { Can, RequireScope, useCan } from "@/components/auth/Can";
import { naira, when } from "@/components/ui/DataTable";
import { Badge, Confirm, Empty, Modal, SkeletonRows, Stat } from "@/components/ui/primitives";
import { ImpersonateDialog } from "@/components/users/ImpersonateDialog";

const svc = (s: string) => s.toLowerCase().replace(/_/g, " ");

function AssignDialog({ v, onClose }: { v: VendorDetail; onClose: () => void }) {
  const [q, setQ] = useState(""); const [rows, setRows] = useState<EligibleProperty[] | null>(null); const [pick, setPick] = useState<string[]>([]);
  useEffect(() => { const t = setTimeout(() => A.eligibleProperties(v.id, q || undefined).then(setRows).catch(() => setRows([])), 250); return () => clearTimeout(t); }, [q, v.id]);
  const assign = useAction(() => A.assignProperties(v.id, pick), { pending: "Assigning…", success: "Assignment saved", sub: "Visits are booked only on dates the owner’s plan has funded." }, ["vendors"]);
  const free = Math.max(0, v.maxClients - v.assignments.length);
  return <Modal wide title="Assign properties" sub={`${v.name} · ${v.services.map(svc).join(", ")} · ${free} slot(s) free`} onClose={onClose}
    footer={<><button className="btn btn-line" onClick={onClose}>Cancel</button><button className="btn btn-dark" disabled={!pick.length || pick.length > free || assign.isPending} onClick={() => assign.mutate(undefined, { onSuccess: (r) => { const f = (r as { failed: { message: string }[] }).failed; if (!f.length) onClose(); } })}>Assign {pick.length || ""}</button></>}>
    <p className="hint" style={{ margin: "0 0 10px" }}>Only marked properties on an active plan whose services this vendor offers. A property has one vendor per service — assigning here moves it from the current vendor, and that vendor is never auto-matched back.</p>
    <input className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by property, area or address" />
    <div className="card tight" style={{ marginTop: 10, maxHeight: 340, overflow: "auto" }}>
      {rows === null ? <SkeletonRows n={3} /> : rows.length === 0 ? <Empty title="No eligible properties" sub="Try another search." /> : rows.map((p) => { const on = pick.includes(p.id); return <div key={p.id} className="prow" onClick={() => setPick((x) => on ? x.filter((y) => y !== p.id) : [...x, p.id])}>
        <span className={`chk${on ? " on" : ""}`}>{on && <Check size={12} strokeWidth={3} />}</span>
        <div className="prow-b"><div className="prow-t">{p.title}</div><div className="prow-s">{p.city} · {p.owner} · {p.services.map(svc).join(", ")}</div></div>
        {p.movesFrom.length > 0 && <span className="badge b-amber">Moves from {p.movesFrom.join(", ")}</span>}
      </div>; })}
    </div>
    {pick.length > free && <p className="err-msg" style={{ marginTop: 8 }}>Over capacity — this vendor has {free} free slot(s).</p>}
  </Modal>;
}

function ReasonModal({ title, sub, label, onSubmit, onClose }: { title: string; sub: string; label: string; onSubmit: (r: string) => void; onClose: () => void }) {
  const [r, setR] = useState("");
  return <Modal title={title} sub={sub} onClose={onClose} footer={<><button className="btn btn-line" onClick={onClose}>Cancel</button><button className="btn btn-dark" disabled={r.trim().length < 8} onClick={() => { onSubmit(r.trim()); onClose(); }}>{label}</button></>}>
    <div className="field"><label>Reason</label><textarea className="inp" autoFocus value={r} onChange={(e) => setR(e.target.value)} /><span className="hint">Min 8 characters. Logged and shared with the people affected.</span></div>
  </Modal>;
}

function VendorView({ id }: { id: string }) {
  const { me } = useCan();
  const { data: v, isLoading, error } = useOne<VendorDetail>("vendors", id, A.vendor);
  const [modal, setModal] = useState<null | "assign" | "suspend" | "imp" | { remove: VendorDetail["assignments"][number] } | { rebook: VendorDetail["jobs"][number] }>(null);
  const status = useAction((a: { s: "VERIFIED" | "SUSPENDED"; reason?: string }) => A.setVendorStatus(id, a.s, a.reason), { pending: "Updating vendor…", success: "Vendor updated", sub: "Matching re-runs for their properties." }, ["vendors"]);
  const remove = useAction((pid: string) => A.removeProperty(id, pid), { pending: "Removing…", success: "Removed — re-matched to the nearest available vendor" }, ["vendors", "properties"]);
  const rebook = useAction((a: { jobId: string; reason: string }) => A.rebookVisit(a.jobId, a.reason), { pending: "Rebooking…", success: "Visit rebooked", sub: "Owner and vendor notified of the new date." }, ["vendors"]);
  if (error) return <Empty title="Couldn’t load this vendor" sub={(error as Error).message} />;
  if (isLoading || !v) return <SkeletonRows n={5} />;
  const canApprove = !!v.accountMasked && !!v.bankVerifiedAt && v.areas.length > 0;
  return <>
    <Link href="/vendors" className="a-back"><ArrowLeft size={15} />All vendors</Link>
    <div className="a-detail-h" style={{ marginBottom: 18 }}>
      <div style={{ minWidth: 0 }}><h1>{v.name}</h1><div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}><Badge s={v.status} /><span className="badge b-grey">{v.kind === "COMPANY" ? "Company" : "Individual"}</span>{v.services.map((s) => <span key={s} className="badge b-grey">{svc(s)}</span>)}</div></div>
      <div className="ph-actions">
        <Can scope="vendors.write">{v.status !== "VERIFIED" ? <button className="btn btn-dark btn-sm" disabled={!canApprove} title={canApprove ? undefined : "Needs a verified bank account and at least one service area"} onClick={() => status.mutate({ s: "VERIFIED" })}><Check size={15} />{v.status === "PENDING" ? "Approve vendor" : "Restore"}</button> : <button className="btn btn-line btn-sm" onClick={() => setModal("suspend")}>Suspend</button>}</Can>
        <Can scope="users.impersonate"><button className="btn btn-line btn-sm" disabled={!!me?.impersonating || v.status !== "VERIFIED" || !v.userId} onClick={() => setModal("imp")}><Eye size={15} />Act as vendor</button></Can>
      </div>
    </div>
    {v.status === "PENDING" && !canApprove && <div className="banner warn" style={{ marginBottom: 14 }}>Can’t approve yet: {[!v.bankVerifiedAt && "no verified payout bank account", !v.areas.length && "no service area"].filter(Boolean).join(" · ")}.</div>}
    <div className="grid g-stats" style={{ marginBottom: 16 }}>
      <Stat label="Clients" value={`${v.assignments.length}/${v.maxClients}`} sub={`${v.capacityPerDay} visits/day max`} />
      <Stat label="Payout timing" value={v.releaseMode === "INSTANT" ? "Instant" : "End of day"} sub={v.bankName ? `${v.bankName} ${v.accountMasked ?? ""}` : "No bank yet"} />
      <Stat label="Rating" value={v.rating ? v.rating.toFixed(1) : "—"} />
      <Stat label="Last seen" value={when(v.lastSeenAt)} sub={v.lastDevice ?? ""} />
    </div>
    <div className="card tight" style={{ marginBottom: 16 }}>
      <div className="card-h" style={{ padding: "18px 20px 0" }}><h3>Assigned properties</h3><Can scope="vendors.write">{v.status === "VERIFIED" && <button className="btn btn-dark btn-sm" onClick={() => setModal("assign")}><Plus size={15} />Assign</button>}</Can></div>
      <p className="hint" style={{ padding: "6px 20px 10px", margin: 0 }}>Visits only run while the property’s plan is active; a paused plan pauses its visits.</p>
      {v.assignments.length === 0 ? <Empty title="No properties yet" sub={v.status === "VERIFIED" ? "Assign manually or let proximity matching fill this." : "Approve the vendor first."} />
        : v.assignments.map((a) => <div key={a.id} className="prow"><div className="prow-b"><Link href={`/properties/${a.property.id}`} className="prow-t">{a.property.title}</Link><div className="prow-s">{a.property.city} · {a.property.owner.name} · {svc(a.serviceType)}{a.distanceKm != null ? ` · ${a.distanceKm} km` : ""}</div></div>{a.status === "PAUSED" && <span className="badge b-amber">Plan paused</span>}<Can scope="vendors.write"><button className="btn btn-ghost btn-sm" onClick={() => setModal({ remove: a })}><X size={14} />Remove</button></Can></div>)}
    </div>
    <div className="card tight" style={{ marginBottom: 16 }}><div className="card-h" style={{ padding: "18px 20px 6px" }}><h3>Visits</h3></div>
      {v.jobs.length === 0 ? <Empty title="No visits" /> : <div className="a-scroll"><table className="tbl a-tbl"><thead><tr><th>Property</th><th>Service</th><th>When</th><th>Code</th><th>Status</th><th /></tr></thead><tbody>
        {v.jobs.map((j) => <tr key={j.id}><td data-l="Property">{j.property.title}</td><td data-l="Service">{svc(j.serviceType)}</td><td data-l="When">{when(j.scheduledFor)}</td><td data-l="Code">{j.verifiedAt ? <span className="badge b-green">Verified</span> : <span className="hint">—</span>}</td><td data-l="Status"><Badge s={j.status} /></td>
          <td data-l="" style={{ textAlign: "right" }}><Can scope="vendors.write">{!j.verifiedAt && ["SCHEDULED", "RESCHEDULE_REQUESTED", "MISSED", "ISSUE", "PAUSED"].includes(j.status) && <button className="btn btn-line btn-sm" onClick={() => setModal({ rebook: j })}>Rebook</button>}</Can></td></tr>)}
      </tbody></table></div>}
    </div>
    <div className="card tight"><div className="card-h" style={{ padding: "18px 20px 6px" }}><h3>Payout batches</h3></div>
      {v.payouts.length === 0 ? <Empty title="No payouts yet" /> : v.payouts.map((b) => <div key={b.id} className="prow"><div className="prow-b"><div className="prow-t a-mono">{b.reference}</div><div className="prow-s">{b.jobCount} visit(s) · {when(b.createdAt)}</div></div><span className="a-mono">{naira(b.amountKobo)}</span><Badge s={b.status} /></div>)}
    </div>
    {modal === "imp" && v.userId && <ImpersonateDialog user={{ id: v.userId, name: v.name }} onClose={() => setModal(null)} />}
    {modal === "assign" && <AssignDialog v={v} onClose={() => setModal(null)} />}
    {modal === "suspend" && <ReasonModal title="Suspend this vendor?" sub="Every property they service is re-matched to another vendor nearby and future visits are rebooked. Completed visits and payouts are unaffected." label="Suspend" onSubmit={(reason) => status.mutate({ s: "SUSPENDED", reason })} onClose={() => setModal(null)} />}
    {modal && typeof modal === "object" && "remove" in modal && <Confirm title={`Remove ${modal.remove.property.title}?`} body="Future visits are cancelled for this vendor and the property is re-matched to the nearest other vendor. This vendor won’t be auto-matched back to it." confirmLabel="Remove & re-match" danger onConfirm={() => remove.mutate(modal.remove.property.id)} onClose={() => setModal(null)} />}
    {modal && typeof modal === "object" && "rebook" in modal && <ReasonModal title="Rebook this visit?" sub="The scheduler picks the next date inside the owner’s service window (no Fridays or Sundays) that their plan has funded." label="Rebook" onSubmit={(reason) => rebook.mutate({ jobId: modal.rebook.id, reason })} onClose={() => setModal(null)} />}
  </>;
}

export default function VendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RequireScope scope="vendors.read"><VendorView id={id} /></RequireScope>;
}
