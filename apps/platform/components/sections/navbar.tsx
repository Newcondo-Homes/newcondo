"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cx } from "@/lib/cx";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/nc-button";
import { SplitButton } from "@/components/ui/split-button";
import { container, mount, EASE } from "@/components/motion";
import { NAV_LINKS } from "@/lib/data";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LOGO_DARK = "/assets/logo-mark-dark.png";
const LOGO_CREAM = "/assets/logo-mark-cream.png";

const navItem = {
  hidden: { opacity: 0, y: -14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function Navbar({ forceSolid = false }) {
  const [solid, setSolid] = useState(forceSolid);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Pages without a dark hero (e.g. legal docs) keep the glass bar from the top.
    if (forceSolid) return;

    const hero = document.getElementById("hero");
    const onScroll = () => {
      const threshold = (hero ? hero.offsetHeight : window.innerHeight) - 90;
      setSolid(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [forceSolid]);

  const onDark = !solid;
  const isHomePage = pathname === "/";

  // CHANGED: logo click handler — on the homepage, scroll to top smoothly
  // (preserving the original behaviour); on any other page, navigate home.
  const handleLogoClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isHomePage) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // Let Next.js handle the navigation via the Link's href="/"
        setOpen(false);
      }
    },
    [isHomePage]
  );

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
        {/* CHANGED: href="#" -> href="/" with Next.js Link, plus smart click handler */}
        <motion.div variants={navItem}>
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex items-center gap-[11px] no-underline font-bold text-[21px] tracking-[-0.04em]"
            style={{ color: onDark ? "var(--cream)" : "var(--ink)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="nav-logo-dark w-[30px] h-auto" src={LOGO_DARK} alt="Newcondo" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="nav-logo-cream w-[30px] h-auto" src={LOGO_CREAM} alt="Newcondo" />
            <span className="lowercase">Newcondo</span>
          </Link>
        </motion.div>

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
            href="/onboarding"
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
            <SplitButton
              href="/onboarding"
              variant="dark"
              label="List your property"
              ariaLabel="List your property"
              className="justify-center mt-3.5"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}