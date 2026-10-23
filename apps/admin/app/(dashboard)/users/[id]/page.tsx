"use client";
// apps/admin/app/(dashboard)/users/[id]/page.tsx — profile, usage, devices, money, rentals, properties;
// edit / field-marker flag / suspend / sign out everywhere / revoke verification / act as user.
import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Settings, Smartphone, Check } from "lucide-react";
import { A, type UserDetail } from "@/lib/api/admin";
import { useOne, useAction } from "@/hooks/useAdmin";
import { Can, RequireScope, useCan } from "@/components/auth/Can";
import { naira, when } from "@/components/ui/DataTable";
import { Badge, Confirm, Empty, Modal, SkeletonRows, Stat, Tabs, usePersistedTab } from "@/components/ui/primitives";
import { ImpersonateDialog } from "@/components/users/ImpersonateDialog";

function ReasonDialog({ title, body, label, danger, onSubmit, onClose }: { title: string; body: string; label: string; danger?: boolean; onSubmit: (reason: string) => void; onClose: () => void }) {
  const [r, setR] = useState("");
  return <Modal title={title} sub={body} onClose={onClose} footer={<><button className="btn btn-line" onClick={onClose}>Cancel</button><button className={`btn ${danger ? "btn-danger" : "btn-dark"}`} disabled={r.trim().length < 8} onClick={() => { onSubmit(r.trim()); onClose(); }}>{label}</button></>}>
    <div className="field"><label>Reason</label><textarea className="inp" autoFocus value={r} onChange={(e) => setR(e.target.value)} /><span className="hint">The user sees this. Min 8 characters. Stored on the audit log.</span></div>
  </Modal>;
}

function UserView({ id }: { id: string }) {
  const { me } = useCan();
  const { data: u, isLoading, error } = useOne<UserDetail>("users", id, A.user);
  const [tab, setTab] = usePersistedTab<"overview" | "devices" | "properties" | "rentals">("adm.user.tab", "overview");
  const [modal, setModal] = useState<null | "imp" | "suspend" | "restore" | "edit" | "signout" | "revoke">(null);
  const [form, setForm] = useState({ name: "", phone: "", city: "", isFieldMarker: false });
  const suspend = useAction((a: { s: boolean; reason?: string }) => A.suspendUser(id, a.s, a.reason), { pending: "Updating account…", success: "Account updated", sub: "The user has been emailed." }, ["users"]);
  const signout = useAction(() => A.signOutUser(id), { pending: "Ending sessions…", success: "Signed out everywhere" }, ["users"]);
  const revoke = useAction((reason: string) => A.revokeVerification(id, reason), { pending: "Revoking…", success: "Verification revoked", sub: "Their live listings are hidden until they re-verify." }, ["users", "properties"]);
  const edit = useAction(() => {
    if (!u) return Promise.resolve();
    const diff: Record<string, unknown> = {};
    if (form.name.trim() !== (u.name ?? "")) diff.name = form.name.trim();
    if (form.phone.trim() !== (u.phone ?? "")) diff.phone = form.phone.trim();
    if (form.city.trim() && form.city.trim() !== (u.area ?? "")) diff.city = form.city.trim();
    if (form.isFieldMarker !== u.isFieldMarker) diff.isFieldMarker = form.isFieldMarker;
    return A.editUser(id, diff);
  }, { pending: "Saving…", success: "Account updated" }, ["users"]);
  if (error) return <Empty title="Couldn’t load this user" sub={(error as Error).message} />;
  if (isLoading || !u) return <SkeletonRows n={5} />;
  const acting = me?.impersonating?.targetUserId === u.id;
  return <>
    <Link href="/users" className="a-back"><ArrowLeft size={15} />All users</Link>
    <div className="a-detail-h" style={{ marginBottom: 18 }}>
      <div style={{ minWidth: 0 }}><h1>{u.name ?? u.email}</h1><div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}><span className="badge b-ink">{u.role.toLowerCase()}</span><Badge s={u.verification} /><Badge s={u.status} />{u.isFieldMarker && <span className="badge b-grey">NewCondo field marker</span>}</div></div>
      <div className="ph-actions">
        <Can scope="users.write"><button className="btn btn-line btn-sm" onClick={() => { setForm({ name: u.name ?? "", phone: u.phone ?? "", city: u.area?.split(",")[0] ?? "", isFieldMarker: u.isFieldMarker }); setModal("edit"); }}><Settings size={15} />Edit</button></Can>
        <Can scope="users.suspend"><button className="btn btn-line btn-sm" onClick={() => setModal(u.status === "SUSPENDED" ? "restore" : "suspend")}>{u.status === "SUSPENDED" ? "Restore" : "Suspend"}</button></Can>
        <Can scope="users.impersonate"><button className="btn btn-dark btn-sm" disabled={!!me?.impersonating || u.status === "SUSPENDED"} title={me?.impersonating && !acting ? "End your current support session first" : undefined} onClick={() => setModal("imp")}><Eye size={15} />{acting ? "Acting as user" : "Act as user"}</button></Can>
      </div>
    </div>
    {u.status === "SUSPENDED" && <div className="banner warn" style={{ marginBottom: 14 }}><b>On hold:</b>&nbsp;{u.suspendedReason ?? "No reason recorded"}</div>}
    <div className="grid g-stats" style={{ marginBottom: 16 }}>
      <Stat label="Last seen" value={when(u.lastSeenAt)} sub={[u.lastDevice, u.lastCity].filter(Boolean).join(" · ")} />
      <Stat label="Active days (30d)" value={u.activeDays30} sub={`${u.activeDevices30} device(s) · ${u.actions30} actions`} />
      <Stat label="Wallet" value={naira(u.walletAvailableKobo)} mono sub={`${naira(u.walletPendingKobo)} pending`} />
      <Stat label="Plan" value={u.plan?.replace(/_/g, " ").toLowerCase() ?? "None"} sub={u.planStatus?.toLowerCase() ?? ""} />
    </div>
    <div style={{ marginBottom: 14 }}><Tabs value={tab} onChange={setTab} items={[{ id: "overview", label: "Overview" }, { id: "devices", label: "Devices" }, { id: "properties", label: `Properties (${u.properties.length})` }, { id: "rentals", label: `Rentals (${u.rentals.length})` }]} /></div>
    {tab === "overview" && <div className="grid g-2">
      <div className="card"><div className="card-h"><h3>Profile</h3></div>{[["Email", u.email], ["Phone", u.phone ?? "—"], ["Area", u.area ?? "—"], ["Joined", when(u.joinedAt)], ["Referred by", u.referredBy ?? "—"]].map(([k, v]) => <div key={k} className="kv"><span className="k">{k}</span><span className="v">{v}</span></div>)}</div>
      <div className="card"><div className="card-h"><h3>Identity</h3><Badge s={u.verification} /></div>
        {u.idDocuments.length === 0 ? <p className="hint">No ID submitted.</p> : u.idDocuments.map((d, i) => <div key={i} className="kv"><span className="k">{d.type.replace(/_/g, " ").toLowerCase()}</span><span className="v">{d.numberMasked ?? "—"} · {d.status.toLowerCase()}</span></div>)}
        <p className="hint" style={{ marginTop: 10 }}>Full ID and BVN numbers are never shown to staff.</p>
        {u.verification === "VERIFIED" && <Can scope="verification.revoke"><button className="btn btn-line btn-sm" style={{ marginTop: 6 }} onClick={() => setModal("revoke")}>Revoke verification</button></Can>}
      </div>
    </div>}
    {tab === "devices" && <div className="card"><div className="card-h"><h3>Devices</h3><Can scope="users.suspend"><button className="btn btn-line btn-sm" onClick={() => setModal("signout")}>Sign out everywhere</button></Can></div>
      {u.devices.length === 0 ? <Empty title="No devices recorded yet" /> : u.devices.map((d) => <div key={d.id} className="a-sess"><span className="a-q-ic"><Smartphone size={16} /></span><div style={{ flex: 1, minWidth: 0 }}><div className="a-name">{d.label ?? "Unknown device"}</div><div className="a-sub">{[d.city, `first seen ${when(d.firstSeenAt)}`, `${d.activeDays} active day(s)`].filter(Boolean).join(" · ")}</div></div><div style={{ textAlign: "right" }}>{d.signedOut ? <span className="badge b-grey">Signed out</span> : <span className="badge b-green">Signed in</span>}<div className="a-sub">{when(d.lastSeenAt)}</div></div></div>)}
      <p className="hint" style={{ marginTop: 10 }}>City comes from network location and may be approximate. Support sessions are never counted here.</p></div>}
    {tab === "properties" && <div className="card tight">{u.properties.length === 0 ? <Empty title="No properties" /> : u.properties.map((p) => <Link key={p.id} href={`/properties/${p.id}`} className="prow"><div className="prow-b"><div className="prow-t">{p.title}</div><div className="prow-s">{p.relation === "OWNER" ? "Owner" : "Listing agent"}</div></div><Badge s={p.status} /><span className={`badge ${p.public ? "b-green" : "b-grey"}`}>{p.public ? "On Browse" : "Hidden"}</span></Link>)}</div>}
    {tab === "rentals" && <div className="card tight">{u.rentals.length === 0 ? <Empty title="No rentals" /> : u.rentals.map((r) => <div key={r.id} className="prow"><div className="prow-b"><div className="prow-t">{r.property}{r.unit ? ` · ${r.unit}` : ""}</div><div className="prow-s">since {when(r.since)}</div></div><Badge s={r.status} /></div>)}</div>}
    {modal === "imp" && <ImpersonateDialog user={u} onClose={() => setModal(null)} />}
    {modal === "suspend" && <ReasonDialog title="Suspend this account?" body="Signed out everywhere and listings hidden from Browse. Rent already in escrow is not touched." label="Suspend" danger onSubmit={(reason) => suspend.mutate({ s: true, reason })} onClose={() => setModal(null)} />}
    {modal === "restore" && <Confirm title="Restore this account?" body="They can sign in again and their listings return to Browse." confirmLabel="Restore" onConfirm={() => suspend.mutate({ s: false })} onClose={() => setModal(null)} />}
    {modal === "revoke" && <ReasonDialog title="Revoke verification?" body="The badge is removed, their live listings are hidden and they must re-submit ID." label="Revoke" danger onSubmit={(reason) => revoke.mutate(reason)} onClose={() => setModal(null)} />}
    {modal === "signout" && <Confirm title="Sign out everywhere?" body="They’ll need to sign in again on every device." confirmLabel="Sign out" onConfirm={() => signout.mutate(undefined)} onClose={() => setModal(null)} />}
    {modal === "edit" && <Modal title="Edit account" sub={u.email} onClose={() => setModal(null)} footer={<><button className="btn btn-line" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-dark" disabled={edit.isPending} onClick={() => edit.mutate(undefined, { onSuccess: () => setModal(null) })}>Save</button></>}>
      <div className="field"><label>Full name</label><input className="inp" disabled={u.verification === "VERIFIED"} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><span className="hint">{u.verification === "VERIFIED" ? "Locked — it matches their verified ID. The user must re-verify to change it." : "Must match the ID they submit."}</span></div>
      <div className="field"><label>Phone</label><input className="inp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><span className="hint">Changing it asks them to verify the new number.</span></div>
      <div className="field"><label>City</label><input className="inp" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
      {u.role === "AGENT" && u.verification === "VERIFIED" && <label className="chk-row" onClick={() => setForm({ ...form, isFieldMarker: !form.isFieldMarker })}><span className={`chk${form.isFieldMarker ? " on" : ""}`}>{form.isFieldMarker && <Check size={12} strokeWidth={3} />}</span>NewCondo field marker (salaried — can be assigned NewCondo-handled marking jobs)</label>}
      <p className="hint">Email, password and bank details can only be changed by the user (OTP-protected).</p>
    </Modal>}
  </>;
}

export default function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RequireScope scope="users.read"><UserView id={id} /></RequireScope>;
}
