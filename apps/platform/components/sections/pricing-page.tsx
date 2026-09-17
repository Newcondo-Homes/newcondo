"use client";

/* ============================================================
   Pricing — audience-aware plans + comparison table.

   Generalised from two plans to N (owners now have three tiers: Essential /
   Plus / Premium, priced per property). The comparison table reads its column
   count from model.plans, and each CmpRow carries one cell per plan.
   ============================================================ */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/sections/navbar";
import { ChatButton } from "@/components/chat-button";
import { PageHero } from "@/components/ui/page-hero";
import { Button } from "@/components/ui/nc-button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Segmented } from "@/components/ui/segmented";
import { Reveal, Group, Item, vFade, EASE } from "@/components/motion";
import { useAudience } from "@/hooks/useAudience";
import { PRICING, type Plan, type CmpCell, type PricingModel } from "@/lib/pages-data";
import { cx } from "@/lib/cx";

function priceView(plan: Plan, annual: boolean): { big: string; unit: string; note: string } {
  if (plan.priceLabel) return { big: plan.priceLabel, unit: plan.unit ?? "", note: plan.note ?? "" };
  const m = plan.monthly ?? 0;
  // "/property/month" → "/property/mo" in the compact card unit slot.
  const per = (plan.unitLabel ?? "/month").replace("/month", "/mo").replace("/year", "/yr");
  if (annual) {
    // Prefer the tier's real annual price; fall back to 10× (2 months free).
    const yr = plan.annual ?? m * 10;
    return {
      big: "₦" + Math.round(yr / 12).toLocaleString(),
      unit: per,
      note: "₦" + yr.toLocaleString() + " billed yearly",
    };
  }
  return { big: "₦" + m.toLocaleString(), unit: per, note: "Billed monthly" };
}

function BillingToggle({ annual, onToggle }: { annual: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="bill">
      <span className={annual ? "" : "on"}>Monthly</span>
      <button className={cx("bill-switch", annual && "on")} role="switch" aria-checked={annual} aria-label="Toggle annual billing" onClick={() => onToggle(!annual)}>
        <span className="bill-knob" />
      </button>
      <span className={annual ? "on" : ""}>Annual</span>
      <span className="bill-save">2 months free</span>
    </div>
  );
}

function PlanCard({ plan, annual, solo }: { plan: Plan; annual: boolean; solo?: boolean }) {
  const dark = plan.variant === "dark";
  const pv = priceView(plan, annual);
  return (
    <Item
      as="article"
      variants={vFade}
      className={cx(
        "plan-card relative rounded-card px-9 pt-9 pb-10 flex flex-col transition-[transform,box-shadow,border-color] duration-[380ms] ease-nc hover:-translate-y-1.5",
        solo && "w-full max-w-[480px]",
        dark ? "bg-ink text-cream shadow-lift hover:shadow-pop" : "is-light bg-surface border border-[rgba(0,0,0,0.06)] shadow-card"
      )}
    >
      <div className="flex items-start justify-between gap-3 min-h-[26px]">
        <h3 className={cx("text-[26px] font-bold tracking-[-0.03em] m-0", dark ? "text-cream" : "text-text-primary")}>{plan.name}</h3>
        {plan.popular && <Badge tone={dark ? "bright" : "green"}>Most popular</Badge>}
      </div>
      <p className={cx("text-[14px] leading-[1.45] m-0 mt-2 min-h-[40px]", dark ? "text-text-on-dark-2" : "text-text-secondary")}>{plan.tagline}</p>

      <div className="mt-7 mb-1 min-h-[58px] flex items-end overflow-hidden">
        <motion.div key={pv.big + pv.unit} className="flex flex-wrap items-baseline gap-x-2 gap-y-1" initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.32, ease: EASE }}>
          <span className={cx("text-[42px] font-bold tracking-[-0.04em] leading-none", dark ? "text-cream" : "text-text-primary")}>{pv.big}</span>
          {pv.unit && <span className={cx("text-[15px]", dark ? "text-text-on-dark-2" : "text-text-tertiary")}>{pv.unit}</span>}
          {plan.strike && (
            <span className={cx("text-[18px] font-medium line-through", dark ? "text-text-on-dark-2" : "text-text-tertiary")}>{plan.strike}</span>
          )}
        </motion.div>
      </div>
      <p className={cx("text-[13.5px] m-0 mb-6 min-h-[20px]", dark ? "text-text-on-dark-2" : "text-text-tertiary")}>{pv.note}</p>

      <Button as="a" href={plan.href} variant={dark ? "light" : "dark"} size="block" icon="arrow-right">{plan.cta}</Button>

      {plan.badge && (
        <p className={cx("flex items-center justify-center gap-2 mt-4 text-[13px] font-semibold", dark ? "text-green-bright" : "text-green-dark")}>
          <Icon name="sparkles" size={15} /> {plan.badge}
        </p>
      )}
    </Item>
  );
}

function Cell({ v, featured }: { v: CmpCell; featured?: boolean }) {
  let inner;
  if (v === true) inner = <Icon name="check" size={19} className="cmp2-check" />;
  else if (v === false) inner = <span className="cmp2-dash">—</span>;
  else inner = <span>{v}</span>;
  return <div className={cx("cmp2-cell", featured && "is-featured")} style={featured ? { background: "rgba(19,19,19,0.028)", alignSelf: "stretch" } : undefined}>{inner}</div>;
}

function ComparisonTable({ model, annual }: { model: PricingModel; annual: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const headCellRef = useRef<HTMLDivElement>(null);
  const [hl, setHl] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current, cell = headCellRef.current;
      if (!wrap || !cell) return;
      const w = wrap.getBoundingClientRect(), c = cell.getBoundingClientRect();
      setHl({ left: c.left - w.left, width: c.width });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [model]);

  // The highlighted column is the popular tier — the middle one for owners,
  // the last for agents. Falls back to the final column.
  const featuredIndex = Math.max(0, model.plans.findIndex((p) => p.popular));
  const cols = model.plans.length;

  return (
    <div className={cx("cmp2", `cmp2--${cols}`)}>
      <div className="cmp2-head">
        <div className="cmp2-row cmp2-grid">
          <div className="text-[13px] font-semibold tracking-[0.04em] uppercase text-text-tertiary">Compare plans</div>
          {model.plans.map((p, i) => {
            const pv = priceView(p, annual);
            const featured = i === featuredIndex;
            return (
              <div key={p.id} className="text-center" ref={featured ? headCellRef : undefined}>
                <div className={cx("inline-flex items-center gap-1.5 text-[17px] font-bold tracking-[-0.02em]", featured ? "text-ink" : "text-text-primary")}>
                  {p.name}
                  {p.popular && <Icon name="star" size={14} className="text-green-dark" />}
                </div>
                <div className="text-[13px] text-text-tertiary mt-0.5">{pv.big}{pv.unit}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div ref={wrapRef} className="relative">
        {hl && <div className="cmp2-hl" style={{ left: hl.left, width: hl.width }} aria-hidden="true" />}
        <div className="relative z-[1]">
          {model.groups.map((g) => (
            <Reveal key={g.name} variants={vFade} className="block cmp2-grid">
              <div className="cmp2-grouphead">{g.name}</div>
              {g.rows.map((row) => {
                const [label, ...cells] = row;
                return (
                  <div key={label} className="cmp2-row cmp2-grid cmp2-feat">
                    <div className="cmp2-label">{label}</div>
                    {/* One cell per plan. Rows are authored to match
                        model.plans.length; a short row renders a dash so a
                        content slip degrades instead of breaking the grid. */}
                    {model.plans.map((p, i) => (
                      <Cell key={p.id} v={cells[i] ?? false} featured={i === featuredIndex} />
                    ))}
                  </div>
                );
              })}
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Single-card audiences (renters): one plan + a founding-aware feature list
   instead of a multi-column comparison. Every listed feature is included with
   the card; the founding-only perks carry a "First 300" badge so it's clear
   what the first 300 renters get for free. */
function FoundingFeatures({ model }: { model: PricingModel }) {
  return (
    <div className="max-w-[820px] mx-auto">
      <div className="text-center mb-2">
        <h3 className="text-[clamp(20px,2.2vw,26px)] font-bold tracking-[-0.02em] text-text-primary m-0">Everything you get</h3>
        <p className="mt-2.5 text-[15px] leading-[1.55] text-text-secondary max-w-[560px] mx-auto">
          Every renter gets all of this. The items marked{" "}
          <span className="inline-flex items-center gap-1 align-middle rounded-full bg-green-wash text-green-dark px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em]">
            <Icon name="sparkles" size={11} /> First 300
          </span>{" "}
          are founding-renter perks — free for life for the first 300.
        </p>
      </div>
      {model.groups.map((g) => (
        <Reveal key={g.name} variants={vFade} className="block">
          <div className="text-[13px] font-semibold tracking-[0.04em] uppercase text-text-tertiary px-1 pt-7 pb-1.5">{g.name}</div>
          {g.rows.map((row) => {
            const [label, a, b] = row as [string, CmpCell, CmpCell];
            const founding = a !== b;
            const has = b !== false;
            return (
              <div key={label} className="flex items-center justify-between gap-4 py-3.5 border-b border-[rgba(0,0,0,0.06)]">
                <div className={cx("flex items-center gap-3 text-[15.5px]", has ? "text-text-secondary" : "text-text-tertiary")}>
                  {has ? (
                    <Icon name="check" size={18} className="text-green-dark flex-none" />
                  ) : (
                    <span className="w-[18px] text-center text-text-tertiary flex-none">—</span>
                  )}
                  <span>{label}</span>
                </div>
                <div className="flex items-center gap-2.5 flex-none">
                  {typeof b === "string" && <span className="text-[14px] font-semibold text-text-primary">{b}</span>}
                  {founding && has && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-wash text-green-dark px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]">
                      <Icon name="sparkles" size={12} /> First 300
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </Reveal>
      ))}
    </div>
  );
}

export function PricingPage() {
  const [audience, setAudience] = useAudience();
  const [annual, setAnnual] = useState(false);
  const model = PRICING[audience];
  const fn = model.footnote;
  const bfn = model.belowFootnote;
  const perProperty = model.plans.some((p) => p.unitLabel?.includes("/property"));

  const onAudience = (a: typeof audience) => {
    setAudience(a);
    if (!PRICING[a].billing) setAnnual(false);
  };

  return (
    <div className="newcondo-page min-h-dvh">
      <Navbar forceSolid />

      <PageHero
        label="Pricing hero"
        eyebrow="Plans & pricing"
        title="Pricing"
        lead="One transparent plan structure for every kind of Newcondo user. Pick who you are — the plans adjust to you."
      />

      <section className="bg-surface-soft" data-screen-label="Pricing plans">
        <div className="max-w-[1440px] mx-auto px-[var(--gutter)] pt-[clamp(40px,5vw,64px)] pb-[clamp(64px,9vw,120px)]">
          <div className="flex flex-col items-center gap-7">
            <Reveal>
              <Segmented audience={audience} onAudience={onAudience} />
            </Reveal>
            {model.billing && <BillingToggle annual={annual} onToggle={setAnnual} />}
          </div>

          <motion.div key={audience} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
            <div className="max-w-[860px] mx-auto text-center mt-[clamp(40px,5vw,64px)] mb-12">
              <h2 className="nc-h2">{model.title}</h2>
              <p className="nc-lead mt-5 mx-auto max-w-[680px]">{model.lead}</p>
            </div>

            <Group
              className={cx(
                model.plans.length === 1 ? "flex justify-center" : "plan-grid",
                model.plans.length === 3 && "plan-grid--3"
              )}
              stagger={0.12}
            >
              {model.plans.map((p) => <PlanCard key={p.id} plan={p} annual={annual} solo={model.plans.length === 1} />)}
            </Group>

            {perProperty && (
              <p className="mx-auto mt-6 max-w-[620px] text-center text-[14px] leading-[1.55] text-text-secondary">
                Prices are per property. Each property gets its own fumigation, inspection and waste schedule — and its own
                tier, so you can mix Essential and Premium across your portfolio. Your bill is the sum.
              </p>
            )}

            <div className="mt-[clamp(56px,7vw,96px)]">
              {model.plans.length === 1 ? (
                <FoundingFeatures model={model} />
              ) : (
                <ComparisonTable model={model} annual={annual} />
              )}
            </div>

            <Reveal className="flex gap-[22px] items-start max-w-[1080px] mx-auto mt-[42px] bg-surface border border-[rgba(0,0,0,0.06)] rounded-card px-[34px] py-8 shadow-card max-[680px]:flex-col">
              <div className="w-[52px] h-[52px] rounded-[14px] bg-green-wash text-green-dark flex items-center justify-center flex-none">
                <Icon name={fn.icon} size={26} />
              </div>
              <div>
                <h4 className="nc-h4 m-0 mb-2.5">{fn.title}</h4>
                <p className="text-[15.5px] leading-[1.6] text-text-secondary m-0 max-w-[72ch]" dangerouslySetInnerHTML={{ __html: fn.body }} />
                <p className="inline-flex items-center gap-[9px] mt-3.5 font-semibold text-green-dark">
                  <Icon name="gift" size={18} /> {fn.tag}
                </p>
              </div>
            </Reveal>

            {/* Owner-only: properties above the self-serve plot cap, and
                estates, are quoted by sales rather than priced here. Neutral
                surface rather than the green wash — it's a routing note, not
                a benefit. */}
            {bfn && (
              <Reveal className="flex gap-[22px] items-start max-w-[1080px] mx-auto mt-4 bg-surface border border-[rgba(0,0,0,0.06)] rounded-card px-[34px] py-8 shadow-card max-[680px]:flex-col">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-surface-sunken text-ink flex items-center justify-center flex-none">
                  <Icon name={bfn.icon} size={26} />
                </div>
                <div>
                  <h4 className="nc-h4 m-0 mb-2.5">{bfn.title}</h4>
                  <p className="text-[15.5px] leading-[1.6] text-text-secondary m-0 max-w-[72ch]">{bfn.body}</p>
                  <a
                    href={bfn.href}
                    className="mt-3.5 inline-flex items-center gap-2 border-b border-[rgba(19,19,19,0.25)] pb-0.5 font-semibold text-ink no-underline transition-colors duration-200 ease-nc hover:border-ink"
                  >
                    {bfn.cta} <Icon name="arrow-right" size={17} />
                  </a>
                </div>
              </Reveal>
            )}
          </motion.div>
        </div>
      </section>

      <ChatButton />
    </div>
  );
}
