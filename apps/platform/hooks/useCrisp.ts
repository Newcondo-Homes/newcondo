"use client";

/* ============================================================
   useCrisp — boots Crisp on public pages and drives our own bubble.

   Responsibilities:
   • Load the Crisp SDK once (only when a website id is configured).
   • Hide Crisp's default launcher — the NewCondo bubble is the launcher.
     (We re-show Crisp's box only when a reply arrives, so the user
      notices it even with our bubble.)
   • Pre-fill identity for signed-in users + pin their session to a
     stable token so history follows the account.
   • Track unread replies + whether a conversation has been started
     (so the "New chat" control only appears when there's something to
     clear). The "started" flag is persisted in browser storage.
   • Expose open() / reset() actions to the bubble.
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
} from "@/lib/crisp";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const STARTED_KEY = "newcondo.crisp.started";
/** Public custom event any element can dispatch to open the chat. */
export const OPEN_CHAT_EVENT = "newcondo:open-chat";

function readStarted(): boolean {
  try {
    return localStorage.getItem(STARTED_KEY) === "1";
  } catch {
    return false;
  }
}

export interface UseCrisp {
  /** Chat is configured + available on this page. */
  available: boolean;
  /** Number of unread replies from support. */
  unread: number;
  /** A conversation has been started (so "New chat" is meaningful). */
  hasConversation: boolean;
  /** Open (and reveal) the Crisp chat. */
  open: () => void;
  /** Clear the saved conversation and start a fresh one. */
  reset: () => void;
  /** Crisp session has finished loading (widget is actually ready to use). */
  ready: boolean;
  /** An open()/reset() call is waiting on Crisp to finish booting. */
  connecting: boolean;
}

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

  // Boot Crisp ONCE, but only after the session has settled — the account
  // token (CRISP_TOKEN_ID) must be set BEFORE the SDK loads so a signed-in
  // user's history is pinned to their account from the first session.
  useEffect(() => {
    if (bootedRef.current) return;
    if (!isCrispConfigured()) return;
    if (authLoading) return; // wait until we know whether there's a user

    bootedRef.current = true;
    const ok = loadCrisp(user ? { tokenId: `nc_${user.id}` } : undefined);
    if (!ok) return;
    setAvailable(true);
    setHasConversation(readStarted());

    // Our bubble is the launcher → keep Crisp's own launcher hidden,
    // but reveal its box when a reply lands so the user sees it.
    hideDefaultLauncher();

    // NOTE: only hide the launcher on initial session load. Do NOT also
    // hide on "chat:closed" — chat:hide itself fires chat:closed, which
    // re-triggers hideDefaultLauncher() → chat:hide → chat:closed forever.
    // That synchronous feedback loop is what was freezing mobile browsers.
    onCrisp("session:loaded", () => {
      hideDefaultLauncher();
      setReady(true);
      // Run whatever open()/reset() call was waiting on boot.
      if (pendingActionRef.current) {
        const run = pendingActionRef.current;
        pendingActionRef.current = null;
        run();
      }
      setConnecting(false);
    });
    onCrisp("chat:opened", () => setUnread(0));

    // Fallback: if the network is slow / blocked and session:loaded never
    // fires, stop showing "connecting" after a few seconds rather than
    // spinning forever — Crisp's own queue will still catch up if it loads.
    const readyTimeout = window.setTimeout(() => {
      setReady((r) => r || true);
      setConnecting(false);
    }, 6000);

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
    // Identity is pushed by the effect below once `available` is true.
    return () => window.clearTimeout(readyTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  // Pre-fill identity whenever we have a signed-in user (and chat is up).
  // Also covers the case where a visitor signs in after the chat booted.
  useEffect(() => {
    if (!available) return;
    const identity = identityFor(user);
    if (identity) setIdentity(identity);
  }, [available, user]);

  const open = useCallback(() => {
    if (!ready) {
      // Widget script/session isn't up yet — queue the open and show a
      // loading state instead of a tap that appears to do nothing.
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
      // Re-pre-fill identity onto the fresh session for signed-in users.
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

  // Let any element open the chat by dispatching OPEN_CHAT_EVENT.
  useEffect(() => {
    if (!available) return;
    const handler = () => open();
    window.addEventListener(OPEN_CHAT_EVENT, handler);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handler);
  }, [available, open]);

  return { available, unread, hasConversation, open, reset, ready, connecting };
}
