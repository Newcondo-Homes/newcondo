"use client";

/* ============================================================
   Contact — reach-us page. Channels, a message form (composes a
   pre-filled email, so it works with no backend), office address,
   and shortcuts to the specialised desks.
   ============================================================ */

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cx } from "@/lib/cx";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { ChatButton } from "@/components/chat-button";
import { Button } from "@/components/ui/nc-button";
import { Section } from "@/components/ui/section";
import { SectionHead } from "@/components/ui/section-head";
import { PageHero } from "@/components/ui/page-hero";
import { Icon } from "@/components/ui/icon";
import { Reveal, Group, Item, vCard, vFade } from "@/components/motion";
import { CONTACT, MAPS_URL, CONTACT_CHANNELS, CONTACT_TOPICS, CONTACT_SHORTCUTS } from "@/lib/contact-data";

const inputCls = (err?: boolean) =>
  cx(
    "w-full rounded-2xl border bg-surface px-4 py-3.5 text-[15px] text-text-primary outline-none",
    "transition-shadow placeholder:text-text-tertiary focus:border-ink focus:shadow-[0_0_0_4px_rgba(19,19,19,0.08)]",
    err ? "border-danger" : "border-nc-border"
  );

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13.5px] font-semibold text-text-primary">
      {children}
    </label>
  );
}

export function Contact() {
  const [f, setF] = useState({ name: "", email: "", topic: CONTACT_TOPICS[0], message: "" });
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim());
  const errs = {
    name: touched && !f.name.trim(),
    email: touched && !emailOk,
    message: touched && f.message.trim().length < 10,
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!f.name.trim() || !emailOk || f.message.trim().length < 10) return;
    // No mail backend on the marketing site — hand off to the visitor's mail client
    // with everything pre-filled, so nothing is silently dropped.
    const subject = `[${f.topic}] — message from ${f.name.trim()}`;
    const body = `${f.message.trim()}\n\n—\n${f.name.trim()}\n${f.email.trim()}`;
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <div className="newcondo-page min-h-dvh">
      <Navbar forceSolid />

      <PageHero
        label="Contact hero"
        eyebrow="Contact"
        title={["Talk to", "a human."]}
        lead="Questions about listing, marking, rent, or your account — reach us directly. We read every message and reply within 24 hours."
      />

      {/* ---- Channels ---- */}
      <Section id="channels" label="Contact channels">
        <SectionHead eyebrow="Reach us" title="Pick whichever is easiest." />
        <Group stagger={0.07} className="grid grid-cols-3 gap-[clamp(16px,2vw,24px)] max-[760px]:grid-cols-1">
          {CONTACT_CHANNELS.map((ch) => {
            const internal = ch.href.startsWith("/");
            const cls =
              "group block h-full rounded-card border border-border-hair bg-surface p-[clamp(24px,3vw,34px)] no-underline shadow-card transition-transform duration-200 ease-nc hover:-translate-y-1";
            const inner = (
              <>
                <span className="mb-5 grid h-12 w-12 place-items-center rounded-[13px] bg-ink text-cream">
                  <Icon name={ch.icon} size={22} />
                </span>
                <span className="block text-[12px] font-semibold tracking-[0.12em] uppercase text-text-tertiary mb-2">
                  {ch.label}
                </span>
                <div className="text-[19px] font-bold tracking-[-0.02em] text-text-primary mb-1.5 break-words">
                  {ch.value}
                </div>
                <p className="text-[14px] leading-[1.5] text-text-secondary m-0">{ch.sub}</p>
              </>
            );
            return internal ? (
              <Item key={ch.label} variants={vCard}>
                <Link href={ch.href} className={cls}>
                  {inner}
                </Link>
              </Item>
            ) : (
              <Item key={ch.label} variants={vCard} as="a" href={ch.href} className={cls}>
                {inner}
              </Item>
            );
          })}
        </Group>
      </Section>

      {/* ---- Form + office ---- */}
      <Section id="message" label="Send a message" cream>
        <div className="grid grid-cols-[1.25fr_1fr] gap-[clamp(20px,3vw,40px)] items-start max-[900px]:grid-cols-1">
          {/* form */}
          <Reveal className="rounded-card border border-border-hair bg-surface p-[clamp(24px,3.4vw,44px)] shadow-card">
            <span className="block text-[12px] font-semibold tracking-[0.14em] uppercase text-text-tertiary mb-3">
              Send a message
            </span>
            <h2 className="text-[clamp(26px,3vw,38px)] font-bold tracking-[-0.035em] leading-[1.05] text-text-primary m-0 mb-2">
              Tell us what you need.
            </h2>
            <p className="text-[15.5px] leading-[1.55] text-text-secondary m-0 mb-8 max-w-[52ch]">
              Fill this in and we&rsquo;ll open a pre-addressed email from your mail app — so you always keep a copy of
              what you sent.
            </p>

            {sent ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border-hair bg-green-wash p-[clamp(22px,3vw,32px)]"
              >
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-[12px] bg-green-dark text-white">
                  <Icon name="check" size={22} />
                </span>
                <h3 className="text-[19px] font-bold tracking-[-0.02em] text-text-primary m-0 mb-2">
                  Your email is ready to send.
                </h3>
                <p className="text-[14.5px] leading-[1.55] text-text-secondary m-0 mb-5 max-w-[52ch]">
                  We&rsquo;ve opened your mail app with the message pre-filled. If nothing happened, email us directly at{" "}
                  <a href={`mailto:${CONTACT.email}`} className="font-semibold text-text-primary underline">
                    {CONTACT.email}
                  </a>
                  .
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setTouched(false);
                    setF({ name: "", email: "", topic: CONTACT_TOPICS[0], message: "" });
                  }}
                  className="text-[14.5px] font-semibold text-green-dark hover:underline bg-transparent border-0 cursor-pointer p-0"
                >
                  Write another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={submit} noValidate>
                <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
                  <div>
                    <Label htmlFor="c-name">Your name</Label>
                    <input
                      id="c-name"
                      className={inputCls(errs.name)}
                      placeholder="e.g. Chidera Okonkwo"
                      value={f.name}
                      onChange={(e) => set("name", e.target.value)}
                    />
                    {errs.name && <p className="mt-1.5 mb-0 text-[13px] text-danger">Please tell us your name.</p>}
                  </div>
                  <div>
                    <Label htmlFor="c-email">Email address</Label>
                    <input
                      id="c-email"
                      type="email"
                      inputMode="email"
                      className={inputCls(errs.email)}
                      placeholder="you@example.com"
                      value={f.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                    {errs.email && <p className="mt-1.5 mb-0 text-[13px] text-danger">Enter a valid email address.</p>}
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="c-topic">What is it about?</Label>
                  <select
                    id="c-topic"
                    className={cx(inputCls(), "appearance-none cursor-pointer")}
                    value={f.topic}
                    onChange={(e) => set("topic", e.target.value)}
                  >
                    {CONTACT_TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4">
                  <Label htmlFor="c-message">Message</Label>
                  <textarea
                    id="c-message"
                    className={cx(inputCls(errs.message), "min-h-[150px] resize-y")}
                    placeholder="Give us the details — the more specific, the faster we can help."
                    value={f.message}
                    onChange={(e) => set("message", e.target.value)}
                  />
                  {errs.message && (
                    <p className="mt-1.5 mb-0 text-[13px] text-danger">Please add a little more detail.</p>
                  )}
                </div>

                <div className="mt-7 flex items-center gap-5 flex-wrap">
                  <Button as="button" variant="dark" icon="arrow-right">
                    Send message
                  </Button>
                  <span className="inline-flex items-center gap-2 text-[13.5px] text-text-tertiary">
                    <Icon name="shield-check" size={16} className="text-green-dark" />
                    We never share your details.
                  </span>
                </div>
              </form>
            )}
          </Reveal>

          {/* office */}
          <Group stagger={0.08} className="flex flex-col gap-[clamp(16px,2vw,24px)]">
            <Item variants={vCard} className="rounded-card border border-border-hair bg-surface p-[clamp(24px,3vw,34px)] shadow-card">
              <span className="mb-5 grid h-12 w-12 place-items-center rounded-[13px] bg-green-wash text-green-dark">
                <Icon name="map-pin" size={22} />
              </span>
              <span className="block text-[12px] font-semibold tracking-[0.12em] uppercase text-text-tertiary mb-2">
                Our office
              </span>
              <address className="not-italic text-[16.5px] leading-[1.55] font-semibold tracking-[-0.01em] text-text-primary m-0">
                {CONTACT.addressLines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </address>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noreferrer"
                className="group mt-5 inline-flex items-center gap-2 text-[14.5px] font-semibold text-text-primary no-underline"
              >
                Open in Google Maps
                <Icon
                  name="arrow-up-right"
                  size={16}
                  className="transition-transform duration-200 ease-nc group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </Item>

            <Item variants={vCard} className="rounded-card border border-border-hair bg-surface p-[clamp(24px,3vw,34px)] shadow-card">
              <span className="block text-[12px] font-semibold tracking-[0.12em] uppercase text-text-tertiary mb-4">
                Office hours
              </span>
              <p className="flex items-start gap-2.5 text-[15.5px] leading-[1.5] text-text-primary font-semibold m-0 mb-4">
                <Icon name="clock" size={18} className="mt-0.5 flex-none text-text-tertiary" />
                {CONTACT.hours}
              </p>
              <div className="h-px bg-divider my-5" />
              <a
                href={`tel:${CONTACT.phoneRaw}`}
                className="flex items-center gap-2.5 text-[15px] font-semibold text-text-primary no-underline mb-3 hover:underline"
              >
                <Icon name="phone" size={17} className="flex-none text-text-tertiary" />
                {CONTACT.phoneDisplay}
              </a>
              <a
                href={`mailto:${CONTACT.email}`}
                className="flex items-center gap-2.5 text-[15px] font-semibold text-text-primary no-underline break-all hover:underline"
              >
                <Icon name="mail" size={17} className="flex-none text-text-tertiary" />
                {CONTACT.email}
              </a>
            </Item>
          </Group>
        </div>
      </Section>

      {/* ---- Shortcuts ---- */}
      <Section id="desks" label="Other desks">
        <SectionHead eyebrow="Looking for something specific?" title="These desks answer faster." />
        <Group stagger={0.07} className="grid grid-cols-3 gap-[clamp(16px,2vw,24px)] max-[860px]:grid-cols-1">
          {CONTACT_SHORTCUTS.map((s) => (
            <Item key={s.title} variants={vCard}>
              <Link
                href={s.href}
                className="group block h-full rounded-card border border-border-hair bg-surface p-[clamp(22px,2.6vw,30px)] no-underline shadow-card transition-transform duration-200 ease-nc hover:-translate-y-1"
              >
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-[12px] bg-green-wash text-green-dark">
                  <Icon name={s.icon} size={22} />
                </span>
                <h3 className="text-[18px] font-bold tracking-[-0.02em] text-text-primary m-0 mb-2">{s.title}</h3>
                <p className="text-[14.5px] leading-[1.55] text-text-secondary m-0 mb-4">{s.body}</p>
                <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-green-dark">
                  Go there
                  <Icon
                    name="arrow-right"
                    size={15}
                    className="transition-transform duration-200 ease-nc group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </Item>
          ))}
        </Group>
      </Section>

      <ChatButton />
    </div>
  );
}
