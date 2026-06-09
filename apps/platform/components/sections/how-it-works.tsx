"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, type PanInfo } from "framer-motion";
import { cx } from "@/lib/cx";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Icon } from "@/components/ui/icon";
import { Reveal, vFade, reveal, EASE, EXPO } from "@/components/motion";
import { STEPS } from "@/lib/data";

const GAP = 28;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

export function HowItWorks() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const [index, setIndex] = useState(0);
  const [metrics, setMetrics] = useState({ step: 1, maxIndex: 0 });

  const measure = useCallback(() => {
    const track = trackRef.current;
    const vp = viewportRef.current;
    if (!track || !vp) return;
    const first = track.children[0] as HTMLElement | undefined;
    if (!first) return;
    const step = first.getBoundingClientRect().width + GAP;
    const visible = Math.max(1, Math.round((vp.getBoundingClientRect().width + GAP) / step));
    const maxIndex = Math.max(0, STEPS.length - visible);
    setMetrics({ step, maxIndex });
    setIndex((i) => clamp(i, 0, maxIndex));
  }, []);

  useEffect(() => {
    measure();
    let rt: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(measure, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(rt);
    };
  }, [measure]);

  useEffect(() => {
    controls.start({ x: -index * metrics.step, transition: { duration: 0.7, ease: EXPO } });
  }, [index, metrics.step, controls]);

  const go = (i: number) => setIndex(clamp(i, 0, metrics.maxIndex));

  const onDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const moved = Math.round(-info.offset.x / metrics.step);
    const ni = clamp(index + moved, 0, metrics.maxIndex);
    setIndex(ni);
    controls.start({ x: -ni * metrics.step, transition: { duration: 0.6, ease: EXPO } });
  };

  return (
    <Section id="how" label="How it works" cream>
      <div className="flex items-end justify-between gap-[30px] mb-12">
        <div className="max-w-[760px]">
          <Eyebrow className="mb-[18px]">How Newcondo works</Eyebrow>
          <Reveal as="h2" className="nc-h2">
            One platform. Every part of owning rental property — handled.
          </Reveal>
        </div>
        <svg className="how-arrow w-[clamp(80px,9vw,120px)] h-auto flex-none mb-1.5" viewBox="0 0 120 90" fill="none" aria-hidden="true">
          <motion.path
            d="M10 12 C 70 6, 108 28, 96 70"
            stroke="var(--ink)"
            strokeWidth="3"
            strokeLinecap="round"
            variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 0.8, ease: EASE } } }}
            {...reveal}
          />
          <motion.path
            d="M82 58 L96 72 L108 56"
            stroke="var(--ink)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 0.5, ease: EASE, delay: 0.5 } } }}
            {...reveal}
          />
        </svg>
      </div>

      <motion.div className="carousel relative overflow-hidden" ref={viewportRef} variants={vFade} {...reveal}>
        <motion.div
          className="carousel-track flex gap-7"
          ref={trackRef}
          animate={controls}
          drag="x"
          dragElastic={0.12}
          dragConstraints={{ left: -metrics.maxIndex * metrics.step, right: 0 }}
          onDragStart={() => viewportRef.current?.classList.add("is-grabbing")}
          onDragEnd={(e, info) => {
            viewportRef.current?.classList.remove("is-grabbing");
            onDragEnd(e, info);
          }}
        >
          {STEPS.map((s) => (
            <article key={s.n} className="cw-card group">
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
                onClick={() => go(index + 1)}
                className="cw-arrow circle-btn inline-flex items-center justify-center rounded-full mt-[22px] mx-1 bg-ink text-cream transition-[transform,background] duration-200 ease-nc hover:bg-black active:scale-[0.97]"
                style={{ width: 48, height: 48 }}
                aria-label="Next"
              >
                <Icon name="arrow-right" size={20} />
              </button>
            </article>
          ))}
        </motion.div>

        <div className="flex items-center justify-between mt-11">
          <div className="flex gap-2">
            {Array.from({ length: metrics.maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={cx("cz-dot", i === index && "active")}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <div className="flex gap-2.5">
            <button className="cz-btn" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous">
              <Icon name="arrow-left" size={20} />
            </button>
            <button className="cz-btn" onClick={() => go(index + 1)} disabled={index === metrics.maxIndex} aria-label="Next">
              <Icon name="arrow-right" size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}
