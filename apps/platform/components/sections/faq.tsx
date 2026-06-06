"use client";

import { useState } from "react";
import { cx } from "@/lib/cx";
import { Section } from "@/components/ui/section";
import { SectionHead } from "@/components/ui/section-head";
import { Icon } from "@/components/ui/icon";
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
      <div className="js-faq max-w-[860px] mx-auto" data-reveal>
        {FAQS.map(([q, a], i) => (
          <div
            key={i}
            className={cx("faq-item border-t border-[var(--border)]", open === i && "open", i === FAQS.length - 1 && "border-b")}
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
            <div className="faq-a">
              <p className="text-[16px] leading-[1.6] text-text-secondary m-0 mx-1 mb-[26px] max-w-[72ch]">{a}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
