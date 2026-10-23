"use client";
// apps/admin/app/(dashboard)/properties/page.tsx — "Public" means a renter can find it on Browse right now.
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { A, type PropertyRow } from "@/lib/api/admin";
import { prefetchOne } from "@/hooks/useAdmin";
import { RequireScope } from "@/components/auth/Can";
import { DataTable, Person } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/primitives";

export default function Properties() {
  const router = useRouter(); const qc = useQueryClient();
  return <RequireScope scope="listings.read">
    <div className="ph"><div><h1>Properties</h1><p>Everything listed on Newcondo — public on Browse, or hidden and why.</p></div></div>
    <DataTable<PropertyRow> name="properties" fetcher={A.properties} onRow={(p) => router.push(`/properties/${p.id}`)} prefetchRow={(p) => { void prefetchOne(qc, "properties", p.id, A.property); router.prefetch(`/properties/${p.id}`); }}
      filters={[{ value: "all", label: "All" }, { value: "public", label: "Public" }, { value: "hidden", label: "Hidden" }, { value: "review", label: "In review" }, { value: "unmarked", label: "Not marked" }, { value: "rented", label: "Rented" }, { value: "adminHidden", label: "Hidden by NewCondo" }]}
      cols={[
        { label: "Property", cell: (p) => <div><div className="a-name">{p.title}</div><div className="a-sub">{p.area}{p.units > 1 ? ` · ${p.availableUnits ?? 0}/${p.units} flats free` : ""}</div></div> },
        { label: "Owner / agent", cell: (p) => <Person name={p.owner.name} sub={p.agent ? `Agent: ${p.agent.name}` : "Self-listed"} /> },
        { label: "Rent", cell: (p) => <span className="a-mono">₦{p.priceNaira.toLocaleString("en-NG")}</span> },
        { label: "Status", cell: (p) => <Badge s={p.status} /> },
        { label: "Browse", cell: (p) => p.public ? <span className="badge b-green">Public</span> : <span className="badge b-grey" title={p.hiddenReasons.join(" · ")}>Hidden</span> },
      ]} />
  </RequireScope>;
}
