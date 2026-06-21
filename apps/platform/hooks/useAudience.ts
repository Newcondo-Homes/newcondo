"use client";

import { useEffect, useState } from "react";
import type { Audience } from "@/lib/pages-data";

const VALID: Audience[] = ["renter", "agent", "owner"];
const MAP: Record<string, Audience> = {
  renter: "renter", renters: "renter",
  agent: "agent", agents: "agent",
  owner: "owner", owners: "owner",
  "property-owner": "owner", "property-owners": "owner", landlord: "owner",
};

/**
 * Audience selection for the sub-pages. Defaults to "owner" on the server and
 * first client render (so hydration matches), then resolves `?type=` from the
 * URL or the last-used value from localStorage after mount. Persists changes.
 */
export function useAudience(): [Audience, (a: Audience) => void] {
  const [audience, setA] = useState<Audience>("owner");

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const raw = (qs.get("type") || qs.get("for") || qs.get("audience") || "").toLowerCase();
    if (MAP[raw]) { setA(MAP[raw]); return; }
    try {
      const s = localStorage.getItem("ncp.audience") as Audience | null;
      if (s && VALID.includes(s)) setA(s);
    } catch {}
  }, []);

  const setAudience = (a: Audience) => {
    setA(a);
    try { localStorage.setItem("ncp.audience", a); } catch {}
  };

  return [audience, setAudience];
}
