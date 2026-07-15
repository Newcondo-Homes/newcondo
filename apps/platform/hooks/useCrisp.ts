"use client";

/* ============================================================
   useCrisp — boots the Crisp SDK and drives it.

   Used ONLY by app/chat/page.tsx (the dedicated chat page — see that file
   for why chat lives on its own route instead of an overlay on marketing
   pages). Responsibilities:
   • Load the Crisp SDK once available is configured + auth has resolved
     (the account token must be set before the SDK loads).
   • Hide Crisp's default launcher bubble — this page supplies its own
     chrome (see app/chat/page.tsx), Crisp only needs to render its chat
     window, not its own floating icon.
   • Pre-fill identity for signed-in users so support sees who they are.
   • Track unread replies + whether a conversation exists (drives the
     page's "New chat" control). The "started" flag persists across visits
     in localStorage.
   • Expose open()/reset() actions.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadCrisp,
  isCrispConfigured,
  hideDefaultLauncher,
  showDefaultLauncher,
  openChat as openCrisp,
  resetChat as resetCrisp,
  setIdentity,
  onCrisp,
  onSessionReady,
} from "@/lib/crisp";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const STARTED_KEY = "newcondo.crisp.started";

function readStarted(): boolean {
  try {
    return localStorage.getItem(STARTED_KEY) === "1";
  } catch {
    return false;
  }
}

export interface UseCrisp {
  /** Chat is configured (website id present) and the SDK has been injected. */
  available: boolean;
  /** Crisp session has finished loading — safe to open/reset now. */
  ready: boolean;
  /** Number of unread replies from support. */
  unread: number;
  /** A conversation has been started (so "New chat" is meaningful). */
  hasConversation: boolean;
  /** An open()/reset() call is waiting on Crisp to finish booting. */
  connecting: boolean;
  /** Open (and reveal) the Crisp chat. */
  open: () => void;
  /** Clear the saved conversation and start a fresh one. */
  reset: () => void;
}

/** Public custom event any element can dispatch to open the chat — used by
 *  the inline popover ChatButton (every page except Home, which links to
 *  the dedicated /chat page instead — see app/chat/page.tsx for why). */
export const OPEN_CHAT_EVENT = "newcondo:open-chat";

/** Build the Crisp identity payload from a user (or null). */
function identityFor(user: ReturnType<typeof useCurrentUser>["user"]) {
  if (!user) return null;
  return {
    name: user.name,
    email: user.email,
    phone: user.phone,
    data: {
      ...(user.id ? { user_id: user.id } : {}),
      ...(user.role ? { role: user.role } : {}),
      source: "marketing-site",
    },
  };
}

export function useCrisp(): UseCrisp {
  const { user, isLoading: authLoading } = useCurrentUser();
  const [available, setAvailable] = useState(false);
  const [ready, setReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [unread, setUnread] = useState(0);
  const [hasConversation, setHasConversation] = useState(false);
  const bootedRef = useRef(false);
  const pendingActionRef = useRef<null | (() => void)>(null);

  // Boot Crisp once the session has settled — the account token
  // (CRISP_TOKEN_ID) must be set BEFORE the SDK loads so a signed-in
  // user's history is pinned to their account from the first session.
  useEffect(() => {
    if (bootedRef.current) return;
    if (!isCrispConfigured()) return;
    if (authLoading) return;
    bootedRef.current = true;

    const ok = loadCrisp(user ? { tokenId: `nc_${user.id}` } : undefined);
    if (!ok) return;
    setAvailable(true);
    setHasConversation(readStarted());
    hideDefaultLauncher();

    onSessionReady(() => {
      hideDefaultLauncher();
      setReady(true);
      if (pendingActionRef.current) {
        const run = pendingActionRef.current;
        pendingActionRef.current = null;
        run();
      }
      setConnecting(false);
    });
    onCrisp("chat:opened", () => setUnread(0));
    onCrisp("message:sent", () => {
      try {
        localStorage.setItem(STARTED_KEY, "1");
      } catch {}
      setHasConversation(true);
    });
    onCrisp("message:received", () => {
      try {
        localStorage.setItem(STARTED_KEY, "1");
      } catch {}
      setHasConversation(true);
      showDefaultLauncher();
      setUnread((n) => n + 1);
    });

    // Fallback: if the network is slow/blocked and session:loaded never
    // fires, stop showing "connecting" after a few seconds instead of
    // spinning forever — Crisp's own queue still catches up if it loads.
    const readyTimeout = window.setTimeout(() => {
      setReady((r) => r || true);
      setConnecting(false);
    }, 8000);
    return () => window.clearTimeout(readyTimeout);
  }, [authLoading, user]);

  // Pre-fill identity whenever we have a signed-in user (and chat is up).
  useEffect(() => {
    if (!available) return;
    const identity = identityFor(user);
    if (identity) setIdentity(identity);
  }, [available, user]);

  const open = useCallback(() => {
    if (!ready) {
      pendingActionRef.current = () => {
        openCrisp();
        setUnread(0);
      };
      setConnecting(true);
      return;
    }
    openCrisp();
    setUnread(0);
  }, [ready]);

  const reset = useCallback(() => {
    const run = () => {
      resetCrisp();
      try {
        localStorage.removeItem(STARTED_KEY);
      } catch {}
      setHasConversation(false);
      setUnread(0);
      const identity = identityFor(user);
      if (identity) setIdentity(identity);
      openCrisp();
    };
    if (!ready) {
      pendingActionRef.current = run;
      setConnecting(true);
      return;
    }
    run();
  }, [ready, user]);

  return { available, ready, unread, hasConversation, connecting, open, reset };
}

/** Lets any element (e.g. the support page's "Live chat" card) open the
 *  inline popover chat by dispatching OPEN_CHAT_EVENT. */
export function useOpenChatEvent(available: boolean, open: () => void) {
  useEffect(() => {
    if (!available) return;
    const handler = () => open();
    window.addEventListener(OPEN_CHAT_EVENT, handler);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handler);
  }, [available, open]);
}
