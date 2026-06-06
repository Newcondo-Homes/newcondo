"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/nc-button";
import { NAV_LINKS } from "@/lib/data";

const LOGO_DARK = "/assets/logo-mark-dark.png";
const LOGO_CREAM = "/assets/logo-mark-cream.png";

export function Navbar() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const onScroll = () => {
      const threshold = (hero ? hero.offsetHeight : window.innerHeight) - 90;
      setSolid(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onDark = !solid;

  return (
    <header
      className={cx("nav-shell fixed top-0 left-0 right-0 z-[100]", onDark ? "nav--ondark" : "nav--solid")}
      data-screen-label="Navbar"
    >
      <div className="max-w-[1440px] mx-auto px-[var(--gutter)] py-4 flex items-center gap-[30px]">
        <a
          href="#"
          data-nav-item
          className="flex items-center gap-[11px] no-underline font-bold text-[21px] tracking-[-0.04em]"
          style={{ color: onDark ? "var(--cream)" : "var(--ink)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="nav-logo-dark w-[30px] h-auto" src={LOGO_DARK} alt="Newcondo" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="nav-logo-cream w-[30px] h-auto" src={LOGO_CREAM} alt="Newcondo" />
          <span>newcondo</span>
        </a>

        <nav className="nav-desktop-links gap-7 ml-1.5">
          {NAV_LINKS.map(([label, href]) => (
            <a
              key={label}
              href={href}
              data-nav-item
              className="no-underline text-[15px] font-medium transition-opacity duration-200 ease-nc hover:opacity-60"
              style={{ color: onDark ? "var(--text-on-dark)" : "var(--text-secondary)" }}
            >
              {label}
            </a>
          ))}
        </nav>

        <div data-nav-item data-splitbtn className="cta-group ml-auto nav-desktop-cta items-center gap-2">
          <a
            href="#pricing"
            className={cx(
              "pill-btn inline-flex items-center rounded-full font-semibold text-[15px] px-[22px] py-[13px] no-underline transition-[transform,background] duration-200 ease-nc active:scale-[0.97]",
              onDark ? "bg-cream text-ink" : "bg-ink text-cream"
            )}
          >
            <span className="pill-label">List your property</span>
          </a>
          <a
            href="#pricing"
            aria-label="List your property"
            className={cx(
              "circle-btn inline-flex items-center justify-center rounded-full transition-[transform,background] duration-200 ease-nc active:scale-[0.97]",
              onDark ? "bg-cream text-ink" : "bg-ink text-cream"
            )}
            style={{ width: 46, height: 46 }}
          >
            <Icon name="arrow-right" size={19} />
          </a>
        </div>

        <button
          
          className="nav-burger-btn data-nav-item flex ml-auto items-center justify-center p-1.5 bg-transparent border-0 cursor-pointer"
          aria-label="Menu"
          onClick={() => setOpen((o) => !o)}
          style={{ color: onDark ? "var(--cream)" : "var(--ink)" }}
        >
          <Icon name={open ? "x" : "menu"} size={26} />
        </button>
      </div>

      {open && (
        <div className="nav-mobile-menu flex flex-col gap-1 px-[var(--gutter)] pt-3.5 pb-5 bg-[rgba(247,246,239,0.96)] backdrop-blur-[18px] border-t border-[rgba(0,0,0,0.06)]">
          {NAV_LINKS.map(([label, href]) => (
            <a
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="py-[13px] px-1 no-underline text-[16px] font-medium text-text-secondary border-b border-[rgba(0,0,0,0.06)]"
            >
              {label}
            </a>
          ))}
          <Button as="a" href="#pricing" variant="dark" className="justify-center mt-3.5" icon="arrow-right" onClick={() => setOpen(false)}>
            List your property
          </Button>
        </div>
      )}
    </header>
  );
}
