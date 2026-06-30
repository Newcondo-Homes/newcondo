"use client";

/* ============================================================
   useCurrentUser — the signed-in visitor (if any), for the PUBLIC site.

   The chat lives on public marketing pages, where the visitor may or
   may not be signed in. When they ARE signed in we pre-fill their
   identity in Crisp so support knows who they're talking to.

   This reads the REAL session from the shared auth package
   (`@newcondo/auth/client`, which wraps NextAuth). We use the low-level
   `useSession` here rather than the platform's full `useAuth` hook,
   because that hook pulls in platform-only deps (auth store, api client,
   router). `useSession` is the shared, app-agnostic boundary.

   ⚠️ REQUIREMENT: the marketing app's root layout must be wrapped in the
   shared <SessionProvider> (from `@newcondo/auth/client`) for this to
   resolve a session. If it isn't, the chat still works for everyone —
   identity simply isn't pre-filled (user stays null).
   ============================================================ */

import { useMemo } from "react";
import { useSession } from "@newcondo/auth/client";

/** The fields the chat actually needs off the session user. The session
 *  `user` is widened to this shape; every field is optional so partial
 *  sessions (or a User type that names things slightly differently) still
 *  map cleanly. */
interface SessionUser {
  id?: string | number;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  /** NewCondo account type: RENTER | PROPERTY_OWNER | AGENT. */
  userType?: string | null;
  role?: string | null;
}

export interface CurrentUser {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  /** RENTER | PROPERTY_OWNER | AGENT, when known. */
  role?: string;
}

export interface UseCurrentUser {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

function fullName(u: SessionUser): string | undefined {
  if (u.name) return u.name;
  const joined = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return joined || undefined;
}

export function useCurrentUser(): UseCurrentUser {
  const { data: session, status } = useSession();

  const user = useMemo<CurrentUser | null>(() => {
    const u = session?.user as SessionUser | undefined;
    if (!u || u.id == null) return null;
    return {
      id: String(u.id),
      name: fullName(u),
      email: u.email ?? undefined,
      phone: u.phone ?? undefined,
      role: u.userType ?? u.role ?? undefined,
    };
  }, [session]);

  return {
    user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
}
