"use client";

/* ============================================================
   Features — audience-aware, detailed feature groups.
   The page that sells to each user type, so copy is rich.
   ============================================================ */
import { motion } from "framer-motion";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { ChatButton } from "@/components/chat-button";
import { PageHero } from "@/components/ui/page-hero";
import { Button } from "@/components/ui/nc-button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Segmented } from "@/components/ui/segmented";
import { Reveal, Group, Item, vFade, EASE } from "@/components/motion";
import { useAudience } from "@/hooks/useAudience";
import { FEATURES_PAGE, type Feature, type FeatureGroupT } from "@/lib/pages-data";

/** split a trailing "(Elite)" / "(Premium)" off a title into a badge */
function splitTitle(t: string): { title: string; tag: string | null } {
  const m = t.match(/\s*\((Elite|Premium)\)\s*$/);
  return m ? { title: t.replace(m[0], ""), tag: m[1] } : { title: t, tag: null };
}

function FeatureCard({ f }: { f: Feature }) {
  const { title, tag } = splitTitle(f.title);
  return (
    <Item as="article" variants={vFade} className="feat-card group">
      <div className="flex items-start justify-between gap-3">
        <div className="feat-ico">
          <Icon name={f.icon} size={24} />
        </div>
        {tag && <Badge tone={tag === "Elite" ? "ink" : "green"}>{tag}</Badge>}
      </div>
      <h3 className="text-[19px] font-bold tracking-[-0.02em] leading-[1.15] m-0 mt-[22px] mb-[11px] text-text-primary max-w-[24ch]">
        {title}
      </h3>
      <p className="text-[14.5px] leading-[1.6] text-text-secondary m-0 [text-wrap:pretty]">{f.body}</p>
    </Item>
  );
}

function FeatureGroup({ g }: { g: FeatureGroupT }) {
  return (
    <div className="mb-[clamp(48px,6vw,84px)] last:mb-0">
      <div className="mb-8">
        <Reveal as="span" className="block text-[12px] font-semibold tracking-[0.14em] uppercase text-text-tertiary mb-2.5">
          {g.name}
        </Reveal>
        <Reveal as="h3" className="text-[clamp(22px,2.4vw,30px)] font-bold tracking-[-0.03em] leading-[1.1] text-text-primary m-0 max-w-[24ch]">
          {g.sub}
        </Reveal>
      </div>
      <Group className="grid-feat" stagger={0.07}>
        {g.items.map((f) => (
          <FeatureCard key={f.title} f={f} />
        ))}
      </Group>
    </div>
  );
}

export function FeaturesPage() {
  const [audience, setAudience] = useAudience();
  const model = FEATURES_PAGE[audience];
  const [planLabel, planHref] = model.cta;

  return (
    <div className="newcondo-page min-h-dvh">
      <Navbar forceSolid />

      <PageHero
        label="Features hero"
        eyebrow="What's included"
        title="Features"
        lead="Pick who you are — every feature below is explained for exactly how you'll use it."
      />

      <section className="bg-surface-soft" data-screen-label="Features">
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
            <div className="max-w-[920px] mx-auto text-center mt-[clamp(40px,5vw,64px)] mb-[clamp(48px,6vw,80px)]">
              <h2 className="nc-h2">{model.title}</h2>
              <p className="nc-lead mt-5 mx-auto max-w-[720px]">{model.lead}</p>
            </div>

            <div className="max-w-[1180px] mx-auto">
              {model.groups.map((g) => (
                <FeatureGroup key={g.name} g={g} />
              ))}
            </div>

            <Reveal className="flex flex-col items-center gap-5 mt-[clamp(56px,7vw,96px)] text-center">
              <h3 className="text-[clamp(24px,3vw,38px)] font-bold tracking-[-0.035em] leading-[1.05] text-text-primary m-0 max-w-[22ch]">
                Every feature, included from day one.
              </h3>
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <Button as="a" href={planHref} variant="dark" icon="arrow-right">
                  {planLabel}
                </Button>
                <Button as="a" href="/how-it-works" variant="secondary">
                  See how it works
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
