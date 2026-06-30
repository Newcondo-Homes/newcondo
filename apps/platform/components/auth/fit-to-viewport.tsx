"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Scales its children DOWN (never up) so a step always fits the height it's
 * given — no page scroll, no clipping. On roomy screens the scale stays 1 and
 * nothing changes; on short laptops / phones it shrinks just enough to fit.
 *
 * A CSS `transform: scale()` doesn't affect layout/scrollHeight, so we read the
 * child's natural height, compare it to the available height, and scale by
 * `available / natural`. The child is vertically centred, so the (smaller)
 * scaled box lands exactly inside the frame.
 *
 * The scale is applied IMPERATIVELY (`inner.style.transform`) rather than via
 * React state, on purpose: the child can change height *in place* (e.g.
 * OnboardingForm swapping its account → details sub-step, or validation errors
 * appearing) without this wrapper re-rendering. MutationObserver/ResizeObserver
 * callbacks run after the DOM is committed but before paint, so writing the
 * transform synchronously in them re-fits the content with no clipped frame and
 * no dependency on a React render or a requestAnimationFrame actually firing.
 */
export default function FitToViewport({
  children,
  className = "",
}: {
  children: ReactNode;
  /** Applied to the (centered) inner wrapper — pass max-width + mx-auto here. */
  className?: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let raf = 0;

    const recompute = () => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;
      const availH = outer.clientHeight;
      const naturalH = inner.scrollHeight; // unaffected by the transform
      const next = availH > 0 && naturalH > 0 ? Math.min(1, availH / naturalH) : 1;
      // Apply straight to the DOM — synchronous, before the next paint.
      // CRITICAL: only set transform/will-change when we ACTUALLY scale down.
      // `transform: scale(1)` AND `will-change: transform` each turn this node
      // into the containing block for position:fixed descendants — which traps
      // any fixed-positioned overlay rendered inside the flow (e.g. the
      // Flutterwave checkout iframe), so it resolves against this small,
      // centered box and gets clipped by the overflow:hidden frame → invisible.
      // Emitting `none` when no scaling is needed lets fixed overlays escape to
      // the viewport as intended.
      if (next < 1) {
        inner.style.transform = `scale(${next})`;
        inner.style.willChange = "transform";
      } else {
        inner.style.transform = "none";
        inner.style.willChange = "auto";
      }
    };

    const schedule = () => {
      // Run now (observers fire after the DOM is committed → layout is valid),
      // then once more next frame to settle late reflow (fonts, images, async).
      recompute();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(recompute);
    };

    schedule();

    const ro = new ResizeObserver(schedule);
    if (outerRef.current) ro.observe(outerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);

    // Catches in-place content swaps / error rows the ResizeObserver may miss.
    // (childList/subtree/characterData only — NOT attributes, so our own
    // transform write doesn't feed back into the observer.)
    const mo = new MutationObserver(schedule);
    if (innerRef.current) {
      mo.observe(innerRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div ref={outerRef} className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div
        ref={innerRef}
        style={{ transformOrigin: "center center" }}
        className={`w-full ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
