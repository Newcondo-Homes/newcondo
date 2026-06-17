"use client";

/* Slide-up photo sheet. Uploads via the platform's useUpload hook
   (passed in as onFiles) and shows a thumbnail grid. */

import { useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Camera, X, Loader2, Check, Plus, Trash2 } from "lucide-react";

export default function MarkingPhotoSheet({
  open,
  photos,
  uploading,
  onClose,
  onFiles,
  onRemove,
}: {
  open: boolean;
  photos: string[];
  uploading: boolean;
  onClose: () => void;
  onFiles: (files: File[]) => void;
  onRemove: (index: number) => void;
}) {
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const atMax = photos.length >= 8;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 z-30 bg-ink/40 backdrop-blur-[2px]"
          />
          <motion.div
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[720px] rounded-t-[26px] border border-border-hair bg-surface p-[clamp(18px,2.4vw,28px)] shadow-[0_-24px_60px_-16px_rgba(19,19,19,0.3)]"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="m-0 text-[clamp(19px,2vw,23px)] font-bold tracking-[-0.025em] text-text-primary">
                  Property photos
                </h2>
                <p className="m-0 mt-1 text-[13.5px] leading-[1.5] text-text-secondary">
                  Entrance, living area, bedrooms, kitchen, bathrooms. {photos.length}/8 added.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 flex-none place-items-center rounded-full text-text-tertiary transition-colors duration-200 ease-nc hover:bg-surface-sunken hover:text-ink"
                aria-label="Close"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2.5 max-[520px]:grid-cols-3">
              {photos.map((url, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-[14px] border border-border-hair bg-surface-sunken">
                  <Image src={url} alt={`Property photo ${i + 1}`} fill sizes="160px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-ink/75 text-cream shadow-[0_4px_12px_-2px_rgba(19,19,19,0.5)] backdrop-blur-sm transition-transform duration-200 ease-nc hover:scale-110 active:scale-95"
                    aria-label={`Delete photo ${i + 1}`}
                  >
                    <Trash2 size={15} strokeWidth={2} />
                  </button>
                </div>
              ))}

              {!atMax && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="grid aspect-square place-items-center rounded-[14px] border-2 border-dashed border-border-strong bg-surface-sunken/60 text-text-tertiary transition-colors duration-200 ease-nc hover:border-ink hover:text-ink disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 size={22} strokeWidth={2} className="animate-spin" />
                  ) : (
                    <span className="flex flex-col items-center gap-1">
                      {photos.length === 0 ? <Camera size={22} strokeWidth={1.9} /> : <Plus size={22} strokeWidth={2} />}
                      <span className="text-[11.5px] font-semibold">{photos.length === 0 ? "Add" : "More"}</span>
                    </span>
                  )}
                </button>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) onFiles(files);
                e.target.value = "";
              }}
            />

            <button
              type="button"
              onClick={onClose}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[15px] font-semibold text-cream transition-[transform,background] duration-200 ease-nc hover:bg-black active:scale-[0.98]"
            >
              <Check size={18} strokeWidth={2.2} />
              Done{photos.length > 0 ? ` — ${photos.length} added` : ""}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
