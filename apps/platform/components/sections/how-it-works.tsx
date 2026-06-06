"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cx } from "@/lib/cx";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Icon } from "@/components/ui/icon";
import { STEPS } from "@/lib/data";

export function HowItWorks() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const carousel = carouselRef.current;
    const track = trackRef.current;
    const dotsWrap = dotsRef.current;
    const prev = prevRef.current;
    const next = nextRef.current;
    if (!carousel || !track || !dotsWrap || !prev || !next) return;

    const cards = Array.from(track.children) as HTMLElement[];
    const GAP = 28;
    let index = 0;
    let maxIndex = 0;

    const step = () => cards[0].getBoundingClientRect().width + GAP;
    const visible = () => {
      const cw = (track.parentElement as HTMLElement).getBoundingClientRect().width;
      return Math.max(1, Math.round((cw + GAP) / step()));
    };
    function buildDots() {
      maxIndex = Math.max(0, cards.length - visible());
      dotsWrap!.innerHTML = "";
      for (let i = 0; i <= maxIndex; i++) {
        const d = document.createElement("button");
        d.className = "cz-dot" + (i === index ? " active" : "");
        d.addEventListener("click", () => go(i));
        dotsWrap!.appendChild(d);
      }
    }
    function go(i: number) {
      index = Math.max(0, Math.min(i, maxIndex));
      gsap.to(track, { x: -index * step(), duration: REDUCED ? 0 : 0.82, ease: "expo.out" });
      Array.from(dotsWrap!.children).forEach((d, di) => d.classList.toggle("active", di === index));
      prev!.disabled = index === 0;
      next!.disabled = index === maxIndex;
    }
    const onPrev = () => go(index - 1);
    const onNext = () => go(index + 1);
    prev.addEventListener("click", onPrev);
    next.addEventListener("click", onNext);
    const arrowHandlers = cards.map((c) => {
      const a = c.querySelector(".cw-arrow");
      const h = () => go(index + 1);
      a?.addEventListener("click", h);
      return [a, h] as const;
    });

    // click-and-hold drag anywhere over the carousel
    let dragging = false,
      startX = 0,
      baseX = 0,
      moved = false;
    function onDown(e: PointerEvent) {
      if (e.button != null && e.button !== 0) return;
      if ((e.target as HTMLElement).closest("button, a")) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      baseX = Number(gsap.getProperty(track, "x")) || 0;
      carousel!.classList.add("is-grabbing");
      gsap.killTweensOf(track);
      try {
        carousel!.setPointerCapture(e.pointerId);
      } catch {
        /* no-op */
      }
    }
    function onMove(e: PointerEvent) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      const minX = -maxIndex * step();
      let nx = baseX + dx;
      if (nx > 0) nx = nx * 0.35;
      else if (nx < minX) nx = minX + (nx - minX) * 0.35;
      gsap.set(track, { x: nx });
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      carousel!.classList.remove("is-grabbing");
      const cur = Number(gsap.getProperty(track, "x")) || 0;
      go(Math.round(-cur / step()));
    }
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };
    const onDragStart = (e: Event) => e.preventDefault();
    carousel.addEventListener("pointerdown", onDown);
    carousel.addEventListener("pointermove", onMove);
    carousel.addEventListener("pointerup", onUp);
    carousel.addEventListener("pointercancel", onUp);
    carousel.addEventListener("click", onClickCapture, true);
    carousel.addEventListener("dragstart", onDragStart);

    function reset() {
      buildDots();
      index = Math.min(index, maxIndex);
      go(index);
    }
    reset();
    let rt: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(reset, 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      prev.removeEventListener("click", onPrev);
      next.removeEventListener("click", onNext);
      arrowHandlers.forEach(([a, h]) => a?.removeEventListener("click", h));
      carousel.removeEventListener("pointerdown", onDown);
      carousel.removeEventListener("pointermove", onMove);
      carousel.removeEventListener("pointerup", onUp);
      carousel.removeEventListener("pointercancel", onUp);
      carousel.removeEventListener("click", onClickCapture, true);
      carousel.removeEventListener("dragstart", onDragStart);
      window.removeEventListener("resize", onResize);
      clearTimeout(rt);
    };
  }, []);

  return (
    <Section id="how" label="How it works" cream>
      <div className="flex items-end justify-between gap-[30px] mb-12">
        <div className="max-w-[760px]">
          <Eyebrow className="mb-[18px]">How Newcondo works</Eyebrow>
          <h2 className="nc-h2" data-reveal>
            One platform. Every part of owning rental property — handled.
          </h2>
        </div>
        <svg className="how-arrow w-[clamp(80px,9vw,120px)] h-auto flex-none mb-1.5" viewBox="0 0 120 90" fill="none" aria-hidden="true">
          <path d="M10 12 C 70 6, 108 28, 96 70" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
          <path d="M82 58 L96 72 L108 56" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="carousel relative" ref={carouselRef}>
        <div className="carousel-track flex gap-7" ref={trackRef}>
          {STEPS.map((s) => (
            <article key={s.n} data-step className="cw-card group">
              <span className="absolute -top-[0.52em] right-1.5 z-0 font-mono text-[clamp(82px,8vw,128px)] font-semibold text-[rgba(19,19,19,0.15)] leading-none tracking-[-0.04em] pointer-events-none">
                {s.n}
              </span>
              <div
                className={cx("cw-img cw-anim relative z-[1] h-[340px] rounded-card overflow-hidden shadow-card", `cw-anim--${s.variant}`)}
                aria-hidden="true"
              >
                <span className="cw-blob b1" />
                <span className="cw-blob b2" />
                <span className="cw-blob b3" />
                <span className="cw-blob b4" />
                <span className="cw-anim-text">{s.anim}</span>
              </div>
              <div className="relative z-[1] pt-6 px-1">
                <span className="block text-[12px] font-semibold tracking-[0.12em] uppercase text-text-tertiary mb-3">{s.label}</span>
                <h3 className="text-[22px] font-bold tracking-[-0.025em] leading-[1.12] m-0 mb-3 text-text-primary transition-transform duration-[280ms] ease-nc group-hover:-translate-y-[3px]">
                  {s.title}
                </h3>
                <p className="text-[15px] leading-[1.55] text-text-secondary m-0">{s.text}</p>
              </div>
              <button
                className="cw-arrow circle-btn inline-flex items-center justify-center rounded-full mt-[22px] mx-1 bg-ink text-cream transition-[transform,background] duration-200 ease-nc hover:bg-black active:scale-[0.97]"
                style={{ width: 48, height: 48 }}
                aria-label="Next"
              >
                <Icon name="arrow-right" size={20} />
              </button>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-between mt-11">
          <div className="flex gap-2" ref={dotsRef} />
          <div className="flex gap-2.5">
            <button className="cz-btn" ref={prevRef} aria-label="Previous">
              <Icon name="arrow-left" size={20} />
            </button>
            <button className="cz-btn" ref={nextRef} aria-label="Next">
              <Icon name="arrow-right" size={20} />
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}
