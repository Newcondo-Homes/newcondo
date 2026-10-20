// apps/vendors/store/ui.ts — which job sheet is open (any page can open one)
"use client";
import { create } from "zustand";

interface UI { openJob: string | null; verifyJob: string | null; setOpenJob: (id: string | null) => void; setVerifyJob: (id: string | null) => void }
export const useUI = create<UI>((set) => ({
  openJob: null, verifyJob: null,
  setOpenJob: (openJob) => set({ openJob }),
  setVerifyJob: (verifyJob) => set({ verifyJob, openJob: null }),
}));
