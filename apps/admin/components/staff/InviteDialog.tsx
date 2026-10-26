"use client";
// apps/admin/components/staff/InviteDialog.tsx — Emails → Role → Permissions → Review → send.
import { useState } from "react";
import { ArrowRight, Send, X, AlertTriangle } from "lucide-react";
import { ADMIN_ROLES, INVITABLE_ADMIN_ROLES, resolveAdminScopes, type AdminRole } from "@/lib/scopes";
import { A } from "@/lib/api/admin";
import { useAction } from "@/hooks/useAdmin";
import { Modal } from "@/components/ui/primitives";
import { ScopeEditor, type ScopeDelta } from "./ScopeEditor";

const STEPS = ["Emails", "Role", "Permissions", "Review"];
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export function InviteDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [emails, setEmails] = useState<string[]>([]); const [draft, setDraft] = useState(""); const [err, setErr] = useState("");
  const [role, setRole] = useState<AdminRole>("SUPPORT");
  const [delta, setDelta] = useState<ScopeDelta>({ granted: [], revoked: [] });
  const send = useAction(A.invite, { pending: "Sending invites…", success: "Invites sent", sub: "Each link expires in 72 hours." }, ["staff"]);
  const add = () => { const list = draft.split(/[\s,;]+/).map((x: string) => x.trim().toLowerCase()).filter(Boolean); const bad = list.find((x: string) => !isEmail(x)); if (bad) { setErr(`“${bad}” isn’t a valid email`); return; } const merged = Array.from(new Set([...emails, ...list])); if (merged.length > 20) { setErr("Up to 20 people per invite"); return; } setEmails(merged); setDraft(""); setErr(""); };
  const next = () => { if (step === 0) { if (draft.trim()) return add(); if (!emails.length) return setErr("Add at least one email"); } setStep(step + 1); };
  const eff = resolveAdminScopes(role, delta.granted, delta.revoked);
  return <Modal wide title="Invite staff" sub="Add people to the Newcondo admin team." onClose={onClose}
    footer={<>{step > 0 ? <button className="btn btn-line" onClick={() => setStep(step - 1)}>Back</button> : <button className="btn btn-line" onClick={onClose}>Cancel</button>}
      {step < 3 ? <button className="btn btn-dark" onClick={next}>Continue<ArrowRight size={15} /></button>
        : <button className="btn btn-dark" disabled={send.isPending} onClick={() => send.mutate({ emails, role, ...delta }, { onSuccess: onClose })}><Send size={15} />Send invite{emails.length > 1 ? "s" : ""}</button>}</>}>
    <div className="a-steps">{STEPS.map((l, i) => <span key={l} className={i <= step ? "on" : ""}>{i + 1}. {l}</span>)}</div>
    {step === 0 && <div className="field"><label>Email addresses</label>
      <div style={{ display: "flex", gap: 8 }}><input className={`inp${err ? " err" : ""}`} autoFocus value={draft} onChange={(e) => { setDraft(e.target.value); setErr(""); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} placeholder="name@newcondo.homes" /><button className="btn btn-line" onClick={add}>Add</button></div>
      {err ? <span className="err-msg"><AlertTriangle size={13} />{err}</span> : <span className="hint">Paste several at once. Everyone in this invite gets the same role.</span>}
      {emails.length > 0 && <div className="a-email-row">{emails.map((e: string) => <span key={e} className="a-email">{e}<button onClick={() => setEmails((x) => x.filter((y) => y !== e))} aria-label="Remove"><X size={12} /></button></span>)}</div>}
    </div>}
    {step === 1 && <div>{INVITABLE_ADMIN_ROLES.map((k: AdminRole) => <div key={k} className={`opt${role === k ? " sel" : ""}`} onClick={() => { setRole(k); setDelta({ granted: [], revoked: [] }); }}>
      <div><b>{ADMIN_ROLES[k].label}</b><p>{ADMIN_ROLES[k].desc} · {ADMIN_ROLES[k].scopes.length} permissions</p></div></div>)}</div>}
    {step === 2 && <><p className="hint" style={{ margin: "0 0 12px" }}>Starts from the <b>{ADMIN_ROLES[role].label}</b> defaults. Tick to add, untick to remove.</p><ScopeEditor role={role} value={delta} onChange={setDelta} /></>}
    {step === 3 && <div>
      <div className="kv"><span className="k">Inviting</span><span className="v">{emails.join(", ")}</span></div>
      <div className="kv"><span className="k">Role</span><span className="v">{ADMIN_ROLES[role].label}</span></div>
      <div className="kv"><span className="k">Permissions</span><span className="v">{eff.length}{delta.granted.length ? ` · ${delta.granted.length} added` : ""}{delta.revoked.length ? ` · ${delta.revoked.length} removed` : ""}</span></div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>{eff.map((k: string) => <span key={k} className={`badge ${delta.granted.includes(k) ? "b-green" : "b-grey"}`}>{k}</span>)}</div>
    </div>}
  </Modal>;
}
