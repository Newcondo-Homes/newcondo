"use client";

/* ============================================================
   MarkingPhotoViewer — fullscreen image review lightbox.

   Opened from the Photos step "Review" button. Steps through the
   uploaded photos one at a time:
     • on-screen ◀ ▶ arrows that appear only when there's a photo
       in that direction (hidden on the first / last)
     • ←/→ arrow keys navigate, Esc closes
     • progress dots (tap to jump)
     • Cancel closes back to the Photos step (photos preserved)
     • Proceed advances to the Submit step
   ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const CAPTIONS = [
  "Building entrance",
  "Living area",
  "Kitchen",
  "Master bedroom",
  "Bedroom 2",
  "Bathroom",
  "Balcony view",
  "Street view",
];

export default function MarkingPhotoViewer({
  open,
  photos,
  onClose,
}: {
  open: boolean;
  photos: string[];
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const n = photos.length;

  // reset to first whenever it opens
  useEffect(() => {
    if (open) setIdx(0);
  }, [open]);

  const nav = useCallback(
    (d: number) => setIdx((i) => Math.min(Math.max(i + d, 0), n - 1)),
    [n]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nav(1);
      else if (e.key === "ArrowLeft") nav(-1);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, nav, onClose]);

  const showPrev = idx > 0;
  const showNext = idx < n - 1;

  return (
    <AnimatePresence>
      {open && n > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 z-[120] flex flex-col bg-[rgba(15,15,13,0.93)] backdrop-blur-[6px]"
        >
          {/* top */}
          <div className="flex flex-none items-center justify-between gap-4 px-[clamp(14px,3vw,28px)] py-4 text-cream">
            <div>
              <div className="text-[15px] font-bold tracking-[-0.02em]">Review property photos</div>
              <div className="mt-0.5 text-[12.5px] text-cream/60">
                {idx + 1} of {n}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-full border border-cream/20 bg-cream/[0.08] px-4 py-2.5 text-[13px] font-semibold text-cream transition-colors duration-200 hover:bg-cream/[0.16]"
            >
              <X size={16} strokeWidth={2.2} /> Close
            </button>
          </div>

          {/* stage */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-[clamp(14px,5vw,80px)] pb-2">
            {showPrev && (
              <button
                type="button"
                onClick={() => nav(-1)}
                aria-label="Previous"
                className="absolute left-[clamp(10px,2.5vw,28px)] top-1/2 z-[2] grid h-[52px] w-[52px] -translate-y-1/2 place-items-center rounded-full border border-cream/20 bg-[rgba(20,20,18,0.6)] text-cream backdrop-blur-[6px] transition-colors duration-200 hover:bg-[rgba(40,40,36,0.85)] active:scale-90"
              >
                <ChevronLeft size={24} strokeWidth={2.2} />
              </button>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex h-full max-h-full w-[min(820px,100%)] items-end justify-start overflow-hidden rounded-[20px] bg-surface-sunken shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
              >
                <Image
                  src={photos[idx]}
                  alt={CAPTIONS[idx % CAPTIONS.length]}
                  fill
                  sizes="820px"
                  className="object-contain"
                />
                <span className="relative z-[1] m-[18px] rounded-full bg-black/35 px-3 py-1.5 text-[13px] font-semibold text-white/90 backdrop-blur-[4px]">
                  {CAPTIONS[idx % CAPTIONS.length]}
                </span>
              </motion.div>
            </AnimatePresence>

            {showNext && (
              <button
                type="button"
                onClick={() => nav(1)}
                aria-label="Next"
                className="absolute right-[clamp(10px,2.5vw,28px)] top-1/2 z-[2] grid h-[52px] w-[52px] -translate-y-1/2 place-items-center rounded-full border border-cream/20 bg-[rgba(20,20,18,0.6)] text-cream backdrop-blur-[6px] transition-colors duration-200 hover:bg-[rgba(40,40,36,0.85)] active:scale-90"
              >
                <ChevronRight size={24} strokeWidth={2.2} />
              </button>
            )}
          </div>

          {/* dots */}
          <div className="flex flex-none justify-center gap-[7px] py-2 pb-[max(16px,env(safe-area-inset-bottom))]">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to photo ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`h-[7px] rounded-full transition-all duration-200 ${
                  i === idx ? "w-[22px] bg-cream" : "w-[7px] bg-cream/30 hover:bg-cream/50"
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
