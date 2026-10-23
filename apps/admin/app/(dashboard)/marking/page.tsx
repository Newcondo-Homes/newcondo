"use client";
// apps/admin/app/(dashboard)/marking/page.tsx
// Every marking request. Staff can: assign a NewCondo field marker (NEWCONDO jobs only, paid),
// move a broadcast queue on, resolve a marking dispute (uphold → marker paid via confirmation;
// re-mark → held payout reversed, job re-opened), or unlock a confirmed mark for re-marking.
import { useEffect, useState } from "react";
import { A, type MarkingJob, type FieldMarker } from "@/lib/api/admin";
import { useAction } from "@/hooks/useAdmin";
import { Can, RequireScope } from "@/components/auth/Can";
import { DataTable, Person, when } from "@/components/ui/DataTable";
import { Badge, Modal, Confirm } from "@/components/ui/primitives";

const METHOD: Record<string, string> = { SELF: "Marked by owner", KNOWN_PERSON: "Someone they know (link)", BROADCAST: "Broadcast to nearby agents", NEWCONDO: "NewCondo field team" };
const PAYOUT: Record<string, string> = { BROADCAST: "Marker earns ₦5,000 (₦1,000 held on completion, ₦4,000 on confirmation)", NEWCONDO: "Field team is salaried — NewCondo keeps the full fee", SELF: "Free", KNOWN_PERSON: "Free" };

function MarkerPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [q, setQ] = useState(""); const [rows, setRows] = useState<FieldMarker[]>([]);
  useEffect(() => { const t = setTimeout(() => A.fieldMarkers(q || undefined).then(setRows).catch(() => setRows([])), 250); return () => clearTimeout(t); }, [q]);
  return <div className="field"><label>Field marker</label>
    <input className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the field team by name or city" />
    <div className="card tight" style={{ marginTop: 8, maxHeight: 220, overflow: "auto" }}>
      {rows.length === 0 ? <p className="hint" style={{ padding: 12, margin: 0 }}>No field markers found. Flag verified agent accounts as field markers from their user page.</p>
        : rows.map((m) => <div key={m.id} className="prow" onClick={() => onChange(m.id)} style={value === m.id ? { background: "var(--surface-sunken)" } : undefined}>
          <div className="prow-b"><div className="prow-t">{m.name}</div><div className="prow-s">{m.area || "—"} · {m.openJobs} open job(s)</div></div>{value === m.id && <span className="badge b-ink">Selected</span>}</div>)}
    </div>
    <span className="hint">They get the address and contact person once assigned.</span>
  </div>;
}

function JobDialog({ j, onClose }: { j: MarkingJob; onClose: () => void }) {
  const [markerId, setMarkerId] = useState(""); const [note, setNote] = useState("");
  const [conf, setConf] = useState<"rotate" | "remark" | "uphold" | "redo" | null>(null);
  const inv = ["marking"];
  const assign = useAction(() => A.assignMarker(j.id, markerId), { pending: "Assigning…", success: "Marker assigned", sub: "Marker and owner notified." }, inv);
  const rotate = useAction(() => A.rotateQueue(j.id), { pending: "Moving the queue…", success: "Queue moved on" }, inv);
  const uphold = useAction(() => A.resolveMarking(j.id, "UPHOLD_MARKER", note || undefined), { pending: "Confirming…", success: "Marking confirmed", sub: "Marker paid; boundary verified." }, inv);
  const redo = useAction(() => A.resolveMarking(j.id, "REMARK", note || undefined), { pending: "Re-opening…", success: "Job re-opened", sub: "Held payout returned to escrow." }, inv);
  const remark = useAction(() => A.allowRemark(j.property.id), { pending: "Unlocking…", success: "Re-marking allowed", sub: "The property is hidden until re-marked." }, [...inv, "properties"]);
  const canAssign = j.method === "NEWCONDO" && j.paid && ["QUEUED", "ASSIGNED"].includes(j.status);
  return <Modal wide title={j.property.title} sub={`${METHOD[j.method]} · requested by ${j.requester.name} · ${when(j.createdAt)}`} onClose={onClose}
    footer={<><button className="btn btn-line" onClick={onClose}>Close</button>
      <Can scope="marking.manage">{j.method === "BROADCAST" && j.status === "ASSIGNED" && <button className="btn btn-line" onClick={() => setConf("rotate")}>Skip to next in queue</button>}</Can>
      <Can scope="marking.verify">{j.status === "DISPUTED" && <><button className="btn btn-line" onClick={() => setConf("redo")}>Owner is right — re-mark</button><button className="btn btn-dark" onClick={() => setConf("uphold")}>Marker is right — confirm</button></>}</Can>
      <Can scope="marking.verify">{j.status === "COMPLETED" && <button className="btn btn-line" onClick={() => setConf("remark")}>Allow re-marking</button>}</Can>
      <Can scope="marking.manage">{canAssign && <button className="btn btn-dark" disabled={!markerId || assign.isPending} onClick={() => assign.mutate(undefined, { onSuccess: onClose })}>{j.marker ? "Reassign" : "Assign"} marker</button>}</Can></>}>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}><Badge s={j.status} />{j.feeNaira > 0 && <span className={`badge ${j.paid ? "b-grey" : "b-amber"}`}>₦{j.feeNaira.toLocaleString("en-NG")} · {j.paid ? "paid" : "not paid"}</span>}{j.queue > 0 && <span className="badge b-grey">{j.queue} in queue</span>}</div>
    {[["Marker", j.marker?.name ?? "Unassigned"], ["Payout", PAYOUT[j.method]], ["Contact on site", j.contact || "—"], ...(j.slotEndsAt ? [["Slot ends", when(j.slotEndsAt)]] : []), ...(j.confirmBy ? [["Owner confirms by", when(j.confirmBy)]] : [])].map(([k, v]) => <div key={k} className="kv"><span className="k">{k}</span><span className="v">{v}</span></div>)}
    {j.status === "DISPUTED" && <div className="banner warn" style={{ marginTop: 12 }}><b>Owner’s dispute:</b>&nbsp;{j.disputeReason ?? "No reason given"}</div>}
    {j.status === "DISPUTED" && <div className="field" style={{ marginTop: 12 }}><label>Note to owner and marker (optional)</label><textarea className="inp" value={note} onChange={(e) => setNote(e.target.value)} /></div>}
    {!j.paid && j.feeNaira > 0 && <p className="hint" style={{ marginTop: 10 }}>Waiting for the owner’s payment. Nothing can be assigned until it settles.</p>}
    <Can scope="marking.manage">{canAssign && <div style={{ marginTop: 14 }}><MarkerPicker value={markerId} onChange={setMarkerId} /></div>}</Can>
    {conf === "rotate" && <Confirm title="Skip to the next marker?" body={`${j.marker?.name} loses this slot now and the next marker in the queue gets a fresh 3-hour window.`} confirmLabel="Skip & notify next" onConfirm={() => rotate.mutate(undefined)} onClose={() => setConf(null)} />}
    {conf === "uphold" && <Confirm title="Confirm the marking?" body="The boundary becomes verified and the marker is paid in full, exactly as if the owner had confirmed." confirmLabel="Confirm & pay marker" onConfirm={() => uphold.mutate(undefined, { onSuccess: onClose })} onClose={() => setConf(null)} />}
    {conf === "redo" && <Confirm title="Re-open this job?" body="The marker isn’t paid: the ₦1,000 hold goes back to escrow, the boundary is cleared and the job goes back to the queue at no extra cost to the owner. Blocked if the marker was already paid part of it." confirmLabel="Re-open job" danger onConfirm={() => redo.mutate(undefined, { onSuccess: onClose })} onClose={() => setConf(null)} />}
    {conf === "remark" && <Confirm title="Allow re-marking?" body="The confirmed boundary is removed from the map and the property leaves Browse until it is re-marked and confirmed. Tenancies and payments are unaffected." confirmLabel="Allow re-marking" danger onConfirm={() => remark.mutate(undefined, { onSuccess: onClose })} onClose={() => setConf(null)} />}
  </Modal>;
}

export default function Marking() {
  const [open, setOpen] = useState<MarkingJob | null>(null);
  return <RequireScope scope="marking.read">
    <div className="ph"><div><h1>Marking</h1><p>Every request to mark a property — and who is on it right now.</p></div></div>
    <DataTable<MarkingJob> name="marking" fetcher={A.marking} onRow={setOpen}
      filters={[{ value: "all", label: "All" }, { value: "new", label: "To assign" }, { value: "live", label: "Live" }, { value: "disputed", label: "Disputed" }, { value: "unpaid", label: "Unpaid" }, { value: "done", label: "Completed" }]}
      cols={[
        { label: "Job", cell: (j) => <div><div className="a-name">{j.property.title}</div><div className="a-sub">{j.property.city} · {when(j.createdAt)}</div></div> },
        { label: "Requested by", cell: (j) => <Person name={j.requester.name} sub={j.requester.role.toLowerCase()} /> },
        { label: "Route", cell: (j) => METHOD[j.method] },
        { label: "Marker", cell: (j) => j.marker?.name ?? <span className="hint">Unassigned</span> },
        { label: "Status", cell: (j) => <Badge s={j.status} /> },
      ]} />
    {open && <JobDialog j={open} onClose={() => setOpen(null)} />}
  </RequireScope>;
}
