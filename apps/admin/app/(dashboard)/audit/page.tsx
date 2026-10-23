"use client";
// apps/admin/app/(dashboard)/audit/page.tsx — append-only AdminAction log.
import { A, type AuditRow } from "@/lib/api/admin";
import { RequireScope } from "@/components/auth/Can";
import { DataTable, Person, when } from "@/components/ui/DataTable";

export default function Audit() {
  return <RequireScope scope="audit.read">
    <div className="ph"><div><h1>Audit log</h1><p>Append-only. Nobody — including super admins — can edit or delete entries.</p></div></div>
    <DataTable<AuditRow> name="audit" fetcher={A.audit}
      filters={[{ value: "all", label: "All" }, { value: "impersonation", label: "Acting as user" }, { value: "money", label: "Money" }, { value: "accounts", label: "Accounts" }, { value: "staff", label: "Staff" }]}
      cols={[
        { label: "Who", cell: (a) => <Person name={a.admin.name ?? a.admin.email} /> },
        { label: "Action", cell: (a) => <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><b style={{ fontWeight: 600 }}>{a.action.toLowerCase().replace(/_/g, " ")}</b>{a.action.startsWith("IMPERSONAT") && <span className="badge b-amber">Support session</span>}</div> },
        { label: "Target", cell: (a) => <span className="hint">{a.targetType} · {a.description}</span> },
        { label: "When", cell: (a) => <span className="hint">{when(a.createdAt)}</span> },
      ]} />
  </RequireScope>;
}
