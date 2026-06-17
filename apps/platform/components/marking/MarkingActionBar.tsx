"use client";

/* Bottom-center action bar. Its content + buttons change per step.
   Always floats over the maps; never pushes them off-screen. */

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Hand, Crosshair, X, ArrowRight, ArrowLeft, Camera, Loader2, ShieldCheck } from "lucide-react";
import type { LatLngLiteral, MarkStep } from "./marking-core";

export default function MarkingActionBar({
  step,
  pin,
  photosCount,
  submitting,
  viewerOpen,
  onDropAtMe,
  onClear,
  onContinue,
  onBack,
  onOpenPhotos,
  onReview,
  onProceed,
  onSubmit,
}: {
  step: MarkStep;
  pin: LatLngLiteral | null;
  photosCount: number;
  submitting: boolean;
  viewerOpen: boolean;
  onDropAtMe: () => void;
  onClear: () => void;
  onContinue: () => void;
  onBack: () => void;
  onOpenPhotos: () => void;
  onReview: () => void;
  onProceed: () => void;
  onSubmit: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto w-[min(560px,calc(100vw-24px))] rounded-[20px] border border-border-hair bg-[rgba(247,246,239,0.9)] px-4 py-3 shadow-[0_24px_60px_-16px_rgba(19,19,19,0.3)] backdrop-blur-[18px]"
    >
      <AnimatePresence mode="wait">
        {/* ---- MARK: nothing pinned yet ---- */}
        {step === "mark" && !pin && (
          <Swap key="mark-empty" reduce={reduce}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-ink/[0.06] text-ink">
                <Hand size={20} strokeWidth={1.9} />
              </span>
              <p className="m-0 flex-1 text-[14px] leading-[1.4] text-text-primary">
                Find your house on the <strong>Satellite</strong> view, then tap it to drop a pin.
              </p>
              <button
                type="button"
                onClick={onDropAtMe}
                className="inline-flex flex-none items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3.5 py-2.5 text-[13px] font-semibold text-ink transition-colors duration-200 ease-nc hover:bg-surface-sunken max-[520px]:hidden"
              >
                <Crosshair size={15} strokeWidth={2} /> At my spot
              </button>
            </div>
          </Swap>
        )}

        {/* ---- MARK: pinned ---- */}
        {step === "mark" && pin && (
          <Swap key="mark-pinned" reduce={reduce}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-green-wash text-green-dark">
                <ShieldCheck size={20} strokeWidth={1.9} />
              </span>
              <p className="m-0 flex-1 text-[14px] leading-[1.35] text-text-primary">
                Building pinned. Adjust by tapping again, or continue.
              </p>
              <button
                type="button"
                onClick={onClear}
                className="inline-flex flex-none items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3.5 py-2.5 text-[13px] font-semibold text-ink transition-colors duration-200 ease-nc hover:bg-surface-sunken"
              >
                <X size={15} strokeWidth={2.2} /> Clear
              </button>
              <button
                type="button"
                onClick={onContinue}
                className="group inline-flex flex-none items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-cream transition-[transform,background] duration-200 ease-nc hover:bg-black active:scale-[0.97]"
              >
                Continue
                <ArrowRight size={16} strokeWidth={2.2} className="transition-transform duration-200 ease-nc group-hover:translate-x-0.5" />
              </button>
            </div>
          </Swap>
        )}

        {/* ---- PHOTOS ---- */}
        {step === "photos" && (
          <Swap key="photos" reduce={reduce}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="grid h-10 w-10 flex-none place-items-center rounded-full border border-border-strong bg-surface text-ink transition-colors duration-200 ease-nc hover:bg-surface-sunken"
                aria-label="Back"
              >
                <ArrowLeft size={18} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={onOpenPhotos}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border-strong bg-surface px-4 py-2.5 text-[14px] font-semibold text-ink transition-colors duration-200 ease-nc hover:bg-surface-sunken"
              >
                <Camera size={17} strokeWidth={2} />
                {photosCount > 0 ? `${photosCount} photo${photosCount === 1 ? "" : "s"} added — add more` : "Add photos"}
              </button>
              <button
                type="button"
                onClick={viewerOpen ? onProceed : onReview}
                disabled={photosCount === 0}
                className="group inline-flex flex-none items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-cream transition-[transform,background] duration-200 ease-nc hover:bg-black active:scale-[0.97] disabled:cursor-default disabled:opacity-50"
              >
                {viewerOpen ? "Proceed" : "Review"}
                <ArrowRight size={16} strokeWidth={2.2} className="transition-transform duration-200 ease-nc group-hover:translate-x-0.5" />
              </button>
            </div>
          </Swap>
        )}

        {/* ---- SUBMIT ---- */}
        {step === "submit" && (
          <Swap key="submit" reduce={reduce}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                disabled={submitting}
                className="grid h-11 w-11 flex-none place-items-center rounded-full border border-border-strong bg-surface text-ink transition-colors duration-200 ease-nc hover:bg-surface-sunken disabled:opacity-50"
                aria-label="Back"
              >
                <ArrowLeft size={18} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting}
                className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-3.5 text-[15.5px] font-semibold text-cream transition-[transform,background] duration-200 ease-nc hover:bg-black active:scale-[0.98] disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} strokeWidth={2} className="animate-spin" /> Submitting marking…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} strokeWidth={2} /> Submit marking
                  </>
                )}
              </button>
            </div>
          </Swap>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Swap({ children, reduce }: { children: React.ReactNode; reduce: boolean | null }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
