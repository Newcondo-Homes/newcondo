"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cx } from "@/lib/cx";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/nc-button";
import { SplitButton } from "@/components/ui/split-button";
import { container, mount, EASE } from "@/components/motion";
import { NAV_LINKS } from "@/lib/data";

const LOGO_DARK = "/assets/logo-mark-dark.png";
const LOGO_CREAM = "/assets/logo-mark-cream.png";

const navItem = {
  hidden: { opacity: 0, y: -14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

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
      className={cx("nav-shell fixed top-0 left-0 right-0 z-[100] overflow-hidden", onDark ? "nav--ondark" : "nav--solid")}
      data-screen-label="Navbar"
    >
      <motion.div
        className="w-full max-w-[1440px] mx-auto px-[var(--gutter)] py-4 flex items-center justify-between lg:justify-start lg:gap-[30px]"
        variants={container(0.06, 0.7)}
        {...mount}
      >
        <motion.a
          href="#"
          variants={navItem}
          className="flex items-center gap-[11px] no-underline font-bold text-[21px] tracking-[-0.04em]"
          style={{ color: onDark ? "var(--cream)" : "var(--ink)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="nav-logo-dark w-[30px] h-auto" src={LOGO_DARK} alt="Newcondo" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="nav-logo-cream w-[30px] h-auto" src={LOGO_CREAM} alt="Newcondo" />
          <span>newcondo</span>
        </motion.a>

        <nav className="hidden lg:flex gap-7 ml-1.5">
          {NAV_LINKS.map(([label, href]) => (
            <motion.a
              key={label}
              href={href}
              variants={navItem}
              className="no-underline text-[15px] font-medium transition-opacity duration-200 ease-nc hover:opacity-60"
              style={{ color: onDark ? "var(--text-on-dark)" : "var(--text-secondary)" }}
            >
              {label}
            </motion.a>
          ))}
        </nav>

        <motion.div variants={navItem} className="hidden lg:inline-flex ml-auto">
          <SplitButton
            href="#pricing"
            variant={onDark ? "light" : "dark"}
            label="List your property"
            ariaLabel="List your property"
          />
        </motion.div>

        <motion.button
          variants={navItem}
          className="flex lg:hidden items-center justify-center p-1.5 bg-transparent border-0 cursor-pointer"
          aria-label="Menu"
          onClick={() => setOpen((o) => !o)}
          style={{ color: onDark ? "var(--cream)" : "var(--ink)" }}
        >
          <Icon name={open ? "x" : "menu"} size={26} />
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="flex flex-col lg:hidden gap-1 px-[var(--gutter)] pt-3.5 pb-5 bg-[rgba(247,246,239,0.96)] backdrop-blur-[18px] border-t border-[rgba(0,0,0,0.06)]"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            style={{ overflow: "hidden" }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
