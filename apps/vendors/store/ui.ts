// apps/vendors/store/ui.ts — dashboard UI state that must survive page switches:
// which job sheet is open, and which tab each page was on.
// In-memory (zustand), so going back to a page shows the same tab instantly
// with no flicker; a full reload starts from the defaults.
"use client";
import { create } from "zustand";

interface UI {
  openJob: string | null; verifyJob: string | null; tabs: Record<string, string>;
  setOpenJob: (id: string | null) => void; setVerifyJob: (id: string | null) => void; setTab: (key: string, v: string) => void;
}
export const useUI = create<UI>((set) => ({
  openJob: null, verifyJob: null, tabs: {},
  setOpenJob: (openJob) => set({ openJob }),
  setVerifyJob: (verifyJob) => set({ verifyJob, openJob: null }),
  setTab: (key, v) => set((s) => ({ tabs: { ...s.tabs, [key]: v } })),
}));
