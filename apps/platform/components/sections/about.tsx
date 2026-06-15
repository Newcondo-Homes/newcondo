"use client";

/* ============================================================
   About — brand page. Composes Navbar / PageHero / Sections.
   ============================================================ */

import { Navbar } from "@/components/sections/navbar";
import { ChatButton } from "@/components/chat-button";
import { Section } from "@/components/ui/section";
import { SectionHead } from "@/components/ui/section-head";
import { PageHero } from "@/components/ui/page-hero";
import { Icon } from "@/components/ui/icon";
import { SplitButton } from "@/components/ui/split-button";
import { Reveal, Group, Item, vFade, vCard } from "@/components/motion";
import { ABOUT_STATS, ABOUT_VALUES, ABOUT_TIMELINE } from "@/lib/about-data";

export function About() {
  return (
    <div className="newcondo-page min-h-dvh">
      <Navbar forceSolid />

      <PageHero
        label="About hero"
        eyebrow="About Newcondo"
        title={["We're fixing how", "Nigeria rents."]}
        lead="Newcondo exists for one reason: property owners should never lose money because of confusion, fake listings, or agents who go silent. We built the system that was missing."
      />

      {/* ---- Mission ---- */}
      <Section id="mission" label="Mission">
        <div className="grid grid-cols-[0.85fr_1.15fr] gap-[clamp(32px,5vw,80px)] items-start max-[860px]:grid-cols-1">
          <Reveal>
            <span className="block text-[12px] font-semibold tracking-[0.14em] uppercase text-text-tertiary mb-[18px]">Our mission</span>
            <h2 className="nc-h2 max-w-[14ch]">Make owning rental property feel like owning property.</h2>
          </Reveal>
          <Reveal as="div" variants={vFade} className="max-w-[60ch]">
            <p className="text-[clamp(17px,1.5vw,20px)] leading-[1.6] text-text-secondary m-0 mb-5">
              In Nigeria, owning a property and actually <em>benefiting</em> from it are two different things. Agents collect rent
              and disappear. Tenants damage homes and deny it. Owners manage a multi-million-naira asset from a phone at midnight.
            </p>
            <p className="text-[clamp(17px,1.5vw,20px)] leading-[1.6] text-text-secondary m-0">
              Newcondo puts the owner back in control — rent held in escrow, tenants verified, maintenance handled, and every
              document in one place. No middleman deciding when, or whether, you get paid.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* ---- Stats ---- */}
      <Section id="stats" label="Stats" cream>
        <Group stagger={0.08} className="grid grid-cols-4 gap-[clamp(20px,3vw,44px)] max-[860px]:grid-cols-2 max-[460px]:grid-cols-1">
          {ABOUT_STATS.map((s) => (
            <Item key={s.label} variants={vCard} className="border-t-2 border-ink pt-6">
              <div className="font-bold tracking-[-0.04em] text-text-primary text-[clamp(40px,5vw,64px)] leading-none">{s.value}</div>
              <p className="mt-3.5 text-[15px] leading-[1.45] text-text-secondary m-0">{s.label}</p>
            </Item>
          ))}
        </Group>
      </Section>

      {/* ---- Values ---- */}
      <Section id="values" label="Values">
        <SectionHead eyebrow="What we stand for" title="The principles behind every decision." />
        <Group stagger={0.08} className="grid grid-cols-2 gap-[clamp(16px,2vw,24px)] max-[760px]:grid-cols-1">
          {ABOUT_VALUES.map((v) => (
            <Item key={v.title} variants={vCard} className="rounded-card border border-border-hair bg-surface p-[clamp(24px,3vw,36px)] shadow-card">
              <span className="mb-5 grid h-12 w-12 place-items-center rounded-[13px] bg-green-wash text-green-dark">
                <Icon name={v.icon} size={24} />
              </span>
              <h3 className="text-[21px] font-bold tracking-[-0.025em] text-text-primary m-0 mb-2.5">{v.title}</h3>
              <p className="text-[15.5px] leading-[1.6] text-text-secondary m-0">{v.body}</p>
            </Item>
          ))}
        </Group>
      </Section>

      {/* ---- Story / timeline ---- */}
      <Section id="story" label="Story" cream>
        <SectionHead eyebrow="Our story" title="How we got here." />
        <div className="grid grid-cols-3 gap-[clamp(20px,3vw,40px)] max-[760px]:grid-cols-1">
          {ABOUT_TIMELINE.map((t, i) => (
            <Reveal key={t.year} variants={vCard} style={{ transitionDelay: `${i * 60}ms` }}>
              <div className="font-mono text-[15px] text-green-dark mb-4">{t.year}</div>
              <div className="border-t border-divider pt-5">
                <h3 className="text-[20px] font-bold tracking-[-0.02em] text-text-primary m-0 mb-2.5">{t.title}</h3>
                <p className="text-[15.5px] leading-[1.6] text-text-secondary m-0">{t.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---- CTA ---- */}
      <section className="bg-ink text-cream" data-screen-label="About CTA">
        <div className="max-w-[980px] mx-auto px-[var(--gutter)] py-[clamp(72px,10vw,128px)] text-center">
          <Reveal as="h2" className="text-[clamp(34px,5vw,64px)] font-bold tracking-[-0.045em] leading-[1.0] text-cream m-0 [text-wrap:balance]">
            Your property is already yours. Let&apos;s make the income yours too.
          </Reveal>
          <Reveal className="flex justify-center mt-9">
            <SplitButton href="/#pricing" variant="light" ariaLabel="List your property" label="List your property" />
          </Reveal>
        </div>
      </section>
      <ChatButton />
    </div>
  );
}
