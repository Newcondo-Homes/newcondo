"use client";

/* ============================================================
   Role context for the dashboard.
   PRODUCTION: the role comes from the NextAuth session — the server
   layout passes session.user into <DashboardLayout>, which seeds this
   provider. The setRole switcher exists ONLY for design preview;
   remove the switcher UI (Topbar) and setRole becomes dead code.
   ============================================================ */
import { createContext, useContext, useState, type ReactNode } from "react";
import { DUMMY_USERS, type DashboardUser, type Role } from "@/lib/dashboard/data";

interface RoleCtx {
  role: Role;
  user: DashboardUser;
  setRole: (r: Role) => void;
}
const Ctx = createContext<RoleCtx | null>(null);

export function RoleProvider({ initialRole = "OWNER", children }: { initialRole?: Role; children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    if (typeof window === "undefined") return initialRole;
    try { return (localStorage.getItem("nc-dash-role") as Role) || initialRole; } catch { return initialRole; }
  });
  const setRole = (r: Role) => {
    setRoleState(r);
    try { localStorage.setItem("nc-dash-role", r); } catch {}
  };
  /* TODO(backend): replace DUMMY_USERS lookup with the session user
     (name, email, plan, verificationStatus come from GET /api/user/profile). */
  return <Ctx.Provider value={{ role, user: DUMMY_USERS[role], setRole }}>{children}</Ctx.Provider>;
}

export function useRole(): RoleCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRole must be used inside <RoleProvider>");
  return v;
}
