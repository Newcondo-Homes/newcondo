"use client";

/* ============================================================
   How it works — audience-aware step journey.
   Reuses the landing's animated gradient "kind" cards.
   ============================================================ */
import { motion } from "framer-motion";
import { Navbar } from "@/components/sections/navbar";
import { ChatButton } from "@/components/chat-button";
import { PageHero } from "@/components/ui/page-hero";
import { Button } from "@/components/ui/nc-button";
import { Segmented } from "@/components/ui/segmented";
import { Reveal, Group, Item, vFade, EASE } from "@/components/motion";
import { useAudience } from "@/hooks/useAudience";
import { HOW, type HowStep } from "@/lib/pages-data";
import { cx } from "@/lib/cx";

function StepCard({ s }: { s: HowStep }) {
  return (
    <Item as="article" variants={vFade} className="cw-card group">
      <span className="absolute -top-[0.5em] right-1.5 z-0 font-mono text-[clamp(72px,7vw,112px)] font-semibold text-[rgba(19,19,19,0.12)] leading-none tracking-[-0.04em] pointer-events-none">
        {s.n}
      </span>
      <div className={cx("cw-anim relative z-[1] h-[230px] rounded-card overflow-hidden shadow-card", `cw-anim--${s.variant}`)} aria-hidden="true">
        <span className="cw-blob b1" />
        <span className="cw-blob b2" />
        <span className="cw-blob b3" />
        <span className="cw-blob b4" />
        <span className="cw-anim-text">{s.anim}</span>
      </div>
      <div className="relative z-[1] pt-6 px-1">
        <span className="block text-[12px] font-semibold tracking-[0.12em] uppercase text-text-tertiary mb-3">
          Step {s.n.replace(/^0/, "")} · {s.label}
        </span>
        <h3 className="text-[21px] font-bold tracking-[-0.025em] leading-[1.14] m-0 mb-3 text-text-primary transition-transform duration-[320ms] ease-nc group-hover:-translate-y-[3px]">
          {s.title}
        </h3>
        <p className="text-[15px] leading-[1.55] text-text-secondary m-0">{s.text}</p>
      </div>
    </Item>
  );
}

export function HowItWorksPage() {
  const [audience, setAudience] = useAudience();
  const model = HOW[audience];
  const [howLabel, howHref] = model.cta;

  return (
    <div className="newcondo-page min-h-dvh">
      <Navbar forceSolid />

      <PageHero
        label="How it works hero"
        eyebrow="How Newcondo works"
        title="How it works"
        lead="Pick who you are — the steps adjust to exactly how Newcondo works for you."
      />

      <section className="bg-surface-soft" data-screen-label="How it works steps">
        <div className="max-w-[1440px] mx-auto px-[var(--gutter)] pt-[clamp(40px,5vw,64px)] pb-[clamp(64px,9vw,120px)]">
          <div className="flex justify-center">
            <Reveal>
              <Segmented audience={audience} onAudience={setAudience} />
            </Reveal>
          </div>

          <motion.div
            key={audience}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <div className="max-w-[860px] mx-auto text-center mt-[clamp(40px,5vw,64px)] mb-[clamp(40px,5vw,68px)]">
              <h2 className="nc-h2">{model.title}</h2>
              <p className="nc-lead mt-5 mx-auto max-w-[680px]">{model.lead}</p>
            </div>

            <Group className="grid-how" stagger={0.1}>
              {model.steps.map((s) => (
                <StepCard key={s.n} s={s} />
              ))}
            </Group>

            <Reveal className="flex flex-col items-center gap-5 mt-[clamp(56px,7vw,92px)] text-center">
              <h3 className="text-[clamp(24px,3vw,38px)] font-bold tracking-[-0.035em] leading-[1.05] text-text-primary m-0 max-w-[20ch]">
                That&apos;s the whole journey. Ready when you are.
              </h3>
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <Button as="a" href={howHref} variant="dark" icon="arrow-right">
                  {howLabel}
                </Button>
                <Button as="a" href="/pricing" variant="secondary">
                  Compare all plans
                </Button>
              </div>
            </Reveal>
          </motion.div>
        </div>
      </section>

      <ChatButton />
    </div>
  );
}
