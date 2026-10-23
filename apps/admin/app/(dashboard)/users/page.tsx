"use client";
// apps/admin/app/(dashboard)/users/page.tsx
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { A, type UserRow } from "@/lib/api/admin";
import { prefetchOne } from "@/hooks/useAdmin";
import { RequireScope } from "@/components/auth/Can";
import { DataTable, Person, when } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/primitives";

const ROLE: Record<string, string> = { OWNER: "Property owner", AGENT: "Agent", RENTER: "Renter" };
export default function Users() {
  const router = useRouter(); const qc = useQueryClient();
  return <RequireScope scope="users.read">
    <div className="ph"><div><h1>Users</h1><p>Owners, agents and renters. Open anyone to see usage, devices, money and history.</p></div></div>
    <DataTable<UserRow> name="users" fetcher={A.users} onRow={(u) => router.push(`/users/${u.id}`)} prefetchRow={(u) => { void prefetchOne(qc, "users", u.id, A.user); router.prefetch(`/users/${u.id}`); }}
      filters={[{ value: "all", label: "All" }, { value: "OWNER", label: "Owners" }, { value: "AGENT", label: "Agents" }, { value: "RENTER", label: "Renters" }, { value: "unverified", label: "Unverified" }, { value: "suspended", label: "Suspended" }, { value: "fieldMarkers", label: "Field markers" }]}
      cols={[
        { label: "User", cell: (u) => <Person name={u.name} sub={u.email} /> },
        { label: "Type", cell: (u) => <div><div style={{ fontWeight: 600 }}>{ROLE[u.role] ?? u.role}</div><div className="a-sub">{u.plan ? `${u.plan.replace(/_/g, " ").toLowerCase()} · ${u.planStatus?.toLowerCase()}` : "No plan"}</div></div> },
        { label: "Verification", cell: (u) => <Badge s={u.verification} /> },
        { label: "Last seen", cell: (u) => <div><div>{when(u.lastSeenAt)}</div><div className="a-sub">{[u.lastDevice, u.lastCity].filter(Boolean).join(" · ")}</div></div> },
        { label: "Status", cell: (u) => <Badge s={u.status} /> },
      ]} />
  </RequireScope>;
}
