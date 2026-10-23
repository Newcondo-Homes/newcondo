"use client";
// apps/admin/app/(dashboard)/referrals/page.tsx — referrer → referred, program, earnings; clear/void fraud holds.
import { useState } from "react";
import { A, type ReferralRow } from "@/lib/api/admin";
import { useAction } from "@/hooks/useAdmin";
import { Can, RequireScope } from "@/components/auth/Can";
import { DataTable, Person, naira, when } from "@/components/ui/DataTable";
import { Badge, Modal } from "@/components/ui/primitives";

export default function Referrals() {
  const [open, setOpen] = useState<ReferralRow | null>(null); const [voiding, setVoiding] = useState(false); const [reason, setReason] = useState("");
  const decide = useAction((a: { id: string; action: "CLEAR" | "VOID"; reason?: string }) => A.decideReferral(a.id, a.action, a.reason), { pending: "Saving…", success: "Referral updated" }, ["referrals"]);
  const close = () => { setOpen(null); setVoiding(false); setReason(""); };
  return <RequireScope scope="referrals.read">
    <div className="ph"><div><h1>Referrals</h1><p>Rewards are a share of margin already collected — never paid before the referred person’s payment settles.</p></div></div>
    <DataTable<ReferralRow> name="referrals" fetcher={A.referrals} onRow={setOpen}
      filters={[{ value: "all", label: "All" }, { value: "ACTIVE", label: "Active" }, { value: "PENDING", label: "Pending" }, { value: "hold", label: "On hold" }, { value: "VOID", label: "Void" }]}
      cols={[{ label: "Referrer", cell: (r) => <Person name={r.referrer.name} sub={r.referrer.role.toLowerCase()} /> }, { label: "Referred", cell: (r) => <Person name={r.referred.name} sub={r.referred.role.toLowerCase()} /> }, { label: "Earned", cell: (r) => <span className="a-mono">{naira(r.referrerEarnedKobo)} / {naira(r.referredEarnedKobo)}</span> }, { label: "Since", cell: (r) => when(r.createdAt) },
        { label: "Status", right: true, cell: (r) => <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}><Badge s={r.status} />{r.fraudHold && <span className="badge b-red">Hold</span>}</div> }]} />
    {open && <Modal title={`${open.referrer.name} → ${open.referred.name}`} sub={`${open.source ? "via " + open.source.toLowerCase() + " · " : ""}${when(open.createdAt)}`} onClose={close}
      footer={<Can scope="referrals.manage" fallback={<button className="btn btn-dark" onClick={close}>Close</button>}>
        {voiding ? <><button className="btn btn-line" onClick={() => setVoiding(false)}>Back</button><button className="btn btn-danger" disabled={reason.trim().length < 8} onClick={() => decide.mutate({ id: open.id, action: "VOID", reason: reason.trim() }, { onSuccess: close })}>Void referral</button></>
          : <>{open.status !== "VOID" && <button className="btn btn-line" onClick={() => setVoiding(true)}>Void…</button>}{open.fraudHold ? <button className="btn btn-dark" onClick={() => decide.mutate({ id: open.id, action: "CLEAR" }, { onSuccess: close })}>Clear hold</button> : <button className="btn btn-dark" onClick={close}>Close</button>}</>}
      </Can>}>
      <div className="kv"><span className="k">Status</span><span className="v"><Badge s={open.status} /></span></div>
      <div className="kv"><span className="k">Referrer earned</span><span className="v a-mono">{naira(open.referrerEarnedKobo)}</span></div>
      <div className="kv"><span className="k">Referred earned</span><span className="v a-mono">{naira(open.referredEarnedKobo)}</span></div>
      {open.fraudHold && <div className="banner warn" style={{ marginTop: 12 }}>{open.fraudReason ?? "Flagged by the fraud checks"}</div>}
      <p className="hint" style={{ marginTop: 10 }}>Clearing a hold replays the rewards skipped while it was held. Voiding cancels every unredeemed reward; already-redeemed credit is not clawed back automatically.</p>
      {voiding && <div className="field" style={{ marginTop: 10 }}><label>Why are you voiding it?</label><textarea className="inp" value={reason} onChange={(e) => setReason(e.target.value)} /></div>}
    </Modal>}
  </RequireScope>;
}
