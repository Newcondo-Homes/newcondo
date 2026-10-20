"use client";
// Payouts + Business & Settings.
import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw, CheckCircle2, TrendingUp, Landmark, Zap, Clock, Plus, MapPin, Trash2, Loader2 } from "lucide-react";
import { useMe, usePayouts, useOverview, useMeMutation } from "@/hooks/useVendor";
import { setReleaseMode, updateMe, addArea, removeArea, setBank } from "@/lib/api/vendor";
import { Stat, Confirm, Modal, Empty, SkeletonRows, Select, Tabs, usePersistedTab } from "@/components/ui/primitives";
import { JobStatus, svcLabel } from "@/components/jobs/JobRow";
import { VENDORS, NG_BANKS, fmtDay, koboToNaira, naira } from "@/lib/constants";
import { useUI } from "@/store/ui";

export function PayoutsView() {
  const { data: me } = useMe();
  const { data: ov } = useOverview();
  const { data, isLoading } = usePayouts();
  const { setOpenJob } = useUI();
  const [confirm, setConfirm] = useState<"INSTANT" | "END_OF_DAY" | null>(null);
  const mode = useMeMutation(setReleaseMode);
  const paid = (data?.jobs ?? []).filter((j) => j.payout === "PAID");
  return <>
    <div className="ph"><div><h1>Payouts</h1><p>Paid from each property&apos;s service fund once the visit code is verified.</p></div></div>
    <div className="grid g-stats" style={{ marginBottom: 16 }}>
      <Stat label="Pending" mono value={ov ? naira(koboToNaira(ov.counts.pendingPaymentKobo)) : "–"} sub={ov ? `${ov.counts.pendingJobs} job(s)` : undefined} icon={<RefreshCw size={16} />} />
      <Stat label="Paid this month" mono value={ov ? naira(koboToNaira(ov.counts.paidThisMonthKobo)) : "–"} icon={<CheckCircle2 size={16} />} />
      <Stat label="Paid (listed)" mono value={naira(paid.reduce((s, j) => s + j.receive, 0))} sub={`${paid.length} job(s)`} icon={<TrendingUp size={16} />} />
      <Stat label="Paid to" value={me?.bank.bankName ?? "No bank yet"} sub={me?.bank.verified ? `${me.bank.accountNumberMasked} · verified` : "Add it in Settings"} icon={<Landmark size={16} />} />
    </div>
    <div className="grid g-32">
      <div className="card tight">
        <div className="card-h" style={{ padding: "18px 20px 0" }}><h3>Payout history</h3></div>
        {isLoading ? <SkeletonRows n={4} /> : data?.jobs.length ? <div className="v-tbl-wrap"><table className="tbl v-clients">
          <thead><tr><th>Job</th><th>Verified</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>{data.jobs.map((j) => <tr key={j.id} onClick={() => setOpenJob(j.id)} style={{ cursor: "pointer" }}>
            <td data-l="Job"><b style={{ fontWeight: 600 }}>{j.property}</b><div className="sub">{svcLabel(j.service)} · {j.ref}</div></td>
            <td data-l="Verified">{j.verifiedAt ? fmtDay(j.verifiedAt) : "—"}<div className="sub">{j.verifiedVia === "QR" ? "QR scan" : "Visit code"}</div></td>
            <td data-l="Amount"><span className="amt-in">{naira(j.receive)}</span><div className="sub">after {naira(j.cost - j.receive)} fee</div></td>
            <td data-l="Status"><JobStatus j={j} /></td>
          </tr>)}</tbody>
        </table></div> : <Empty title="No payouts yet" sub="Verified visits appear here with their transfer status." />}
      </div>
      <div className="card" style={{ alignSelf: "start" }}>
        <div className="card-h"><h3>Payout timing</h3></div>
        {([["INSTANT", "Instantly", "Each job is sent the moment its code is verified.", Zap], ["END_OF_DAY", "End of day", `One transfer at ${VENDORS.payout.endOfDayHour}:00 for everything verified that day — one fee, not one per job.`, Clock]] as const).map(([id, t, d, Ic]) =>
          <div key={id} className={`opt${me?.releaseMode === id ? " sel" : ""}`} onClick={() => me && me.releaseMode !== id && setConfirm(id)}>
            <span className="opt-ic"><Ic size={18} /></span><div><b>{t}</b><p>{d}</p></div>
          </div>)}
      </div>
    </div>
    {confirm && <Confirm title={confirm === "INSTANT" ? "Switch to instant payouts?" : "Switch to end-of-day payouts?"} confirmLabel="Switch" onClose={() => setConfirm(null)}
      body={confirm === "INSTANT" ? "Each verified job will be sent on its own. Flutterwave charges its transfer fee on every transfer." : "Jobs you verify from now on are sent together at 6:00 pm. Anything already processing isn't affected."}
      onConfirm={() => toast.promise(mode.mutateAsync(confirm), { loading: "Updating…", success: "Payout timing updated", error: (e) => (e as Error).message })} />}
  </>;
}

type STab = "business" | "areas" | "bank";
export function SettingsView() {
  const { data: me, isLoading } = useMe();
  const [tab, setTab] = usePersistedTab<STab>("v-set-tab", "business");
  const [areaOpen, setAreaOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const save = useMeMutation(updateMe);
  const del = useMeMutation(removeArea);
  if (isLoading || !me) return <SkeletonRows n={4} />;
  const primary = VENDORS.providerTypes[me.providerType as keyof typeof VENDORS.providerTypes];
  const addable = primary ? VENDORS.addableServices[primary.services[0]] : [];
  return <>
    <div className="ph"><div><h1>Business & Settings</h1><p>What Newcondo uses to match you with properties and pay you.</p></div></div>
    <div style={{ marginBottom: 14 }}><Tabs value={tab} onChange={setTab} items={[{ id: "business", label: "Business" }, { id: "areas", label: "Service areas" }, { id: "bank", label: "Bank" }]} /></div>
    {tab === "business" && <form className="card" style={{ maxWidth: 720 }} onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      toast.promise(save.mutateAsync({ name: String(f.get("name")), contactName: String(f.get("contactName")), phone: String(f.get("phone")), capacityPerDay: Number(f.get("cap")), extraServices: addable.filter((s) => f.get(`svc-${s}`)) }), { loading: "Saving…", success: "Business details saved", error: (er) => (er as Error).message });
    }}>
      <div className="f-row"><div className="field"><label>Business name</label><input className="inp" name="name" defaultValue={me.name} required /></div><div className="field"><label>Provider type</label><input className="inp" value={primary?.label ?? me.providerType} disabled /><span className="hint">Contact support to change your provider type.</span></div></div>
      <div className="f-row"><div className="field"><label>Contact person</label><input className="inp" name="contactName" defaultValue={me.contactName ?? ""} /></div><div className="field"><label>Phone</label><input className="inp" name="phone" defaultValue={me.phone ?? ""} inputMode="tel" /></div></div>
      <div className="field"><label>Visits you can take a day</label><input className="inp" name="cap" type="number" min={1} max={30} defaultValue={me.capacityPerDay} /><span className="hint">Newcondo never books more than this on one day.</span></div>
      {addable.length > 0 && <div className="field"><label>Also offer</label>{addable.map((s) => <label key={s} className="chk-row"><input type="checkbox" name={`svc-${s}`} defaultChecked={me.services.includes(s)} /> {svcLabel(s)} <span className="hint">— needs the matching licence in your documents</span></label>)}</div>}
      <button className="btn btn-dark" disabled={save.isPending}>{save.isPending && <Loader2 size={15} className="spin" />}Save changes</button>
    </form>}
    {tab === "areas" && <div className="card tight" style={{ maxWidth: 820 }}>
      <div className="card-h" style={{ padding: "18px 20px 0" }}><h3>Where you work</h3><button className="btn btn-dark btn-sm" onClick={() => setAreaOpen(true)}><Plus size={14} />Add area</button></div>
      {me.areas.length ? me.areas.map((a) => <div key={a.id} className="prow"><div className="pthumb"><MapPin size={20} /></div><div className="prow-b"><div className="prow-t">{a.area}</div><div className="prow-s">{a.lga}, {a.state} · {a.radiusKm} km radius</div></div>
        <span className="badge b-grey">{a.clients} clients</span><button className="btn btn-ghost btn-sm" aria-label="Remove area" onClick={() => toast.promise(del.mutateAsync(a.id), { loading: "Removing…", success: "Area removed — existing clients stay with you", error: (e) => (e as Error).message })}><Trash2 size={15} /></button></div>)
        : <Empty title="No service areas yet" sub="Add where you work. Subscribed properties inside it are shared evenly between the vendors there." />}
    </div>}
    {tab === "bank" && <div className="card" style={{ maxWidth: 560 }}>
      <div className="kv"><span className="k">Bank</span><span className="v">{me.bank.bankName ?? "—"}</span></div>
      <div className="kv"><span className="k">Account</span><span className="v mono">{me.bank.accountNumberMasked ?? "—"}</span></div>
      <div className="kv"><span className="k">Name</span><span className="v">{me.bank.accountName ?? "—"}</span></div>
      <p className="hint">Verified with Flutterwave. Changing it needs your password, and you&apos;ll get a notification.</p>
      <button className="btn btn-line" onClick={() => setBankOpen(true)}>{me.bank.bankName ? "Change bank account" : "Add bank account"}</button>
    </div>}
    {areaOpen && <AreaModal onClose={() => setAreaOpen(false)} />}
    {bankOpen && <BankModal onClose={() => setBankOpen(false)} />}
  </>;
}

function AreaModal({ onClose }: { onClose: () => void }) {
  const m = useMeMutation(addArea);
  const [f, setF] = useState({ state: "Imo", lga: "", area: "", radiusKm: VENDORS.matching.defaultRadiusKm as number, lat: 0, lng: 0 });
  const locate = () => navigator.geolocation?.getCurrentPosition((p) => { setF((x) => ({ ...x, lat: p.coords.latitude, lng: p.coords.longitude })); toast.success("Centre set to where you are"); }, () => toast.error("Location blocked", { description: "Allow location to set the centre of this area." }), { enableHighAccuracy: true, timeout: 10_000 });
  const ok = f.lga.length > 1 && f.area.length > 1 && f.lat !== 0;
  return <Modal title="Add a service area" sub="You'll be matched with subscribed properties inside it." onClose={onClose}
    footer={<><button className="btn btn-line" onClick={onClose}>Cancel</button><button className="btn btn-dark" disabled={!ok || m.isPending} onClick={() => toast.promise(m.mutateAsync(f).then(onClose), { loading: "Adding…", success: "Area added — matching runs within minutes", error: (e) => (e as Error).message })}>Add area</button></>}>
    <div className="field"><label>State</label><Select value={f.state} onChange={(state) => setF({ ...f, state })} options={[{ value: "Imo", label: "Imo" }, { value: "Rivers", label: "Rivers" }]} /></div>
    <div className="field"><label>LGA</label><input className="inp" value={f.lga} onChange={(e) => setF({ ...f, lga: e.target.value })} placeholder="e.g. Owerri Municipal" /></div>
    <div className="field"><label>Area / neighbourhood</label><input className="inp" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} placeholder="e.g. Ikenegbu" /></div>
    <div className="field"><label>Centre</label><button type="button" className="btn btn-line" onClick={locate}><MapPin size={15} />{f.lat ? `${f.lat.toFixed(4)}, ${f.lng.toFixed(4)}` : "Use my current location"}</button><span className="hint">Stand in the middle of the area you serve.</span></div>
    <div className="field"><label>Radius — {f.radiusKm} km</label><input type="range" min={1} max={VENDORS.matching.maxRadiusKm} value={f.radiusKm} onChange={(e) => setF({ ...f, radiusKm: Number(e.target.value) })} /></div>
  </Modal>;
}

function BankModal({ onClose }: { onClose: () => void }) {
  const m = useMeMutation(setBank);
  const banks = NG_BANKS.map((b) => ({ value: b.code, label: b.name }));
  const [f, setF] = useState({ bankCode: "", accountNumber: "", currentPassword: "" });
  const bankName = banks.find((b) => b.value === f.bankCode)?.label ?? "";
  return <Modal title="Payout bank account" sub="We check the name on the account with Flutterwave before saving it." onClose={onClose}
    footer={<><button className="btn btn-line" onClick={onClose}>Cancel</button><button className="btn btn-dark" disabled={!f.bankCode || f.accountNumber.length !== 10 || !f.currentPassword || m.isPending} onClick={() => toast.promise(m.mutateAsync({ ...f, bankName }).then(onClose), { loading: "Verifying account…", success: "Bank account saved", error: (e) => (e as Error).message })}>Verify & save</button></>}>
    <div className="field"><label>Bank</label><Select value={f.bankCode} onChange={(bankCode) => setF({ ...f, bankCode })} options={banks} placeholder="Choose your bank" /></div>
    <div className="field"><label>Account number</label><input className="inp" inputMode="numeric" maxLength={10} value={f.accountNumber} onChange={(e) => setF({ ...f, accountNumber: e.target.value.replace(/\D/g, "") })} /></div>
    <div className="field"><label>Your password</label><input className="inp" type="password" autoComplete="current-password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} /><span className="hint">Required for every bank change.</span></div>
  </Modal>;
}
