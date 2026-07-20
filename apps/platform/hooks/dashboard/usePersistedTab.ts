"use client";
import { useState } from "react";

/** Tab/filter state persisted to sessionStorage — so navigating into a
 *  detail page and back returns the user to the tab they were on. */
export function usePersistedTab(key: string, def: string): [string, (v: string) => void] {
  const [t, setT] = useState(() => {
    if (typeof window === "undefined") return def;
    try { return sessionStorage.getItem(key) || def; } catch { return def; }
  });
  const set = (v: string) => {
    setT(v);
    try { sessionStorage.setItem(key, v); } catch {}
  };
  return [t, set];
}
