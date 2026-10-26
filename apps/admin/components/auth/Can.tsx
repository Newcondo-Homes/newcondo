"use client";
// apps/admin/components/auth/Can.tsx
// Scope-aware rendering. Wrap anything permission-bound:
//   <Can scope="payouts.release"><button>Release</button></Can>
//   <Can any={["disputes.manage","support.tickets"]} fallback={<Locked scope="disputes.manage" />}>…</Can>
// UI only — admin-service enforces the same scope on the route.
import { createContext, useContext, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { ADMIN_MODULES, type AdminScope, type AdminModuleDef, type AdminScopeDef } from "@/lib/scopes";
import type { StaffMe } from "@/lib/api/admin";

const StaffCtx = createContext<StaffMe | null>(null);
export const StaffProvider = ({ me, children }: { me: StaffMe; children: ReactNode }) => <StaffCtx.Provider value={me}>{children}</StaffCtx.Provider>;
export function useCan() {
  const me = useContext(StaffCtx);
  const scopes = me?.scopes ?? [];
  return { me, can: (s: AdminScope | AdminScope[]) => (Array.isArray(s) ? s : [s]).every((x: AdminScope) => scopes.includes(x)), canAny: (s: AdminScope[]) => s.some((x: AdminScope) => scopes.includes(x)) };
}

export function Can({ scope, any, children, fallback = null }: { scope?: AdminScope | AdminScope[]; any?: AdminScope[]; children: ReactNode; fallback?: ReactNode }) {
  const { can, canAny } = useCan();
  const ok = (scope ? can(scope) : true) && (any ? canAny(any) : true);
  return <>{ok ? children : fallback}</>;
}

export function Locked({ scope }: { scope: AdminScope }) {
  const s = ADMIN_MODULES.flatMap((m: AdminModuleDef) => [...m.scopes]).find((x: AdminScopeDef) => x.key === scope);
  return <div className="a-lock"><Lock size={22} /><b>You don’t have access to this</b><p style={{ margin: 0, fontSize: 13, maxWidth: "40ch", lineHeight: 1.5 }}>Needs <b className="a-mono">{scope}</b>{s ? ` (${s.label})` : ""}. Ask a super admin to grant it from Staff &amp; access.</p></div>;
}

/** Page-level guard. */
export function RequireScope({ scope, any, children }: { scope?: AdminScope; any?: AdminScope[]; children: ReactNode }) {
  return <Can scope={scope} any={any} fallback={<Locked scope={scope ?? any![0]} />}>{children}</Can>;
}
