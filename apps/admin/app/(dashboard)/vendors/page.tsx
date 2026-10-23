"use client";
// apps/admin/app/(dashboard)/vendors/page.tsx
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { A, type VendorRow } from "@/lib/api/admin";
import { prefetchOne } from "@/hooks/useAdmin";
import { RequireScope } from "@/components/auth/Can";
import { DataTable, Person } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/primitives";

export default function Vendors() {
  const router = useRouter(); const qc = useQueryClient();
  return <RequireScope scope="vendors.read">
    <div className="ph"><div><h1>Vendors</h1><p>Fumigation, waste, inspection and skilled workers — companies and individuals.</p></div></div>
    <DataTable<VendorRow> name="vendors" fetcher={A.vendors} onRow={(v) => router.push(`/vendors/${v.id}`)} prefetchRow={(v) => { void prefetchOne(qc, "vendors", v.id, A.vendor); router.prefetch(`/vendors/${v.id}`); }}
      filters={[{ value: "all", label: "All" }, { value: "pending", label: "To approve" }, { value: "verified", label: "Verified" }, { value: "FUMIGATION", label: "Fumigation" }, { value: "WASTE_MANAGEMENT", label: "Waste" }, { value: "INSPECTION", label: "Inspection" }, { value: "suspended", label: "Suspended" }]}
      cols={[
        { label: "Vendor", cell: (v) => <Person name={v.name} sub={`${v.kind === "COMPANY" ? "Company" : "Individual"}${v.contact ? " · " + v.contact : ""}`} /> },
        { label: "Services", cell: (v) => v.services.map((s) => s.toLowerCase().replace(/_/g, " ")).join(" · ") },
        { label: "Coverage", cell: (v) => <span className="hint">{v.areas.join(" · ") || "No area yet"}</span> },
        { label: "Clients", cell: (v) => <span className="a-mono">{v.clients}/{v.capacity}</span> },
        { label: "Status", cell: (v) => <Badge s={v.status} /> },
      ]} />
  </RequireScope>;
}
