"use client";

/* ============================================================
   Role context for the dashboard.

   PRODUCTION: role + user now come from the NextAuth session. The server
   layout (app/(dashboard)/layout.tsx) reads `await auth()` and passes
   session.user down through <DashboardLayout> → <RoleProvider sessionUser>.
   No client fetch, no flash of the wrong role.

   The DUMMY_USERS lookup remains only as a fallback for design preview
   (Topbar's dev-only role switcher, and Storybook-style usage with no
   session). Once real data flows, `setRole` is dead code in production —
   the switcher is already compiled out of the production bundle.
   ============================================================ */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { DUMMY_USERS, type DashboardUser, type Role } from "@/lib/dashboard/data";

/** Shape of the fields we need off `session.user`. */
export interface SessionUserInput {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  phone?: string | null;
  isPremium?: boolean | null;
  verificationStatus?: string | null;
}

interface RoleCtx {
  role: Role;
  user: DashboardUser;
  setRole: (r: Role) => void;
}
const Ctx = createContext<RoleCtx | null>(null);

const VALID: Role[] = ["OWNER", "AGENT", "RENTER"];
const asRole = (v: unknown, fallback: Role): Role =>
  VALID.includes(v as Role) ? (v as Role) : fallback;

/** "Adaeze Okafor" → "AO"; falls back to the email's first letter. */
function initialsOf(name?: string | null, email?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email ?? "?").slice(0, 1).toUpperCase();
}

/** Merge the real session user over the dummy profile, so any field the
    session doesn't carry yet (plan copy, counters) still renders. */
function toDashboardUser(su: SessionUserInput | undefined, role: Role): DashboardUser {
  const base = DUMMY_USERS[role];
  if (!su) return base;
  return {
    ...base,
    name: su.name ?? base.name,
    email: su.email ?? base.email,
    initials: initialsOf(su.name, su.email),
    ...(su.phone ? { phone: su.phone } : {}),
    ...(su.verificationStatus ? { verificationStatus: su.verificationStatus } : {}),
    ...(typeof su.isPremium === "boolean" ? { isPremium: su.isPremium } : {}),
  } as DashboardUser;
}

export function RoleProvider({
  initialRole = "OWNER",
  sessionUser,
  children,
}: {
  initialRole?: Role;
  /** From `await auth()` in the dashboard server layout. */
  sessionUser?: SessionUserInput;
  children: ReactNode;
}) {
  // The session is the source of truth. Only fall back to the persisted
  // preview role when there's no session role (design preview / storybook).
  const sessionRole = asRole(sessionUser?.role, initialRole);
  const hasSessionRole = VALID.includes(asRole(sessionUser?.role, "" as Role));

  const [previewRole, setPreviewRole] = useState<Role>(() => {
    if (typeof window === "undefined") return initialRole;
    try {
      return (localStorage.getItem("nc-dash-role") as Role) || initialRole;
    } catch {
      return initialRole;
    }
  });

  const role = hasSessionRole ? sessionRole : previewRole;

  const setRole = (r: Role) => {
    setPreviewRole(r);
    try {
      localStorage.setItem("nc-dash-role", r);
    } catch {}
  };

  const value = useMemo(
    () => ({ role, user: toDashboardUser(sessionUser, role), setRole }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [role, sessionUser?.id, sessionUser?.name, sessionUser?.email, sessionUser?.phone]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRole(): RoleCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRole must be used inside <RoleProvider>");
  return v;
}
