"use client";

/* ============================================================
   useBodyScrollLock — freeze the page behind an overlay.

   Shared by the dashboard Modal (sheets/dialogs) and the mobile
   sidebar drawer, so both behave identically.

   APPROACH: overflow:hidden, NOT position:fixed.

   The position-fixed trick (pin <body> at top:-scrollY, restore with
   window.scrollTo on release) is the usual iOS workaround, but it
   moves the document: the browser reports scrollY 0 while locked, and
   releasing has to scroll the page back. That's exactly the reported
   behaviour — the blurred page appears to jump to the top when a modal
   opens and snaps back when it closes. Any layout read while locked
   also sees the wrong offset.

   Setting `overflow: hidden` instead leaves the scroll position
   completely untouched: nothing moves on open, nothing to restore on
   close, so there is no jump in either direction. Scroll CHAINING (the
   gesture leaking to the page behind) is handled where it belongs — by
   `overscroll-none` on the scrim and `overscroll-contain` on the
   scrollable panel — rather than by relocating the document.

   We also pad for the scrollbar's width on desktop, since hiding
   overflow reclaims that space and would otherwise shift the page a
   few pixels sideways.

   Nested overlays are refcounted, so closing an inner dialog doesn't
   unlock the page while an outer one is still open.
   ============================================================ */

import { useEffect } from "react";

let lockCount = 0;
let prev: { htmlOverflow: string; bodyOverflow: string; bodyPadRight: string } | null = null;

export function lockBodyScroll() {
  lockCount += 1;
  if (lockCount > 1) return;

  const html = document.documentElement;
  const body = document.body;
  prev = {
    htmlOverflow: html.style.overflow,
    bodyOverflow: body.style.overflow,
    bodyPadRight: body.style.paddingRight,
  };

  // Desktop only: replace the scrollbar's width so the page doesn't shift.
  const gap = window.innerWidth - html.clientWidth;
  if (gap > 0) {
    const current = parseFloat(getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${current + gap}px`;
  }

  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  body.style.overscrollBehavior = "none";
}

export function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0 || !prev) return;

  const html = document.documentElement;
  const body = document.body;
  html.style.overflow = prev.htmlOverflow;
  body.style.overflow = prev.bodyOverflow;
  body.style.paddingRight = prev.bodyPadRight;
  body.style.overscrollBehavior = "";
  prev = null;
  // No window.scrollTo here — the page never moved, so there is nothing to
  // restore. That absence IS the fix for the snap-back.
}

/** Locks while `active` is true (default: for the component's lifetime). */
export function useBodyScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;
    lockBodyScroll();
    return unlockBodyScroll;
  }, [active]);
}
