"use client";

/* ============================================================
   Contact — reach-us page. Channels, a message form (composes a
   pre-filled email, so it works with no backend), office address,
   and shortcuts to the specialised desks.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { cx } from "@/lib/cx";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { ChatButton } from "@/components/chat-button";
import { Section } from "@/components/ui/section";
import { SectionHead } from "@/components/ui/section-head";
import { PageHero } from "@/components/ui/page-hero";
import { Button } from "@/components/ui/nc-button";
import { Icon } from "@/components/ui/icon";
import { Reveal, Group, Item, vCard, vFade } from "@/components/motion";
import { CONTACT, MAPS_URL, CONTACT_CHANNELS, CONTACT_TOPICS, CONTACT_SHORTCUTS } from "@/lib/contact-data";

const inputCls = (err?: boolean) =>
  cx(
    "w-full rounded-2xl border bg-surface px-4 py-3.5 text-[15px] text-text-primary outline-none",
    "transition-shadow placeholder:text-text-tertiary focus:border-ink focus:shadow-[0_0_0_4px_rgba(19,19,19,0.08)]",
    err ? "border-danger" : "border-nc-border"
  );

/* ============================================================
   TopicSelect — the "What is it about?" dropdown.

   A native <select> cannot be styled past its trigger: the option list is
   drawn by the operating system, so it arrived as grey Chrome/Windows
   chrome in the middle of a cream, pill-radius, 28px-corner page. Every
   other control here is on-brand and that one popped out as unfinished.

   So the menu is ours: surface card, hairline border, pop shadow, 22px
   radius, a green check on the selection and a chevron that rotates —
   the same vocabulary as NCSelect in the dashboard, sized to the
   marketing form's larger inputs (15px / py-3.5) rather than the
   dashboard's compact ones.

   Kept honest about being a form control: it is a real <button> with
   aria-haspopup/aria-expanded, the list is a listbox with aria-selected
   rows, Escape closes and returns focus, and Up/Down/Home/End move
   through options — because a mouse-only dropdown is a regression on
   the native element it replaced, however good it looks.
   ============================================================ */
function TopicSelect({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, options.indexOf(value)));
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the highlighted row visible when arrowing past the menu's edge.
  // scrollTop math rather than scrollIntoView, which would also scroll the page.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[active] as HTMLElement | undefined;
    if (!el) return;
    const { scrollTop, clientHeight } = listRef.current;
    if (el.offsetTop < scrollTop) listRef.current.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > scrollTop + clientHeight) {
      listRef.current.scrollTop = el.offsetTop + el.offsetHeight - clientHeight;
    }
  }, [active, open]);

  const commit = (v: string) => {
    onChange(v);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); return; }
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setActive(Math.max(0, options.indexOf(value)));
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % options.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i - 1 + options.length) % options.length); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); commit(options[active]); }
  };

  return (
    <div ref={wrapRef} className="relative" onKeyDown={onKeyDown}>
      <button
        ref={btnRef}
        id={id}
        type="button"
        onClick={() => { setActive(Math.max(0, options.indexOf(value))); setOpen((o) => !o); }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cx(
          inputCls(),
          "flex cursor-pointer items-center justify-between gap-3 text-left",
          open && "border-ink shadow-[0_0_0_4px_rgba(19,19,19,0.08)]"
        )}
      >
        <span className="truncate">{value}</span>
        <Icon
          name="chevron-down"
          size={18}
          className={cx("flex-none text-text-tertiary transition-transform duration-200 ease-nc", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={listRef}
            role="listbox"
            aria-activedescendant={`${id}-opt-${active}`}
            initial={{ opacity: 0, y: 8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.985 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-[268px] overflow-auto rounded-[22px] border border-border-hair bg-surface p-2 shadow-pop"
          >
            {options.map((o, i) => {
              const isSel = o === value;
              return (
                <button
                  key={o}
                  id={`${id}-opt-${i}`}
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => commit(o)}
                  className={cx(
                    "flex w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-3 text-left text-[14.5px] transition-colors duration-150",
                    i === active ? "bg-surface-sunken" : "bg-transparent",
                    isSel ? "font-semibold text-text-primary" : "font-medium text-text-secondary"
                  )}
                >
                  {o}
                  {isSel && <Icon name="check" size={16} strokeWidth={2.5} className="flex-none text-green-dark" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
                  <TopicSelect
                    id="c-topic"
                    value={f.topic}
                    onChange={(v) => set("topic", v)}
                    options={CONTACT_TOPICS}
                  />
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

      <Footer />
      <ChatButton />
    </div>
  );
}
