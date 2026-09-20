"use client";

/* ============================================================
   ResetSiteData — the "sign-out didn't fix it" escape hatch.

   WHAT IT IS FOR
   A NextAuth JWT lives for 30 days and is signed, not checked against the
   database on every read. So a cookie can stay perfectly valid while the
   user row it points at is gone — deleted by an admin, swept by the
   stub-cleanup job, or wiped by a db:reset in development. The browser then
   sends a well-formed session for an account that does not exist, and every
   authenticated call 401s in a way the customer cannot escape: the retry
   button re-sends the same dead id forever. (payment-processing.tsx now
   self-heals that one case; this clears the whole class.)

   It also covers the ordinary mess: a half-finished OAuth round trip, a
   stale onboarding draft in localStorage, a cached service worker serving
   an old build.

   WHAT IT CANNOT DO — say this to customers plainly
   It clears NEWCONDO's data only. The user's Google and Facebook sessions
   live on accounts.google.com and facebook.com; same-origin policy means no
   script of ours can read or delete them, and no API exists to ask. The most
   we can do is disableAutoSelect() below, which stops Google One Tap from
   silently signing them back in on the next page load. To actually sign out
   of Google or Facebook they must do it on those sites.

   WHY IT IS DELIBERATELY QUIET
   Destructive and irreversible for anything unsaved. It sits as small print
   in the footer so support can direct someone to it ("scroll to the very
   bottom"), while a browsing customer never trips over it. Two taps: the
   label swaps to a confirm before anything is cleared.
   ============================================================ */

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

type Phase = "idle" | "confirm" | "clearing" | "done";

/** Bound a step so one hung API can't strand the whole reset.
 *
 *  WHY THIS EXISTS: every step below talks to a browser API that is allowed to
 *  never settle. On desktop they all resolve in milliseconds; on mobile Chrome
 *  they do not. The worst offender is step 2 — the clear-session response
 *  carries `Clear-Site-Data: "cache", "cookies", "storage"`, and while Chrome
 *  executes that directive it can leave the very fetch that triggered it
 *  pending. Awaiting it serially then meant the spinner ran forever and the
 *  reload at the end was never reached. */
function withTimeout<T>(label: string, ms: number, work: Promise<T>): Promise<T | void> {
  return Promise.race([
    work.catch((e) => {
      console.error(`[ResetSiteData] ${label} failed`, e);
    }),
    new Promise<void>((resolve) =>
      setTimeout(() => {
        console.warn(`[ResetSiteData] ${label} timed out after ${ms}ms — continuing`);
        resolve();
      }, ms)
    ),
  ]);
}

/** Expire one cookie across every path/domain scope it might have been set on. */
function expireCookie(name: string) {
  const { hostname } = window.location;
  // A cookie set for ".newcondo.homes" is invisible to a delete scoped to
  // "newcondo.homes" — and NextAuth's own scope varies with deployment. Try
  // every ancestor, bare and dot-prefixed, plus no domain at all.
  const domains = new Set<string>([""]);
  const parts = hostname.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const d = parts.slice(i).join(".");
    domains.add(d);
    domains.add(`.${d}`);
  }
  const paths = ["/", "/api", "/api/auth", window.location.pathname];
  for (const domain of domains) {
    for (const path of paths) {
      document.cookie =
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}` +
        (domain ? `; domain=${domain}` : "") +
        (window.location.protocol === "https:" ? "; secure; samesite=lax" : "");
    }
  }
}

async function clearEverything() {
  // 1. Cookies. HttpOnly ones (the NextAuth session token itself) are
  //    invisible to document.cookie by design, so the server route below is
  //    what actually removes them — this pass gets the readable remainder.
  try {
    for (const c of document.cookie.split(";")) {
      const name = c.split("=")[0]?.trim();
      if (name) expireCookie(name);
    }
  } catch (e) {
    console.error("[ResetSiteData] cookie clear failed", e);
  }

  // 2. The HttpOnly session cookies — only the server can unset these.
  //    Aborted at 3s: the response sets Clear-Site-Data, and mobile Chrome can
  //    leave this fetch pending while it acts on that header. The cookies are
  //    already gone by then — we just stop waiting for the acknowledgement.
  await withTimeout(
    "server session clear",
    3000,
    fetch("/api/user/clear-session", {
      method: "POST",
      credentials: "include",
      keepalive: true, // survives the page teardown that follows
      signal: AbortSignal.timeout?.(3000),
    })
  );

  // 3. Web storage — onboarding drafts, persisted tabs, the location gate.
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    console.error("[ResetSiteData] storage clear failed", e);
  }

  // 4. IndexedDB. databases() is unsupported in Firefox and older Safari, so
  //    fall back to deleting the ones we know we create rather than skipping.
  //    deleteDatabase fires onblocked (not onerror) when another tab holds the
  //    database open, and on mobile that tab is often still alive — hence the
  //    outer timeout as well as the onblocked handler.
  await withTimeout(
    "indexedDB clear",
    2500,
    (async () => {
      const idb = window.indexedDB as IDBFactory & { databases?: () => Promise<{ name?: string }[]> };
      const names = idb.databases
        ? (await idb.databases()).map((d) => d.name).filter(Boolean)
        : ["firebase-installations-database", "firebaseLocalStorageDb"];
      await Promise.all(
        (names as string[]).map(
          (n) =>
            new Promise<void>((resolve) => {
              const req = indexedDB.deleteDatabase(n);
              req.onsuccess = req.onerror = req.onblocked = () => resolve();
            })
        )
      );
    })()
  );

  // 5. Cache Storage + service workers — otherwise a stale build keeps being
  //    served and the "fresh start" still shows the old bug. On a large mobile
  //    cache this is the slowest step by far, so it is bounded too: an
  //    unevicted cache entry is a far smaller problem than a stuck spinner.
  await withTimeout(
    "cache clear",
    3000,
    (async () => {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    })()
  );

  // 6. Stop Google One Tap re-authenticating on the very next load. This is
  //    NOT a Google sign-out — it only clears the auto-select hint on this
  //    device, which is the entire extent of our reach into their session.
  try {
    (window as unknown as {
      google?: { accounts?: { id?: { disableAutoSelect?: () => void } } };
    }).google?.accounts?.id?.disableAutoSelect?.();
  } catch {
    /* One Tap not loaded on this page — nothing to disable. */
  }
}

export function ResetSiteData() {
  const [phase, setPhase] = useState<Phase>("idle");

  const run = async () => {
    if (phase === "clearing") return; // double-tap guard — easy to hit on touch
    setPhase("clearing");

    // Full reload, not router.refresh(): the point is to discard every scrap of
    // in-memory state too — React Query's cache, Zustand stores, the NextAuth
    // session object. A soft navigation would keep all of it. replace() so Back
    // can't return to an authenticated screen.
    let left = false;
    const leave = () => {
      if (left) return;
      left = true;
      window.location.replace("/");
    };

    // The reload is scheduled BEFORE the sweep, not after it. Previously it sat
    // behind `await clearEverything()`, so a single hung step (see withTimeout)
    // meant it never ran and the spinner turned forever — the mobile-Chrome bug.
    // Now the navigation is guaranteed: worst case the page reloads at 6s with
    // part of the sweep unfinished, and a reload is itself most of the cure.
    const watchdog = setTimeout(leave, 6000);

    try {
      await clearEverything();
    } finally {
      clearTimeout(watchdog);
      setPhase("done");
      // Short beat so "Cleared" is legible before the page goes.
      setTimeout(leave, 700);
    }
  };

  if (phase === "done" || phase === "clearing") {
    return (
      <span className="inline-flex items-center gap-2 text-[13px] text-text-on-dark-2">
        <Icon
          name={phase === "done" ? "check" : "loader-2"}
          size={14}
          className={phase === "clearing" ? "animate-spin" : "text-green-bright"}
        />
        {phase === "done" ? "Cleared — reloading…" : "Clearing…"}
      </span>
    );
  }

  if (phase === "confirm") {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-text-on-dark-2">
        {/* Says what SURVIVES, not just what goes. Without this line a customer
            can reasonably read "reset" as "delete my account and my data" —
            and then act on that belief. Account deletion is a separate,
            authenticated flow (Profile → Delete account); this only clears
            this browser. */}
        <span>Sign you out and clear saved data in this browser? Your account, properties and payments are not affected.</span>
        <button
          type="button"
          onClick={run}
          className="font-semibold text-cream underline decoration-[rgba(249,249,239,0.4)] underline-offset-[3px] transition-colors duration-200 ease-nc hover:decoration-cream"
        >
          Yes, reset
        </button>
        <button
          type="button"
          onClick={() => setPhase("idle")}
          className="transition-colors duration-200 ease-nc hover:text-cream"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPhase("confirm")}
      title="Signs you out and clears saved Newcondo data on this device. Does not affect your Google or Facebook account."
      className="inline-flex items-center gap-1.5 text-[13px] text-text-on-dark-2 transition-colors duration-200 ease-nc hover:text-cream"
    >
      <Icon name="refresh-cw" size={13} />
      Reset site data
    </button>
  );
}
