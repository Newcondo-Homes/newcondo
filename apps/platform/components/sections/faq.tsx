"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cx } from "@/lib/cx";
import { Section } from "@/components/ui/section";
import { SectionHead } from "@/components/ui/section-head";
import { Icon } from "@/components/ui/icon";
import { Reveal, EASE } from "@/components/motion";
import { FAQS } from "@/lib/data";

export function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <Section id="faq" label="FAQ" cream>
      <SectionHead
        center
        eyebrow="Questions landlords ask before signing up"
        title="We know what you're thinking. Here are the honest answers."
      />
      <Reveal className="max-w-[860px] mx-auto">
        {FAQS.map(([q, a], i) => (
          <div
            key={i}
            className={cx("border-t border-[var(--border)]", i === FAQS.length - 1 && "border-b")}
          >
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
  );
}
