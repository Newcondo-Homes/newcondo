"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Site-wide motion: pageload fade, hero intro timeline, scroll reveals, and the
 * split-button pull-apart. Renders nothing — it just orchestrates GSAP against
 * the markup rendered by the section components (data-hero / data-reveal / etc).
 */
export function SiteAnimations() {
  useEffect(() => {
    const overlay = document.getElementById("pageload");
    const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.registerPlugin(ScrollTrigger);
    const EASE = "power3.out";
    const EXPO = "expo.out";

    function setHeroHidden() {
      gsap.set("[data-hero='eyebrow'], [data-hero='sub'], [data-hero='cta'], [data-hero='trust']", { opacity: 0, y: 22 });
      gsap.set(".hero-line", { yPercent: 110 });
      gsap.set(".hero-scroll", { opacity: 0, y: 16 });
      gsap.set(".hero-media", { opacity: 0, scale: 1.06 });
      gsap.set(".scribble path", { strokeDashoffset: 640 });
      gsap.set("[data-nav-item]", { opacity: 0, y: -14 });
    }

    function playIntro() {
      const tl = gsap.timeline({ defaults: { ease: EASE } });
      tl.to(".hero-media", { opacity: 1, scale: 1, duration: 1.3, ease: EASE }, 0.15);
      tl.to("[data-nav-item]", { opacity: 1, y: 0, duration: 0.5, stagger: 0.06 }, 0.1);
      tl.to("[data-hero='eyebrow']", { opacity: 1, y: 0, duration: 0.5 }, 0.35);
      tl.to(".hero-line", { yPercent: 0, duration: 0.9, stagger: 0.12, ease: EXPO }, 0.5);
      tl.to(".scribble path", { strokeDashoffset: 0, duration: 0.9, ease: EASE }, 1.25);
      tl.to("[data-hero='sub']", { opacity: 1, y: 0, duration: 0.6 }, 1.05);
      tl.to("[data-hero='cta']", { opacity: 1, y: 0, duration: 0.55 }, 1.2);
      tl.to("[data-hero='trust']", { opacity: 1, y: 0, duration: 0.5 }, 1.35);
      tl.to(".hero-scroll", { opacity: 1, y: 0, duration: 0.5 }, 1.5);
      return tl;
    }

    function setupReveals() {
      if (REDUCED) {
        gsap.set(
          "[data-reveal],[data-prob],[data-feat],[data-result],[data-cmp-row],[data-step],.js-plan,.js-cmp,.js-ceo,.js-faq,.how-arrow path",
          { clearProps: "all", opacity: 1 }
        );
        gsap.set(".how-arrow path", { strokeDashoffset: 0 });
        return;
      }
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 34 },
          { opacity: 1, y: 0, duration: 0.8, ease: EASE, scrollTrigger: { trigger: el, start: "top 86%" } }
        );
      });

      function batch(items: HTMLElement[], opts: { y?: number; scale?: number } = {}) {
        if (!items.length) return;
        const trigger = items[0].parentElement as HTMLElement;
        gsap.set(items, { opacity: 0, y: opts.y ?? 70, scale: opts.scale ?? 0.96 });
        ScrollTrigger.create({
          trigger,
          start: "top 78%",
          once: true,
          onEnter: () => gsap.to(items, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: EXPO, stagger: 0.1 }),
        });
      }
      batch(gsap.utils.toArray<HTMLElement>("[data-prob]"));
      batch(gsap.utils.toArray<HTMLElement>("[data-feat]"), { y: 50 });
      batch(gsap.utils.toArray<HTMLElement>("[data-result]"), { y: 60 });
      batch(gsap.utils.toArray<HTMLElement>(".js-plan"), { y: 50 });
      batch(gsap.utils.toArray<HTMLElement>("[data-step]"), { y: 60 });

      gsap.fromTo(
        ".js-cmp",
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: EASE, scrollTrigger: { trigger: ".js-cmp", start: "top 84%" } }
      );
      gsap.set("[data-cmp-row]", { opacity: 0, y: 18 });
      ScrollTrigger.create({
        trigger: ".js-cmp",
        start: "top 72%",
        once: true,
        onEnter: () => gsap.to("[data-cmp-row]", { opacity: 1, y: 0, duration: 0.5, ease: EASE, stagger: 0.06 }),
      });

      gsap.fromTo(
        ".js-ceo",
        { opacity: 0, y: 40, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: EXPO, scrollTrigger: { trigger: ".js-ceo", start: "top 84%" } }
      );
      gsap.fromTo(
        ".js-faq",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, ease: EASE, scrollTrigger: { trigger: ".js-faq", start: "top 86%" } }
      );

      gsap.set(".how-arrow path", { strokeDashoffset: 260 });
      ScrollTrigger.create({
        trigger: ".how-arrow",
        start: "top 85%",
        once: true,
        onEnter: () => gsap.to(".how-arrow path", { strokeDashoffset: 0, duration: 0.8, ease: EASE, stagger: 0.1 }),
      });
    }

    function setupSplitButtons() {
      document.querySelectorAll<HTMLElement>("[data-splitbtn]").forEach((group) => {
        const pill = group.querySelector(".pill-btn");
        const circle = group.querySelector(".circle-btn");
        if (!pill || !circle) return;
        const arrow = () => circle.querySelector("svg");
        group.addEventListener("mouseenter", () => {
          gsap.to(pill, { x: -5, scale: 1.02, duration: 0.35, ease: "power2.out" });
          gsap.to(circle, { x: 5, scale: 1.02, duration: 0.35, ease: "power2.out", delay: 0.03 });
          gsap.to(arrow(), { rotation: -45, duration: 0.35, ease: "power2.out", transformOrigin: "50% 50%" });
        });
        group.addEventListener("mouseleave", () => {
          gsap.to([pill, circle], { x: 0, scale: 1, duration: 0.4, ease: "power2.inOut" });
          gsap.to(arrow(), { rotation: 0, duration: 0.4, ease: "power2.inOut", transformOrigin: "50% 50%" });
        });
      });
    }

    function start() {
      if (REDUCED) {
        if (overlay) overlay.style.display = "none";
        gsap.set("[data-hero], .hero-media, .scribble path, [data-nav-item]", { clearProps: "all", opacity: 1 });
        gsap.set(".scribble path", { strokeDashoffset: 0 });
        setupReveals();
        setupSplitButtons();
        return;
      }
      setHeroHidden();
      gsap
        .timeline()
        .to(overlay, {
          opacity: 0,
          duration: 0.45,
          ease: EASE,
          delay: 0.5,
          onComplete: () => overlay && (overlay.style.display = "none"),
        })
        .add(playIntro(), "-=0.15");
      setupReveals();
      setupSplitButtons();
      setTimeout(() => ScrollTrigger.refresh(), 300);
    }

    const id = setTimeout(start, 60);
    return () => {
      clearTimeout(id);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return null;
}
