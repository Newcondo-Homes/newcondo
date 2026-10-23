"use client";
// apps/admin/app/(dashboard)/approvals/page.tsx — Identity (one card per person) · Listings (ownership + consent + marked boundary).
// Approve is disabled while the server reports blockers; the server enforces the same rules.
import { useState } from "react";
import { Check, AlertTriangle, ExternalLink } from "lucide-react";
import { A, type Approval } from "@/lib/api/admin";
import { useAction } from "@/hooks/useAdmin";
import { useCan, Locked } from "@/components/auth/Can";
import { DataTable, Person, when } from "@/components/ui/DataTable";
import { Modal, Tabs, usePersistedTab } from "@/components/ui/primitives";
import type { AdminScope } from "@/lib/scopes";

type K = "identity" | "listing";
const TABS: { id: K; label: string; scope: AdminScope; hint: string; fetcher: typeof A.identityQueue }[] = [
  { id: "identity", label: "Identity", scope: "verification.review", hint: "A person is verified only when a government ID and a selfie are both approved. Document numbers are masked; images open for 5 minutes.", fetcher: A.identityQueue },
  { id: "listing", label: "Listings", scope: "listings.review", hint: "Before a listing goes live: verified owner, proof of ownership (and consent, for agent listings), and a marked boundary the owner confirmed. Check the mask covers only this building.", fetcher: A.listingQueue },
];

function Review({ kind, a, onClose }: { kind: K; a: Approval; onClose: () => void }) {
  const [rejecting, setRejecting] = useState(false); const [reason, setReason] = useState(""); const [remark, setRemark] = useState(false);
  const act = useAction((approve: boolean) => A.decide(kind, a.id, { approve, ...(approve ? {} : { reason: reason.trim(), allowRemark: remark }) }), { pending: "Saving decision…", success: "Decision saved", sub: `${a.who.name ?? "The user"} has been notified.` }, ["approvals:" + kind]);
  const blocked = a.blockers.length > 0;
  return <Modal wide title={a.label} sub={`${a.who.name} · ${a.who.role.toLowerCase()} · submitted ${when(a.submittedAt)}`} onClose={onClose}
    footer={rejecting ? <><button className="btn btn-line" onClick={() => setRejecting(false)}>Back</button><button className="btn btn-danger" disabled={reason.trim().length < 8 || act.isPending} onClick={() => act.mutate(false, { onSuccess: onClose })}>Reject &amp; notify</button></>
      : <><button className="btn btn-line" onClick={() => setRejecting(true)}>Reject</button><button className="btn btn-dark" disabled={blocked || act.isPending} title={blocked ? "Resolve the items above first" : undefined} onClick={() => act.mutate(true, { onSuccess: onClose })}><Check size={15} />Approve</button></>}>
    {blocked && <div className="banner warn" style={{ marginBottom: 12 }}><span className="b-ic"><AlertTriangle size={16} /></span><span><b>Can’t approve yet:</b> {a.blockers.join(" · ")}</span></div>}
    {a.marking && <div className="grid g-2" style={{ gap: 10, marginBottom: 10 }}>
      <div className="a-doc">{a.marking.snapshotUrl ? <img src={a.marking.snapshotUrl} alt="Satellite snapshot" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }} /> : "No satellite snapshot"}</div>
      <div className="a-doc">{a.marking.maskUrl ? <img src={a.marking.maskUrl} alt="Marked boundary" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }} /> : "No mask image"}</div>
    </div>}
    {a.marking && <div className="kv"><span className="k">Marked by</span><span className="v">{a.marking.markedBy ?? (a.marking.method === "SELF" ? "Owner (self)" : "—")} · {a.marking.method?.toLowerCase().replace("_", " ") ?? "not marked"}</span></div>}
    <div className="grid g-2" style={{ gap: 10, marginTop: 10 }}>{a.documents.map((d) => <a key={d.id} className="a-doc" href={d.url ?? undefined} target="_blank" rel="noreferrer noopener" style={{ textDecoration: "none" }}>
      {d.url && /\.(png|jpe?g|webp)(\?|$)/i.test(d.url) ? <img src={d.url} alt={d.type} style={{ width: "100%", height: "70%", objectFit: "cover", borderRadius: 12 }} /> : <ExternalLink size={20} />}
      <span>{d.type.replace(/_/g, " ").toLowerCase()}{d.side ? ` · ${d.side.toLowerCase()}` : ""}{d.numberMasked ? ` · ${d.numberMasked}` : ""}</span>
    </a>)}</div>
    {a.note && <div className="banner info" style={{ marginTop: 12 }}>{a.note}</div>}
    {rejecting && <div style={{ marginTop: 14 }}>
      <div className="field"><label>Reason for rejecting</label><textarea className="inp" autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder={kind === "identity" ? "e.g. Selfie is blurred — please retake in daylight." : "e.g. Certificate of Occupancy name doesn’t match the owner."} /><span className="hint">Sent to the user. Be specific so they can fix it in one go. Min 8 characters.</span></div>
      {kind === "listing" && <label className="chk-row" onClick={() => setRemark(!remark)}><span className={`chk${remark ? " on" : ""}`}>{remark && <Check size={12} strokeWidth={3} />}</span>The marked boundary is also wrong — clear it so the property is marked again</label>}
    </div>}
  </Modal>;
}

export default function Approvals() {
  const { can } = useCan();
  const tabs = TABS.filter((t) => can(t.scope));
  const [tab, setTab] = usePersistedTab<K>("adm.appr", tabs[0]?.id ?? "identity");
  const [open, setOpen] = useState<Approval | null>(null);
  if (!tabs.length) return <Locked scope="verification.review" />;
  const cur = tabs.find((t) => t.id === tab) ?? tabs[0];
  return <>
    <div className="ph"><div><h1>Approvals</h1><p>Oldest first. Every decision notifies the user by dashboard and email.</p></div></div>
    <div style={{ marginBottom: 12 }}><Tabs value={cur.id} onChange={setTab} items={tabs.map((t) => ({ id: t.id, label: t.label }))} /></div>
    <p className="hint" style={{ margin: "0 0 12px" }}>{cur.hint}</p>
    <DataTable<Approval> key={cur.id} name={"approvals:" + cur.id} fetcher={cur.fetcher} onRow={setOpen} empty="Queue is clear"
      cols={[
        { label: "Submitted by", cell: (a) => <Person name={a.who.name} sub={`${a.who.role.toLowerCase()} · ${a.who.verification.toLowerCase()}`} /> },
        { label: "What", cell: (a) => <div><div style={{ fontWeight: 600 }}>{a.label}</div>{a.note && <div className="a-sub">{a.note}</div>}</div> },
        { label: "Ready", cell: (a) => a.blockers.length ? <span className="badge b-amber">{a.blockers.length} blocker{a.blockers.length > 1 ? "s" : ""}</span> : <span className="badge b-green">Ready</span> },
        { label: "Submitted", cell: (a) => <span className="hint">{when(a.submittedAt)}</span> },
        { label: "", right: true, cell: () => <button className="btn btn-line btn-sm">Review</button> },
      ]} />
    {open && <Review kind={cur.id} a={open} onClose={() => setOpen(null)} />}
  </>;
}
