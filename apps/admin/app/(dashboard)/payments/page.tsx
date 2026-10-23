"use client";
// apps/admin/app/(dashboard)/payments/page.tsx — Rent & splits · Ledger · Failed transfers.
// No refund button: the only refund is upholding a rent dispute (Disputes page).
// No "retry transfer": failed withdrawals are already reversed; failed vendor batches re-queue themselves.
import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { A, type RentRow, type LedgerRow, type FailedTransfer } from "@/lib/api/admin";
import { useAction } from "@/hooks/useAdmin";
import { Can, RequireScope } from "@/components/auth/Can";
import { DataTable, Person, naira, when } from "@/components/ui/DataTable";
import { Badge, Modal, Tabs, usePersistedTab } from "@/components/ui/primitives";

function RentDialog({ r, onClose }: { r: RentRow; onClose: () => void }) {
  const [release, setRelease] = useState(false); const [reason, setReason] = useState(""); const [ack, setAck] = useState(false);
  const act = useAction(() => A.releaseRent(r.id, reason.trim()), { pending: "Releasing…", success: "Rent released", sub: "Split posted; every party notified." }, ["rent"]);
  return <Modal wide title={`${r.tenant}${r.unit ? " · " + r.unit : ""}`} sub={`${r.ref} · ${r.property} · paid ${when(r.paidAt)}`} onClose={onClose}
    footer={release ? <><button className="btn btn-line" onClick={() => setRelease(false)}>Back</button><button className="btn btn-dark" disabled={!ack || reason.trim().length < 8 || act.isPending} onClick={() => act.mutate(undefined, { onSuccess: onClose })}>Release now</button></>
      : <><button className="btn btn-line" onClick={onClose}>Close</button>
        {r.status === "DISPUTED" && r.disputeId && <Link className="btn btn-dark" href="/disputes">Open dispute</Link>}
        {r.status === "IN_ESCROW" && <Can scope="payouts.release"><button className="btn btn-dark" onClick={() => setRelease(true)}>Release early…</button></Can>}</>}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}><Badge s={r.status} /><span className="a-mono" style={{ fontSize: 22, fontWeight: 600 }}>{naira(r.amountKobo)}</span>{r.status === "IN_ESCROW" && r.escrowEndsAt && <span className="hint">auto-releases {when(r.escrowEndsAt)}</span>}</div>
    {r.split ? <div className="a-split">{[["Owner", r.split.ownerKobo, r.parties.owner], ["Listing agent", r.split.listingAgentKobo, r.parties.listingAgent], ["Sub-agent", r.split.subAgentKobo, r.parties.subAgent], ["Newcondo", r.split.newcondoKobo, null]].map(([l, v, who]) => <div key={l} className={l === "Newcondo" ? "nc" : ""}><span>{l}</span><b>{naira(v as string)}</b>{who && <span>{who}</span>}</div>)}</div>
      : <p className="hint">The split is posted from the ledger when escrow releases. Commission follows the property’s plan rate; the listing agent and sub-agent share the agents’ part.</p>}
    {release && <div style={{ marginTop: 14 }}>
      <div className="banner warn" style={{ marginBottom: 10 }}>Releasing before the 24-hour window ends removes the renter’s protection. Only do it when the renter has confirmed in writing.</div>
      <div className="field"><label>Reason / reference</label><textarea className="inp" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Ticket #T-1088 — renter confirmed by email" /></div>
      <label className="chk-row" onClick={() => setAck(!ack)}><span className={`chk${ack ? " on" : ""}`}>{ack && <Check size={12} strokeWidth={3} />}</span>The renter has confirmed the property in writing.</label>
    </div>}
  </Modal>;
}

export default function Payments() {
  const [tab, setTab] = usePersistedTab<"rent" | "ledger" | "failed">("adm.money", "rent");
  const [open, setOpen] = useState<RentRow | null>(null);
  return <RequireScope scope="payments.read">
    <div className="ph"><div><h1>Payments</h1><p>All money moves through one account: <b className="a-mono">NEWCONDO LTD OPERATIONS FLW</b>. Every row ties back to a ledger entry.</p></div></div>
    <div style={{ marginBottom: 14 }}><Tabs value={tab} onChange={setTab} items={[{ id: "rent", label: "Rent & splits" }, { id: "ledger", label: "Ledger" }, { id: "failed", label: "Failed transfers" }]} /></div>
    {tab === "rent" && <DataTable<RentRow> name="rent" fetcher={A.rent} onRow={setOpen}
      filters={[{ value: "all", label: "All" }, { value: "escrow", label: "In escrow" }, { value: "disputed", label: "Disputed" }, { value: "released", label: "Released" }, { value: "refunded", label: "Refunded" }, { value: "failed", label: "Failed" }]}
      cols={[{ label: "Tenant", cell: (r) => <Person name={r.tenant} sub={`${r.property}${r.unit ? " · " + r.unit : ""}`} /> }, { label: "Paid", cell: (r) => when(r.paidAt) }, { label: "Amount", cell: (r) => <span className="amt-in">{naira(r.amountKobo)}</span> }, { label: "Newcondo", cell: (r) => r.split ? <span className="a-mono">{naira(r.split.newcondoKobo)}</span> : <span className="hint">—</span> }, { label: "Status", cell: (r) => <Badge s={r.status} /> }]} />}
    {tab === "ledger" && <DataTable<LedgerRow> name="ledger" fetcher={A.ledger}
      filters={[{ value: "all", label: "All" }, { value: "rent", label: "Rent" }, { value: "subscriptions", label: "Subscriptions" }, { value: "marking", label: "Marking" }, { value: "vendors", label: "Vendors" }, { value: "withdrawals", label: "Withdrawals" }, { value: "referrals", label: "Referrals" }, { value: "adjustments", label: "Adjustments" }]}
      cols={[{ label: "Entry", cell: (l) => <div><div className="a-name">{l.type.toLowerCase().replace(/_/g, " ")}</div><div className="a-sub a-mono">{l.source}</div></div> }, { label: "Memo", cell: (l) => <span className="hint">{l.memo ?? ""}</span> }, { label: "Moved", cell: (l) => <span className="a-mono">{naira(l.amountKobo)}</span> }, { label: "Revenue", cell: (l) => Number(l.revenueKobo) !== 0 ? <span className="a-mono">{naira(l.revenueKobo)}</span> : <span className="hint">—</span> }, { label: "When", right: true, cell: (l) => when(l.createdAt) }]} />}
    {tab === "failed" && <><p className="hint" style={{ margin: "0 0 12px" }}>Read-only, last 30 days. Nothing here needs a manual retry — retrying could pay twice.</p>
      <DataTable<FailedTransfer> name="failed" fetcher={A.failedTransfers}
        cols={[{ label: "Transfer", cell: (f) => <div><div className="a-name">{f.kind === "WITHDRAWAL" ? "Withdrawal" : "Vendor payout batch"}</div><div className="a-sub a-mono">{f.ref}</div></div> }, { label: "Party", cell: (f) => f.party ?? "—" }, { label: "Amount", cell: (f) => <span className="a-mono">{naira(f.amountKobo)}</span> }, { label: "What happens next", cell: (f) => <span className="hint">{f.reason ? `${f.reason} · ` : ""}{f.next}</span> }, { label: "When", right: true, cell: (f) => when(f.createdAt) }]} /></>}
    {open && <RentDialog r={open} onClose={() => setOpen(null)} />}
  </RequireScope>;
}
