"use client";

import { useEffect } from "react";
import { gsap } from "gsap";

/**
 * Site-wide motion — built to FAIL SAFE:
 *  • Uses `gsap.from()` so every element's resting state is *visible*. If a
 *    tween never runs, content is shown rather than stuck at opacity:0.
 *  • Scroll reveals use IntersectionObserver (native, reliable) instead of
 *    ScrollTrigger position math — so sections below the fold always appear.
 *  • A hard failsafe timer + guaranteed overlay removal back everything up.
 */
export function SiteAnimations() {
  useEffect(() => {
    const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const overlay = document.getElementById("pageload");

    const ALL_REVEAL =
      "[data-reveal],[data-prob],[data-feat],[data-result],[data-cmp-row],[data-step],.js-plan,.js-cmp,.js-ceo,.js-faq";

    // Absolute failsafe — never leave anything stuck hidden.
    const showEverything = () => {
      if (overlay) overlay.style.display = "none";
      document
        .querySelectorAll<HTMLElement>(`${ALL_REVEAL},[data-hero],[data-nav-item],.hero-line,.hero-media`)
        .forEach((el) => {
          el.style.opacity = "1";
          el.style.transform = "none";
        });
      document
        .querySelectorAll<SVGPathElement>(".scribble path,.how-arrow path")
        .forEach((p) => (p.style.strokeDashoffset = "0"));
    };
    let failsafe = window.setTimeout(showEverything, 4500);

    // No GSAP or reduced-motion → just show everything immediately.
    if (!gsap || REDUCED) {
      clearTimeout(failsafe);
      showEverything();
      return;
    }

    const EASE = "power3.out";
    const EXPO = "expo.out";
    const timers: number[] = [];
    let io: IntersectionObserver | null = null;
    const splitCleanups: Array<() => void> = [];

    // ---- pageload overlay: fade, with a guaranteed removal backup ----
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.45,
      delay: 0.5,
      onComplete: () => overlay && (overlay.style.display = "none"),
    });
    timers.push(window.setTimeout(() => overlay && (overlay.style.display = "none"), 1400));

    // ---- hero + nav intro (fromTo with explicit visible end-states → safe ----
    const tl = gsap.timeline({ defaults: { ease: EASE }, delay: 0.55 });
    tl.fromTo(".hero-media", { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 1.3 }, 0)
      .fromTo("[data-nav-item]", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06 }, 0)
      .fromTo("[data-hero='eyebrow']", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.5 }, 0.2)
      .fromTo(".hero-line", { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.12, ease: EXPO }, 0.35)
      .fromTo(".scribble path", { strokeDashoffset: 640 }, { strokeDashoffset: 0, duration: 0.9 }, 1.1)
      .fromTo("[data-hero='sub']", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.6 }, 0.9)
      .fromTo("[data-hero='cta']", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.55 }, 1.05)
      .fromTo("[data-hero='trust']", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.5 }, 1.2)
      .fromTo(".hero-scroll", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, 1.35);
    // If the intro completes, GSAP is healthy — cancel the failsafe and let
    // IntersectionObserver handle the rest.
    tl.eventCallback("onComplete", () => clearTimeout(failsafe));

    // ---- scroll reveals via IntersectionObserver ----
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          io!.unobserve(el);
          if (el.hasAttribute("data-draw")) {
            gsap.to(el.querySelectorAll("path"), { strokeDashoffset: 0, duration: 0.8, ease: EASE, stagger: 0.1 });
          } else {
            const childSel = el.getAttribute("data-stagger");
            if (childSel) {
              gsap.to(el.querySelectorAll(childSel), { opacity: 1, y: 0, scale: 1, duration: 0.85, ease: EXPO, stagger: 0.1 });
            } else {
              gsap.to(el, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: EASE });
            }
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.03 }
    );

    const inView = (el: Element) => el.getBoundingClientRect().top < window.innerHeight * 0.92;

    // simple fade-up items (incl. comparison card / ceo / faq wrappers)
    gsap.utils.toArray<HTMLElement>("[data-reveal],.js-cmp,.js-ceo,.js-faq").forEach((el) => {
      if (inView(el)) {
        gsap.fromTo(el, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.7, ease: EASE });
      } else {
        gsap.set(el, { opacity: 0, y: 30 });
        io!.observe(el);
      }
    });

    // staggered card groups
    const group = (childSel: string, y: number) => {
      const kids = gsap.utils.toArray<HTMLElement>(childSel);
      if (!kids.length) return;
      const container = kids[0].parentElement as HTMLElement;
      gsap.set(kids, { opacity: 0, y, scale: 0.97 });
      if (inView(container)) {
        gsap.to(kids, { opacity: 1, y: 0, scale: 1, duration: 0.85, ease: EXPO, stagger: 0.1 });
      } else {
        container.setAttribute("data-stagger", childSel);
        io!.observe(container);
      }
    };
    group("[data-prob]", 60);
    group("[data-feat]", 50);
    group("[data-result]", 60);
    group(".js-plan", 50);
    group("[data-step]", 60);
    group("[data-cmp-row]", 18);

    // how-it-works curved arrow draw
    const howArrow = document.querySelector<HTMLElement>(".how-arrow");
    if (howArrow) {
      gsap.set(".how-arrow path", { strokeDashoffset: 260 });
      if (inView(howArrow)) {
        gsap.to(".how-arrow path", { strokeDashoffset: 0, duration: 0.8, ease: EASE, stagger: 0.1 });
      } else {
        howArrow.setAttribute("data-draw", "");
        io.observe(howArrow);
      }
    }

    // ---- split-button pull-apart on hover ----
    document.querySelectorAll<HTMLElement>("[data-splitbtn]").forEach((groupEl) => {
      const pill = groupEl.querySelector(".pill-btn");
      const circle = groupEl.querySelector(".circle-btn");
      if (!pill || !circle) return;
      const arrow = () => circle.querySelector("svg");
      const enter = () => {
        gsap.to(pill, { x: -5, scale: 1.02, duration: 0.35, ease: "power2.out" });
        gsap.to(circle, { x: 5, scale: 1.02, duration: 0.35, ease: "power2.out", delay: 0.03 });
        gsap.to(arrow(), { rotation: -45, duration: 0.35, ease: "power2.out", transformOrigin: "50% 50%" });
      };
      const leave = () => {
        gsap.to([pill, circle], { x: 0, scale: 1, duration: 0.4, ease: "power2.inOut" });
        gsap.to(arrow(), { rotation: 0, duration: 0.4, ease: "power2.inOut", transformOrigin: "50% 50%" });
      };
      groupEl.addEventListener("mouseenter", enter);
      groupEl.addEventListener("mouseleave", leave);
      splitCleanups.push(() => {
        groupEl.removeEventListener("mouseenter", enter);
        groupEl.removeEventListener("mouseleave", leave);
      });
    });

    return () => {
      clearTimeout(failsafe);
      timers.forEach((t) => clearTimeout(t));
      io?.disconnect();
      tl.kill();
      splitCleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
