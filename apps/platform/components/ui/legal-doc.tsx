"use client";

/* ============================================================
   Shared legal-document scaffold + primitives.
   Both /privacy and /refund compose <LegalDoc> with the same
   sticky-TOC + scrollspy chrome, then drop <DocSection>s inside.
   ============================================================ */

import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Navbar } from "@/components/sections/navbar";
import { ChatButton } from "@/components/chat-button";
import { Reveal, Group, Item, vFade, vRow } from "@/components/motion";

export type TocItem = { id: string; n: string; label: string };
export type MetaChip = { icon: string; label?: string; value: string; green?: boolean };

/* renders <strong>-bearing strings supplied from data files */
export function html(s: string) {
  return <span dangerouslySetInnerHTML={{ __html: s }} />;
}

/* ---------- inline building blocks ---------- */

export function SecHead({ n, children }: { n: string; children: ReactNode }) {
  return (
    <>
      <span className="block font-mono text-[13px] text-green-dark mb-3.5">{n}</span>
      <Reveal as="h2" variants={vFade} className="m-0 mb-[22px] text-[clamp(28px,3.4vw,40px)] font-bold leading-[1.04] tracking-[-0.035em] text-text-primary">
        {children}
      </Reveal>
    </>
  );
}

export function P({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`m-0 mb-[18px] text-[16.5px] leading-[1.66] text-text-secondary last:mb-0 ${className}`}>{children}</p>;
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-[34px] mb-3 text-[19px] font-semibold leading-[1.3] tracking-[-0.02em] text-text-primary">{children}</h3>;
}

export function B({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-text-primary">{children}</strong>;
}

export function DocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="text-green-dark underline decoration-[rgba(0,143,90,0.35)] underline-offset-[3px] transition-colors hover:decoration-green-dark"
    >
      {children}
    </a>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="m-0 mt-1.5 mb-[18px] flex list-none flex-col gap-3 p-0">
      {items.map((it, i) => (
        <li key={i} className="relative pl-[26px] text-[16px] leading-[1.58] text-text-secondary">
          <span className="absolute left-1 top-[11px] h-1.5 w-1.5 rounded-full bg-green opacity-[0.85]" />
          {it}
        </li>
      ))}
    </ul>
  );
}

export function DocTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <Reveal variants={vFade} className="my-2 overflow-hidden rounded-[16px] border border-border-hair bg-surface">
      <table className="w-full border-collapse text-[14.5px]">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className="bg-surface-sunken border-b border-border-hair px-[22px] py-[15px] text-left text-[12px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td
                  key={ci}
                  className={`border-b border-divider px-[22px] py-[17px] align-top leading-[1.5] [tr:last-child_&]:border-b-0 ${
                    ci === 0 ? "font-semibold text-text-primary" : "text-text-secondary"
                  }`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Reveal>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[13px] text-text-primary">{children}</span>;
}

export type CalloutTone = "note" | "green" | "warn";
const CALLOUT_STYLES: Record<CalloutTone, { wrap: string; icon: string }> = {
  note: { wrap: "bg-surface-sunken text-text-secondary", icon: "text-text-tertiary" },
  green: { wrap: "bg-green-wash text-[#0a5a3c]", icon: "text-green-dark" },
  warn: { wrap: "bg-[#fbf2dd] text-[#7a5208]", icon: "text-[#b07d12]" },
};

export function Callout({ tone, icon, children, className = "" }: { tone: CalloutTone; icon: string; children: ReactNode; className?: string }) {
  const s = CALLOUT_STYLES[tone];
  return (
    <Reveal variants={vFade} className={`my-[22px] flex items-start gap-3.5 rounded-[16px] px-6 py-5 text-[15px] leading-[1.6] ${s.wrap} ${className}`}>
      <span className={`mt-px flex-none ${s.icon}`}>
        <Icon name={icon} size={20} />
      </span>
      <p className="m-0">{children}</p>
    </Reveal>
  );
}

export function DocSection({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <Reveal
      as="section"
      variants={vFade}
      id={id}
      data-screen-label={label}
      className="scroll-mt-[104px] border-b border-divider pb-[clamp(48px,6vw,76px)] pt-2 last:border-b-0 [&:not(:first-child)]:mt-[clamp(48px,6vw,76px)]"
    >
      {children}
    </Reveal>
  );
}

/* a contact card — shared shape for both docs */
export function ContactCard({ items }: { items: { label: string; value: string; href?: string; mono?: boolean }[] }) {
  return (
    <Reveal variants={vFade} className="mt-2 grid grid-cols-2 gap-x-10 gap-y-7 rounded-card bg-ink p-[clamp(28px,4vw,44px)] text-text-on-dark max-[640px]:grid-cols-1">
      {items.map((c) => (
        <div key={c.label} className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-text-on-dark-2">{c.label}</span>
          <span className={`text-[16px] leading-[1.5] text-cream ${c.mono ? "font-mono text-[14px]" : ""}`}>
            {c.href ? (
              <a href={c.href} className="text-green-bright no-underline hover:underline">{c.value}</a>
            ) : (
              c.value
            )}
          </span>
        </div>
      ))}
    </Reveal>
  );
}

/* ---------- the page scaffold ---------- */

export function LegalDoc({
  eyebrow,
  crumb,
  title,
  lead,
  meta,
  toc,
  children,
}: {
  eyebrow: string;
  crumb: string;
  title: string;
  lead: ReactNode;
  meta: MetaChip[];
  toc: TocItem[];
  children: ReactNode;
}) {
  const [active, setActive] = useState<string>(toc[0]?.id ?? "");

  useEffect(() => {
    const els = toc.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [toc]);

  return (
    <div className="newcondo-page min-h-dvh">
      <Navbar forceSolid />

      {/* ============ DOCUMENT HEADER ============ */}
      <header className="mx-auto max-w-[1440px] px-[var(--gutter)] pb-[clamp(40px,6vw,64px)] pt-[clamp(120px,15vh,168px)]" data-screen-label={`${crumb} header`}>
        <Group stagger={0.07}>
          <Item variants={vRow} as="nav" className="mb-[26px] flex items-center gap-2 text-[13px] text-text-tertiary" aria-label="Breadcrumb">
            <a href="/" className="text-text-tertiary no-underline transition-colors duration-200 ease-nc hover:text-ink">Home</a>
            <Icon name="chevron-right" size={14} className="opacity-60" />
            <span>Legal</span>
            <Icon name="chevron-right" size={14} className="opacity-60" />
            <span>{crumb}</span>
          </Item>
          <Item variants={vRow} as="span" className="mb-5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
            {eyebrow}
          </Item>
          <Item variants={vRow} as="h1" className="m-0 mb-[26px] max-w-[16ch] text-[clamp(46px,6.5vw,88px)] font-bold leading-[0.94] tracking-[-0.05em] text-text-primary">
            {title}
          </Item>
          <Item variants={vRow} as="p" className="m-0 max-w-[58ch] text-[clamp(18px,1.6vw,22px)] leading-[1.5] text-text-secondary">
            {lead}
          </Item>
          <Item variants={vRow} className="mt-[34px] flex flex-wrap items-center gap-x-3.5 gap-y-3">
            {meta.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-[9px] rounded-full border border-border-hair bg-surface px-[18px] py-2.5 text-[13.5px] text-text-secondary shadow-[0_1px_2px_rgba(19,19,19,0.04)]"
              >
                <span className={c.green ? "text-green-dark" : "text-text-tertiary"}>
                  <Icon name={c.icon} size={16} />
                </span>
                {c.label && <span>{c.label}</span>}
                <strong className="font-semibold text-text-primary">{c.value}</strong>
              </span>
            ))}
          </Item>
        </Group>
      </header>

      {/* ============ TOC + CONTENT ============ */}
      <div className="mx-auto grid max-w-[1440px] grid-cols-[264px_minmax(0,1fr)] items-start gap-x-[clamp(40px,6vw,88px)] px-[var(--gutter)] pb-[clamp(72px,10vw,128px)] max-[980px]:grid-cols-1">
        <aside className="sticky top-[104px] max-[980px]:hidden" aria-label="On this page">
          <div className="mb-2 border-b border-divider pb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">On this page</div>
          <ul className="m-0 flex list-none flex-col p-0">
            {toc.map((t) => {
              const on = active === t.id;
              return (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className={`flex items-baseline gap-[11px] py-2 text-[14px] leading-[1.35] no-underline transition-colors duration-200 ease-nc ${
                      on ? "font-semibold text-ink" : "text-text-tertiary hover:text-ink"
                    }`}
                  >
                    <span className={`w-[18px] flex-none font-mono text-[11.5px] ${on ? "text-green-dark opacity-100" : "opacity-70"}`}>{t.n}</span>
                    {t.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </aside>

        <main className="max-w-[760px]">{children}</main>
      </div>
      <ChatButton />
    </div>
  );
}
