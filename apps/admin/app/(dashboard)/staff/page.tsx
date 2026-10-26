"use client";
// apps/admin/app/(dashboard)/staff/page.tsx — invite, edit permissions, freeze/unfreeze, resend/revoke invites.
import { useState } from "react";
import { Plus } from "lucide-react";
import { A, type StaffRow } from "@/lib/api/admin";
import { useAction } from "@/hooks/useAdmin";
import { RequireScope } from "@/components/auth/Can";
import { DataTable, Person, when } from "@/components/ui/DataTable";
import { Badge, Confirm, Modal, Select } from "@/components/ui/primitives";
import { InviteDialog } from "@/components/staff/InviteDialog";
import { ScopeEditor, type ScopeDelta } from "@/components/staff/ScopeEditor";
import { ADMIN_ROLES, INVITABLE_ADMIN_ROLES, resolveAdminScopes, type AdminRole } from "@/lib/scopes";

function StaffDialog({ st, onClose }: { st: StaffRow; onClose: () => void }) {
  const [role, setRole] = useState<AdminRole>(st.role);
  const [delta, setDelta] = useState<ScopeDelta>({ granted: st.granted, revoked: st.revoked });
  const [conf, setConf] = useState<"freeze" | "revoke" | null>(null);
  const invite = st.status === "INVITED"; const inviteId = st.id.replace(/^inv_/, "");
  const locked = st.role === "SUPER_ADMIN" || st.isSelf || invite;
  const save = useAction(() => A.setScopes(st.id, { role, ...delta }), { pending: "Saving permissions…", success: "Permissions updated", sub: "Takes effect on their next request." }, ["staff"]);
  const freeze = useAction(() => A.setFrozen(st.id, st.status !== "FROZEN"), { pending: "Updating…", success: st.status === "FROZEN" ? "Account unfrozen" : "Account frozen — signed out everywhere" }, ["staff"]);
  const resend = useAction(() => A.resendInvite(inviteId), { pending: "Re-sending…", success: "Invite re-sent", sub: "The old link no longer works." }, ["staff"]);
  const revoke = useAction(() => A.revokeInvite(inviteId), { pending: "Revoking…", success: "Invite revoked" }, ["staff"]);
  const dirty = role !== st.role || JSON.stringify(delta) !== JSON.stringify({ granted: st.granted, revoked: st.revoked });
  return <Modal wide title={st.name ?? st.email} sub={invite ? `Invite expires ${when(st.inviteExpiresAt)}` : `${st.email} · last active ${when(st.lastActiveAt)}`} onClose={onClose}
    footer={invite ? <><button className="btn btn-line" onClick={() => setConf("revoke")}>Revoke invite</button><button className="btn btn-dark" onClick={() => resend.mutate(undefined)}>Resend</button></>
      : locked ? <button className="btn btn-dark" onClick={onClose}>Close</button>
      : <><button className="btn btn-line" onClick={() => setConf("freeze")}>{st.status === "FROZEN" ? "Unfreeze" : "Freeze account"}</button><button className="btn btn-dark" disabled={!dirty} onClick={() => save.mutate(undefined, { onSuccess: onClose })}>Save permissions</button></>}>
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}><Badge s={st.status} /><span className="badge b-ink">{ADMIN_ROLES[st.role].label}</span></div>
    {locked && !invite ? <div className="banner info" style={{ marginBottom: 12 }}>{st.role === "SUPER_ADMIN" ? "Super admin always has every permission and can’t be frozen." : "You can’t change your own permissions."}</div>
      : !invite && <div className="field"><label>Role</label><Select value={role} onChange={(v) => { setRole(v as AdminRole); setDelta({ granted: [], revoked: [] }); }} options={INVITABLE_ADMIN_ROLES.map((k: AdminRole) => ({ value: k, label: `${ADMIN_ROLES[k].label} — ${ADMIN_ROLES[k].desc}` }))} /><span className="hint">Changing the role resets custom additions and removals.</span></div>}
    <ScopeEditor role={role} value={delta} onChange={setDelta} readOnly={locked} />
    {conf === "freeze" && <Confirm title={st.status === "FROZEN" ? "Unfreeze this account?" : "Freeze this account?"} body={st.status === "FROZEN" ? "They can sign in again with the same permissions." : "Signed out of every device right away. Audit history stays."} confirmLabel={st.status === "FROZEN" ? "Unfreeze" : "Freeze"} onConfirm={() => freeze.mutate(undefined, { onSuccess: onClose })} onClose={() => setConf(null)} />}
    {conf === "revoke" && <Confirm title="Revoke this invite?" body="The link stops working immediately." confirmLabel="Revoke" onConfirm={() => revoke.mutate(undefined, { onSuccess: onClose })} onClose={() => setConf(null)} />}
  </Modal>;
}

export default function Staff() {
  const [invite, setInvite] = useState(false); const [open, setOpen] = useState<StaffRow | null>(null);
  return <RequireScope scope="staff.manage">
    <div className="ph"><div><h1>Staff &amp; access</h1><p>Who can do what in this dashboard. Every change is logged.</p></div><div className="ph-actions"><button className="btn btn-dark" onClick={() => setInvite(true)}><Plus size={16} />Invite staff</button></div></div>
    <DataTable<StaffRow> name="staff" fetcher={A.staff} onRow={setOpen}
      filters={[{ value: "all", label: "All" }, { value: "ACTIVE", label: "Active" }, { value: "INVITED", label: "Invited" }, { value: "FROZEN", label: "Frozen" }]}
      cols={[
        { label: "Person", cell: (s) => <Person name={s.name ?? s.email} sub={s.name ? s.email : "Hasn’t set a password yet"} /> },
        { label: "Role", cell: (s) => <div><div style={{ fontWeight: 600 }}>{ADMIN_ROLES[s.role].label}</div><div className="a-sub">{resolveAdminScopes(s.role, s.granted, s.revoked).length} permissions{s.granted.length ? ` · +${s.granted.length}` : ""}{s.revoked.length ? ` · −${s.revoked.length}` : ""}</div></div> },
        { label: "Last active", cell: (s) => <div><div>{s.status === "INVITED" ? "—" : when(s.lastActiveAt)}</div><div className="a-sub">{s.status === "INVITED" ? `Expires ${when(s.inviteExpiresAt)}` : s.device ?? ""}</div></div> },
        { label: "Status", cell: (s) => <Badge s={s.status} /> },
      ]} />
    {invite && <InviteDialog onClose={() => setInvite(false)} />}
    {open && <StaffDialog st={open} onClose={() => setOpen(null)} />}
  </RequireScope>;
}
