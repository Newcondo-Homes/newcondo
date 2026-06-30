"use client";

/* ============================================================
   Support — brand help page. Composes Navbar / PageHero / Sections.
   ============================================================ */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { cx } from "@/lib/cx";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { ChatButton } from "@/components/chat-button";
import { Section } from "@/components/ui/section";
import { SectionHead } from "@/components/ui/section-head";
import { PageHero } from "@/components/ui/page-hero";
import { Icon } from "@/components/ui/icon";
import { Reveal, Group, Item, vCard, EASE } from "@/components/motion";
import { OPEN_CHAT_EVENT } from "@/hooks/useCrisp";
import { SUPPORT_CATEGORIES, SUPPORT_FAQS, SUPPORT_CHANNELS } from "@/lib/support-data";

export function Support() {
  const [open, setOpen] = useState(0);

  return (
    <div className="newcondo-page min-h-dvh">
      <Navbar forceSolid />

      <PageHero
        label="Support hero"
        eyebrow="Support"
        title={["How can we", "help?"]}
        lead="Answers to the things people ask most, organised by who you are and what you need. Can't find it? A real person is one message away."
      />

      {/* ---- Help categories ---- */}
      <Section id="categories" label="Help categories">
        <SectionHead eyebrow="Browse by topic" title="Start where it fits." />
        <Group stagger={0.06} className="grid grid-cols-3 gap-[clamp(16px,2vw,24px)] max-[860px]:grid-cols-2 max-[560px]:grid-cols-1">
          {SUPPORT_CATEGORIES.map((c) => {
            const internal = c.href.startsWith("/");
            const Card = (
              <Item
                key={c.title}
                variants={vCard}
                as={internal ? "div" : "a"}
                {...(internal ? {} : { href: c.href })}
                className="group block h-full rounded-card border border-border-hair bg-surface p-[clamp(22px,2.6vw,30px)] no-underline shadow-card transition-transform duration-200 ease-nc hover:-translate-y-1"
              >
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-[12px] bg-green-wash text-green-dark">
                  <Icon name={c.icon} size={22} />
                </span>
                <h3 className="text-[18px] font-bold tracking-[-0.02em] text-text-primary m-0 mb-2">{c.title}</h3>
                <p className="text-[14.5px] leading-[1.55] text-text-secondary m-0 mb-4">{c.body}</p>
                <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-green-dark">
                  Learn more <Icon name="arrow-right" size={15} className="transition-transform duration-200 ease-nc group-hover:translate-x-0.5" />
                </span>
              </Item>
            );
            return internal ? (
              <Link key={c.title} href={c.href} className="no-underline">
                {Card}
              </Link>
            ) : (
              Card
            );
          })}
        </Group>
      </Section>

      {/* ---- FAQ ---- */}
      <Section id="faq" label="Support FAQ" cream>
        <SectionHead center eyebrow="Common questions" title="Quick answers to the things people ask us most." />
        <Reveal className="max-w-[860px] mx-auto">
          {SUPPORT_FAQS.map(([q, a], i) => (
            <div key={i} className={cx("border-t border-divider", i === SUPPORT_FAQS.length - 1 && "border-b")}>
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full bg-transparent border-0 cursor-pointer flex items-center justify-between gap-[22px] py-[26px] px-1 text-left text-[clamp(17px,1.8vw,21px)] font-semibold tracking-[-0.02em] text-text-primary"
              >
                <span>{q}</span>
                <span className="inline-flex items-center justify-center w-[22px] h-[22px] text-text-secondary flex-none">
                  <Icon name={open === i ? "minus" : "plus"} size={22} />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    style={{ overflow: "hidden" }}
                  >
                    <p className="text-[16px] leading-[1.6] text-text-secondary m-0 mx-1 mb-[26px] max-w-[72ch]">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* ---- Contact channels ---- */}
      <Section id="contact" label="Contact channels">
        <SectionHead eyebrow="Still need a hand?" title="Reach a human." />
        <Group stagger={0.07} className="grid grid-cols-3 gap-[clamp(16px,2vw,24px)] max-[760px]:grid-cols-1">
          {SUPPORT_CHANNELS.map((ch) => {
            const internal = ch.href.startsWith("/");
            const isChat = ch.href === "#chat";
            const inner = (
              <>
                <span className="mb-5 grid h-12 w-12 place-items-center rounded-[13px] bg-ink text-cream">
                  <Icon name={ch.icon} size={22} />
                </span>
                <span className="block text-[12px] font-semibold tracking-[0.12em] uppercase text-text-tertiary mb-2">{ch.label}</span>
                <div className="text-[19px] font-bold tracking-[-0.02em] text-text-primary mb-1.5">{ch.value}</div>
                <p className="text-[14px] leading-[1.5] text-text-secondary m-0">{ch.sub}</p>
              </>
            );
            const cls =
              "block h-full rounded-card border border-border-hair bg-surface p-[clamp(24px,3vw,34px)] no-underline shadow-card transition-transform duration-200 ease-nc hover:-translate-y-1";
            if (isChat) {
              return (
                <Item
                  key={ch.label}
                  variants={vCard}
                  as="button"
                  type="button"
                  onClick={() => window.dispatchEvent(new Event(OPEN_CHAT_EVENT))}
                  className={cx(cls, "w-full text-left cursor-pointer")}
                >
                  {inner}
                </Item>
              );
            }
            return internal ? (
              <Item key={ch.label} variants={vCard}>
                <Link href={ch.href} className={cls}>{inner}</Link>
              </Item>
            ) : (
              <Item key={ch.label} variants={vCard} as="a" href={ch.href} className={cls}>
                {inner}
              </Item>
            );
          })}
        </Group>
      </Section>

      <Footer />
      <ChatButton />
    </div>
  );
}
