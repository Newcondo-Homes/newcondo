"use client";

/* Hint control that lives INSIDE the navbar.

   • Collapsed (default): a compact pill — step number + title — sitting
     in the navbar (centered on mobile, beside "Mark property" on
     desktop). It covers nothing on the map.
   • Expanded: a dropdown card that opens BELOW the navbar, so the
     1·2·3·4 stepper to its right is never covered. The pill carries a
     gentle continuous pulse to signal it's tappable.
   ============================================================ */

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MapPin, ChevronDown, Hand, Camera, ShieldCheck, User, Phone, Home } from "lucide-react";
import { formatLatLng, type LatLngLiteral, type MarkStep, type PropertyLinkInfo } from "./marking-core";

const GUIDE: Record<MarkStep, { Icon: typeof Hand; title: string; lines: string[] }> = {
  locate: {
    Icon: MapPin,
    title: "Finding the property",
    lines: ["Allow location access so the maps can center on exactly where you're standing."],
  },
  mark: {
    Icon: Hand,
    title: "Mark the building",
    lines: [
      "Use the Satellite view to spot your house from above — it's easier to recognise your roof and compound.",
      "When you find it, tap your house — a green pin drops on both maps. Tap again to adjust.",
    ],
  },
  photos: {
    Icon: Camera,
    title: "Add photos",
    lines: ["Capture the entrance and key rooms so the owner can confirm it's their property."],
  },
  submit: {
    Icon: ShieldCheck,
    title: "Review & submit",
    lines: ["Check the pin sits on the right building, then submit. The owner is notified to confirm."],
  },
};

const STEP_NO: Record<MarkStep, string> = { locate: "1", mark: "2", photos: "3", submit: "4" };

export default function MarkingPanel({
  step,
  pin,
  photosCount,
  link,
  hasMasks,
  disabled = false,
}: {
  step: MarkStep;
  pin: LatLngLiteral | null;
  photosCount: number;
  link: PropertyLinkInfo;
  hasMasks: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const { Icon, title, lines } = GUIDE[step];

  // when disabled (e.g. while submitting) force the dropdown shut
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const pulse =
    reduce || open || disabled
      ? undefined
      : {
          boxShadow: [
            "0 0 0 0 rgba(0,143,90,0.45)",
            "0 0 0 9px rgba(0,143,90,0)",
            "0 0 0 0 rgba(0,143,90,0)",
          ],
        };
  const pulseTransition = { duration: 2.4, repeat: Infinity, ease: "easeOut" } as const;

  return (
    <div className="relative flex h-full items-center">
      {/* trigger pill (always in the navbar) */}
      <motion.button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-expanded={open}
        aria-label="Step details"
        animate={pulse}
        transition={pulseTransition}
        className="inline-flex max-w-[62vw] items-center gap-1.5 rounded-full border border-border-hair bg-surface px-2.5 py-1.5 text-ink shadow-[0_4px_14px_-6px_rgba(19,19,19,0.25)] transition-opacity disabled:opacity-50 sm:max-w-none sm:gap-2 sm:px-3"
      >
        <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-ink text-cream">
          <Icon size={12} strokeWidth={2} />
        </span>
        <span className="text-[12.5px] font-bold tracking-[-0.01em] text-text-primary">Step {STEP_NO[step]}</span>
        <span className="hidden truncate text-[12.5px] font-semibold text-text-secondary sm:inline">
          · {title}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={2.2}
          className={`flex-none text-text-tertiary transition-transform duration-300 ease-nc ${open ? "rotate-180" : ""}`}
        />
      </motion.button>

      {/* dropdown card (opens below the navbar — never covers the stepper) */}
      <AnimatePresence>
        {open && (
          <>
            {/* click-away */}
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default bg-transparent"
            />
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-3 right-3 top-[58px] z-50 w-auto overflow-hidden rounded-card border border-border-hair bg-[rgba(247,246,239,0.95)] shadow-[0_24px_60px_-16px_rgba(19,19,19,0.32)] backdrop-blur-[18px] sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-2 sm:w-[min(340px,calc(100vw-24px))]"
            >
              <div className="px-4 pb-4 pt-3.5">
                <span className="mb-2.5 block text-[15px] font-bold tracking-[-0.02em] text-text-primary">{title}</span>
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {lines.map((l, i) => (
                    <li key={i} className="flex gap-2.5 text-[13.5px] leading-[1.5] text-text-secondary">
                      <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-green" />
                      {l}
                    </li>
                  ))}
                </ul>

                {pin && (
                  <div className="mt-3.5 rounded-[14px] bg-surface-sunken px-3.5 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                        Pinned location
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-green-dark">
                        <span className="h-1.5 w-1.5 rounded-full bg-green" /> set
                      </span>
                    </div>
                    <p className="m-0 mt-1 font-mono text-[12.5px] text-text-primary">{formatLatLng(pin)}</p>
                    {step !== "mark" && (
                      <p className="m-0 mt-1.5 text-[12px] text-text-tertiary">
                        {photosCount} photo{photosCount === 1 ? "" : "s"} added
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-3.5 flex flex-col gap-2 border-t border-border-hair pt-3.5">
                  <Row Icon={Home} label="Property">
                    {link.address || "Address provided by the owner"}
                  </Row>
                  {link.ownerName && (
                    <Row Icon={User} label="Owner">
                      {link.ownerName}
                    </Row>
                  )}
                  {link.ownerPhone && (
                    <Row Icon={Phone} label="Contact">
                      <a href={`tel:${link.ownerPhone}`} className="font-semibold text-green-dark">
                        {link.ownerPhone}
                      </a>
                    </Row>
                  )}
                </div>

                {hasMasks && (
                  <div className="mt-3.5 flex items-center gap-2 text-[12px] text-text-tertiary">
                    <span className="h-3 w-3 flex-none rounded-[3px] border border-[rgba(192,57,43,0.85)] bg-[rgba(192,57,43,0.32)]" />
                    Red areas are already marked — they can&apos;t be claimed again.
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({
  Icon,
  label,
  children,
}: {
  Icon: typeof Home;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} strokeWidth={1.9} className="mt-0.5 flex-none text-text-tertiary" />
      <span className="min-w-0">
        <span className="block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
          {label}
        </span>
        <span className="block text-[13px] leading-[1.4] text-text-primary">{children}</span>
      </span>
    </div>
  );
}
