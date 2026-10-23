"use client";
// apps/admin/app/(dashboard)/properties/[id]/page.tsx — listing, why it is/isn't on Browse, tenants & rent status, vendors.
import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { A, type PropertyDetail } from "@/lib/api/admin";
import { useOne, useAction } from "@/hooks/useAdmin";
import { Can, RequireScope } from "@/components/auth/Can";
import { Person, when } from "@/components/ui/DataTable";
import { Badge, Confirm, Empty, Modal, SkeletonRows } from "@/components/ui/primitives";

function PropertyView({ id }: { id: string }) {
  const router = useRouter();
  const { data: p, isLoading, error } = useOne<PropertyDetail>("properties", id, A.property);
  const [modal, setModal] = useState<null | "hide" | "show">(null); const [reason, setReason] = useState("");
  const vis = useAction((pub: boolean) => A.setVisibility(id, pub, pub ? undefined : reason.trim()), { pending: "Updating…", success: "Visibility updated", sub: "Owner and listing agent notified." }, ["properties"]);
  if (error) return <Empty title="Couldn’t load this property" sub={(error as Error).message} />;
  if (isLoading || !p) return <SkeletonRows n={5} />;
  return <>
    <button className="a-back" onClick={() => router.back()}><ArrowLeft size={15} />Back</button>
    <div className="a-detail-h" style={{ marginBottom: 18 }}>
      <div style={{ minWidth: 0 }}><h1>{p.title}</h1><p style={{ margin: "6px 0 0", color: "var(--text-tertiary)", fontSize: 14 }}>{p.address}, {p.city}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}><Badge s={p.status} /><span className={`badge ${p.marked ? "b-green" : "b-amber"}`}>{p.marked ? "Marked" : "Not marked"}</span><span className={`badge ${p.public ? "b-green" : "b-grey"}`}>{p.public ? "On Browse" : "Hidden"}</span></div></div>
      <div className="ph-actions">
        <Can scope="listings.write">{p.adminHidden ? <button className="btn btn-line btn-sm" onClick={() => setModal("show")}>Stop hiding</button> : <button className="btn btn-line btn-sm" onClick={() => setModal("hide")}>Hide from Browse</button>}</Can>
        <Can scope="users.read"><Link className="btn btn-line btn-sm" href={`/users/${p.owner.id}`}>Open owner</Link></Can>
      </div>
    </div>
    {!p.public && <div className="banner info" style={{ marginBottom: 14 }}><span><b>Not on Browse because:</b> {p.hiddenReasons.join(" · ")}</span></div>}
    <div className="card" style={{ marginBottom: 16 }}>{[["Owner", `${p.owner.name ?? "—"}${p.owner.verified ? " · verified" : " · not verified"}`], ["Listing agent", p.agent?.name ?? "— self-listed"], ["Plan", p.plan ? `${p.plan.planType.replace(/_/g, " ").toLowerCase()} · ${p.plan.status.toLowerCase()}` : "No plan"], ["Rent", `₦${p.priceNaira.toLocaleString("en-NG")} / year`], ["Flats", `${p.availableUnits ?? 0} free of ${p.units}`], ["Approval", p.approval.toLowerCase() + (p.rejectionReason ? ` — ${p.rejectionReason}` : "")], ["Listed", when(p.createdAt)]].map(([k, v]) => <div key={k} className="kv"><span className="k">{k}</span><span className="v">{v}</span></div>)}</div>
    <div className="card tight" style={{ marginBottom: 16 }}><div className="card-h" style={{ padding: "18px 20px 6px" }}><h3>Tenants &amp; rent</h3></div>
      {p.tenants.length === 0 ? <Empty title="No current tenants" sub="Tenants appear after they join through an invite link or pay rent." /> : <div className="a-scroll"><table className="tbl a-tbl"><thead><tr><th>Tenant</th><th>Flat</th><th>Rent</th><th>Since</th><th>Payment</th></tr></thead><tbody>
        {p.tenants.map((t) => <tr key={t.rentalId}><td data-l="Tenant"><Person name={t.renter.name} sub={t.rentalStatus === "PENDING_CONFIRMATION" ? "Confirming" : undefined} /></td><td data-l="Flat">{t.unit ?? "Whole unit"}</td><td data-l="Rent"><span className="a-mono">₦{t.rentNaira.toLocaleString("en-NG")}</span></td><td data-l="Since">{when(t.since)}</td><td data-l="Payment"><Badge s={t.payment} />{t.payment === "IN_ESCROW" && t.escrowEndsAt && <div className="a-sub">releases {when(t.escrowEndsAt)}</div>}</td></tr>)}
      </tbody></table></div>}</div>
    <Can scope="vendors.read"><div className="card tight"><div className="card-h" style={{ padding: "18px 20px 6px" }}><h3>Vendors servicing this property</h3></div>
      {p.vendors.length === 0 ? <Empty title="No vendors assigned" sub="Matching assigns vendors once the plan is active and the property is marked." /> : p.vendors.map((v) => <Link key={v.id + v.service} href={`/vendors/${v.id}`} className="prow"><div className="prow-b"><div className="prow-t">{v.name}</div><div className="prow-s">{v.service.toLowerCase().replace(/_/g, " ")}</div></div>{v.paused && <span className="badge b-amber">Paused</span>}</Link>)}
    </div></Can>
    {modal === "hide" && <Modal title="Hide from Browse?" sub="It disappears from Browse and share links stop working. Tenants, rent and vendor visits are unaffected; the listing status doesn’t change." onClose={() => setModal(null)} footer={<><button className="btn btn-line" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-danger" disabled={reason.trim().length < 8} onClick={() => vis.mutate(false, { onSuccess: () => setModal(null) })}>Hide</button></>}>
      <div className="field"><label>Reason (sent to the owner)</label><textarea className="inp" value={reason} onChange={(e) => setReason(e.target.value)} /></div></Modal>}
    {modal === "show" && <Confirm title="Stop hiding this property?" body="It returns to Browse if nothing else is keeping it hidden." confirmLabel="Stop hiding" onConfirm={() => vis.mutate(true)} onClose={() => setModal(null)} />}
  </>;
}

export default function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RequireScope scope="listings.read"><PropertyView id={id} /></RequireScope>;
}
