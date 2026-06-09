"use client";

import { useState } from "react";
import { Section } from "@/components/ui/section";
import { SectionHead } from "@/components/ui/section-head";
import { ImageSlot } from "@/components/ui/image-slot";
import { Icon } from "@/components/ui/icon";
import { Reveal } from "@/components/motion";

export function CEO() {
  const [played, setPlayed] = useState(false);

  return (
    <Section id="ceo" label="CEO message">
      <SectionHead
        center
        eyebrow="A message from our CEO"
        title="Why we're building Newcondo."
        lead="With years of experience in the Nigerian rental market, we're building the system that was missing — so owning property finally feels like owning property."
      />
      <Reveal
        className="js-ceo group relative max-w-[1000px] mx-auto h-[560px] rounded-card overflow-hidden shadow-card max-[860px]:h-[420px]"
        style={{ background: "linear-gradient(135deg,#2a2a28,#3c3c38)" }}
      >
        <div className="absolute inset-0 transition-transform duration-[600ms] ease-nc group-hover:scale-[1.03]">
          <ImageSlot placeholder="CEO video thumbnail / clip poster" />
        </div>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.62), transparent 55%)" }} />
        {!played && (
          <button
            onClick={() => setPlayed(true)}
            aria-label="Play"
            className="ceo-play absolute right-[30px] bottom-[30px] w-[70px] h-[70px] rounded-full border-0 bg-white/95 text-ink flex items-center justify-center cursor-pointer shadow-lift z-[3]"
          >
            <Icon name="play" size={28} />
          </button>
        )}
        <div className="absolute left-0 bottom-0 px-[clamp(28px,4vw,52px)] py-10 max-w-[680px] text-cream z-[2]">
          <p className="text-[clamp(21px,2.4vw,31px)] font-semibold tracking-[-0.02em] leading-[1.22] m-0">
            &ldquo;Property owners should not lose money because of confusion, fake listings, or poor agent coordination.&rdquo;
          </p>
          <div className="mt-[18px] text-[15px] font-semibold">
            Samuel Chidera Ibekwe-Obani <span className="font-normal text-text-on-dark-2">· CEO &amp; Co-Founder</span>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
