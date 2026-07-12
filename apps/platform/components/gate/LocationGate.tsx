"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { GateScreen, type Audience, type GatePhase } from "./GateScreen";
import { describeAllowedAreas } from "@/lib/geo-access";
import { readStoredAccess, writeStoredAccess } from "@/lib/gate-storage";
import { GATE_EXEMPT_PATH_PREFIXES } from "@/lib/geo-access-config";

// Note: readStoredAccess/writeStoredAccess are an on-device DISPLAY cache only
// ("last known area"). The actual access decision is never taken from
// localStorage — it comes from `geoGranted`/`ipBypass` below, both resolved
// server-side in app/layout.tsx from signed/httpOnly cookies. A visitor
// hand-editing localStorage gains nothing.

type Status = "checking" | "granted" | GatePhase;

/**
 * Which audience's problems to show on the gate — driven by which landing
 * page the visitor is on (newcondo.homes/agents, /renters, or the default
 * property-owner homepage). Also honours the existing ?type=agent|renter
 * query param used by /features.
 */
function audienceFromRoute(pathname: string | null): Audience {
  const p = pathname ?? "";
  // Read the query string directly (client-only) instead of next/navigation's
  // useSearchParams — that hook forces a Suspense boundary, which we don't
  // want on a component mounted in the root layout above every page.
  const typeParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("type") : null;
  if (p.startsWith("/agents") || typeParam === "agent") return "agent";
  if (p.startsWith("/renters") || typeParam === "renter") return "renter";
  return "owner";
}

/**
 * Site-wide location gate. Wraps the whole app in the root layout.
 *
 * Order of checks on every load (all server-verified, tamper-proof):
 *  1. Is this route exempt? (GATE_EXEMPT_PATH_PREFIXES in geo-access-config.ts)
 *  2. Does this device carry the IP-whitelist bypass cookie? (middleware.ts)
 *  3. Does it carry a valid SIGNED geo-access cookie from a prior GPS pass?
 *     (app/api/geo-access + lib/geo-token.ts — httpOnly, HMAC-signed; a
 *     hand-edited or forged cookie fails verification and is ignored.)
 *  4. Otherwise: show the gate and ask for GPS location.
 */
export function LocationGate({
  children,
  ipBypass = false,
  geoGranted = false,
}: {
  children: React.ReactNode;
  /** Resolved server-side in app/layout.tsx from the httpOnly IP-whitelist cookie. */
  ipBypass?: boolean;
  /** Resolved server-side in app/layout.tsx by verifying the signed geo-access cookie. */
  geoGranted?: boolean;
}) {
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>("checking");
  const [audience, setAudience] = useState<Audience>("owner");
  const autoTriggered = useRef(false);

  const isExempt = GATE_EXEMPT_PATH_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  // Runs before paint on the client so already-granted visitors never see a flash of the gate.
  useLayoutEffect(() => {
    setAudience(audienceFromRoute(pathname));
    if (isExempt) {
      setStatus("granted");
      return;
    }
    if (ipBypass || geoGranted) {
      setStatus("granted");
      return;
    }
    setStatus("idle");
  }, [isExempt, ipBypass, geoGranted, pathname]);

  function requestLocation() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // The client only ever REPORTS coordinates. The server (app/api/geo-access)
          // makes the actual allow/deny decision and, if allowed, mints a signed
          // httpOnly cookie the client cannot forge or edit.
          const res = await fetch("/api/geo-access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });
          const result: { allowed: boolean; state: string | null; city: string | null } = await res.json();
          if (result.allowed) {
            // Informational on-device cache only — see the note at the top of this file.
            writeStoredAccess({ state: result.state as string, city: result.city, lat: latitude, lng: longitude });
            setStatus("granted");
          } else {
            setStatus("restricted");
          }
        } catch {
          setStatus("error");
        }
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  // Fire the native browser permission prompt automatically the first time the gate appears.
  useEffect(() => {
    if (status === "idle" && !autoTriggered.current) {
      autoTriggered.current = true;
      requestLocation();
    }
  }, [status]);

  // Lock page scroll (mobile + desktop) for every non-granted state.
  useEffect(() => {
    const gating = status !== "granted" && status !== "checking";
    if (!gating) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [status]);

  if (status === "checking") return null;
  if (status === "granted") return <>{children}</>;

  return (
    <GateScreen
      phase={status}
      audience={audience}
      allowedAreasText={describeAllowedAreas()}
      onRequest={requestLocation}
    />
  );
}
