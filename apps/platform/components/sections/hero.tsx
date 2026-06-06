"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { SplitButton } from "@/components/ui/split-button";
import { makePerlin } from "@/lib/perlin";

/** Procedural "ethereal shadows" — domain-warped fractal Perlin noise. */
function useEtherealShadows(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const noise = makePerlin();
    const W = 168;
    let H = 96;
    let raf = 0;
    let rt: ReturnType<typeof setTimeout>;

    function resize() {
      const r = canvas!.getBoundingClientRect();
      H = Math.max(60, Math.round(W * (r.height / Math.max(1, r.width))));
      canvas!.width = W;
      canvas!.height = H;
    }
    resize();
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(resize, 200);
    };
    window.addEventListener("resize", onResize);

    function fbm(x: number, y: number, z: number) {
      let f = 0,
        amp = 0.5,
        freq = 1;
      for (let o = 0; o < 3; o++) {
        f += amp * noise(x * freq, y * freq, z);
        freq *= 2;
        amp *= 0.5;
      }
      return f;
    }

    function render(time: number) {
      const img = ctx!.createImageData(W, H);
      const data = img.data;
      const t = time * 0.6;
      const flow = time;
      for (let j = 0; j < H; j++) {
        const ny = j / H;
        for (let i = 0; i < W; i++) {
          const nx = i / W;
          const wx = fbm(nx * 2.6 + flow * 0.5, ny * 2.6, t);
          const wy = fbm(nx * 2.6 + 5.2 + flow * 0.5, ny * 2.6 + 1.3, t);
          let n = fbm(nx * 2.6 + wx * 1.35 + flow, ny * 2.6 + wy * 1.35, t);
          n = (n + 1) / 2;
          n = Math.pow(n < 0 ? 0 : n > 1 ? 1 : n, 1.5);
          const light = 0.65 + 0.6 * (1 - ny) * (0.4 + 0.6 * nx);
          let val = 6 + n * 138 * light;
          if (val > 158) val = 158;
          const idx = (j * W + i) * 4;
          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val + 2;
          data[idx + 3] = 255;
        }
      }
      ctx!.putImageData(img, 0, 0);
    }

    if (REDUCED) {
      render(2.0);
      return () => {
        window.removeEventListener("resize", onResize);
      };
    }

    let startTime: number | null = null;
    function loop(ts: number) {
      if (startTime === null) startTime = ts;
      render((ts - startTime) * 0.0004);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(rt);
      window.removeEventListener("resize", onResize);
    };
  }, [canvasRef]);
}

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEtherealShadows(canvasRef);

  return (
    <section
      className="relative min-h-screen bg-ink flex items-center pt-[104px] pb-[84px] overflow-hidden"
      id="hero"
      data-screen-label="Hero"
    >
      <div className="hero-media absolute inset-0 opacity-0">
        <canvas className="hero-canvas" ref={canvasRef} />
        <div className="hero-media-overlay" />
      </div>

      <div className="relative z-[3] w-full max-w-[1440px] mx-auto px-[var(--gutter)]">
        <div
          className="text-[12px] font-semibold tracking-[0.16em] uppercase text-green-bright mb-[22px]"
          data-hero="eyebrow"
        >
          Built for Nigerian property owners
        </div>

        <h1 className="m-0 font-bold text-cream max-w-[17ch] text-[clamp(40px,6vw,84px)] leading-[0.97] tracking-[-0.045em]">
          <span className="line-mask">
            <span className="hero-line" data-hero="line">
              Your property is making
            </span>
          </span>
          <span className="line-mask">
            <span className="hero-line" data-hero="line">
              money for everyone
            </span>
          </span>
          <span className="line-mask line-mask--open">
            <span className="hero-line" data-hero="line">
              <span className="relative inline-block">
                except&nbsp;you.
                <svg className="scribble" viewBox="0 0 520 26" preserveAspectRatio="none" fill="none" aria-hidden="true">
                  <path
                    d="M5 17 C 120 6, 250 6, 330 11 C 420 17, 495 14, 515 8"
                    stroke="var(--green-bright)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </span>
          </span>
        </h1>

        <p
          className="text-[clamp(16px,1.35vw,19px)] leading-[1.55] text-text-on-dark-2 max-w-[600px] mt-11"
          data-hero="sub"
        >
          Agents collect rent and go silent. Tenants damage property and deny it. You manage everything from WhatsApp at
          midnight. Newcondo fixes all of that — and covers your fumigation, waste management, and legal paperwork while
          doing it.
        </p>

        <div className="flex items-center gap-[22px] mt-8 flex-wrap max-[620px]:gap-4 max-[620px]:w-full" data-hero="cta">
          <SplitButton
            href="#pricing"
            variant="light"
            ariaLabel="List your property"
            label="List your property — plans from ₦7,500/month"
            className="max-[620px]:w-full"
          />
          <a
            href="#pricing"
            className="text-text-on-dark text-[15.5px] font-semibold no-underline border-b border-[rgba(249,249,239,0.4)] pb-[3px] transition-colors duration-200 ease-nc hover:border-cream"
          >
            See what&apos;s included in each plan
          </a>
        </div>

        <p className="inline-flex items-center gap-2.5 mt-6 text-[14.5px] text-text-on-dark-2" data-hero="trust">
          <Icon name="shield-check" size={17} className="text-green-bright" />
          No hidden fees. Cancel anytime. Your rent is escrowed — agents cannot touch it.
        </p>
      </div>

      <a
        className="hero-scroll absolute left-1/2 -translate-x-1/2 bottom-[30px] z-[3] flex flex-col items-center gap-[9px] no-underline text-text-on-dark-2 text-[12px] tracking-[0.14em] uppercase"
        href="#problems"
        data-hero="scroll"
        aria-label="Scroll"
      >
        <svg viewBox="0 0 60 60" fill="none" className="w-[58px] h-[58px]">
          <circle cx="30" cy="30" r="28" stroke="rgba(249,249,239,0.4)" strokeWidth="1.5" />
          <path
            className="scroll-arrow"
            d="M30 22 V38 M23 31 L30 38 L37 31"
            stroke="var(--cream)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Scroll</span>
      </a>
    </section>
  );
}
