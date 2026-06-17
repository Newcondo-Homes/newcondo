"use client";

import Link from "next/link";
import {
  Gift,
  ShieldCheck,
  MapPin,
  Wallet,
  Home,
  Building2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Reveal, Group, Item, vFade, vCard, vRow, EASE } from "@/components/motion";
import { RButton } from "@/components/ui/button";

/* ============================================================
   Shape returned by GET /api/referrals/public/:code
   ============================================================ */
export interface ReferralData {
  valid: boolean;
  referrer: {
    name: string;
    role: "OWNER" | "AGENT" | "RENTER";
  };
  reward?: {
    amount: number;
    description: string;
  } | null;
}

const ROLE_META: Record<ReferralData["referrer"]["role"], { label: string; Icon: LucideIcon }> = {
  OWNER: { label: "Property owner", Icon: Building2 },
  AGENT: { label: "Listing agent", Icon: Users },
  RENTER: { label: "Renter", Icon: Home },
};

const BENEFITS: { Icon: LucideIcon; title: string; desc: string }[] = [
  {
    Icon: ShieldCheck,
    title: "Verified properties",
    desc: "Every listing is backed by proof of ownership and ID verification. No fake posts, no random online guesses.",
  },
  {
    Icon: MapPin,
    title: "No double-booking",
    desc: "GPS-marked properties and real-time availability mean what you see is genuinely available to rent.",
  },
  {
    Icon: Wallet,
    title: "Protected payments",
    desc: "Your rent is held securely for 24 hours so you confirm the property before any funds are released.",
  },
];

const STEPS: { t: string; d: string }[] = [
  {
    t: "Sign up",
    d: "Create your free NewCondo account using this invitation — it stays linked to your reward.",
  },
  {
    t: "Verify your identity",
    d: "Add your details and verify with your NIN, BVN, or a government-issued ID.",
  },
  {
    t: "Unlock your reward",
    d: "Subscribe or complete your first transaction, and your welcome credit is released automatically.",
  },
];

export function ReferralInvitation({ data, code }: { data: ReferralData; code: string }) {
  const { referrer, reward } = data;
  const role = ROLE_META[referrer.role] ?? ROLE_META.RENTER;
  const RoleIcon = role.Icon;
  const initials = referrer.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="mx-auto flex max-w-[760px] flex-col gap-[clamp(20px,3vw,28px)] px-[var(--gutter)] pb-[clamp(56px,8vw,96px)] pt-[clamp(40px,7vw,84px)]">
      {/* ============ HERO ============ */}
      <Group as="section" stagger={0.08} className="flex flex-col items-center text-center">
        <Item
          as="span"
          variants={vRow}
          className="inline-flex items-center gap-2 rounded-full bg-green-wash px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-green-dark"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_0_4px_rgba(0,180,115,0.16)]" />
          Exclusive invitation
        </Item>
        <Item
          as="h1"
          variants={vFade}
          className="mt-[22px] text-[clamp(34px,5.4vw,56px)] font-bold leading-[0.96] tracking-[-0.045em] text-text-primary [text-wrap:balance]"
        >
          You&apos;ve been invited
          <br />
          to Newcondo.
        </Item>
        <Item
          as="p"
          variants={vFade}
          className="mx-auto mt-5 max-w-[50ch] text-[clamp(16px,1.7vw,18px)] leading-[1.5] text-text-secondary [text-wrap:pretty]"
        >
          Join <b className="font-semibold text-text-primary">{referrer.name}</b> on the platform
          built to rent, list, and verify Nigerian properties — without agent confusion,
          double-booking, or payment stress.
        </Item>
      </Group>

      {/* ============ REFERRER + REWARD ============ */}
      <Reveal
        variants={vCard}
        className="rounded-card border border-border-hair bg-surface p-[clamp(22px,3vw,32px)] shadow-card"
      >
        <div className="flex items-center gap-4">
          <div className="grid h-[60px] w-[60px] flex-none place-items-center rounded-full bg-ink text-[24px] font-bold tracking-[-0.02em] text-cream">
            {initials}
          </div>
          <div className="flex min-w-0 flex-col gap-[3px]">
            <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
              Invited by
            </span>
            <span className="text-[21px] font-bold leading-[1.05] tracking-[-0.03em] text-text-primary">
              {referrer.name}
            </span>
          </div>
          <span className="ml-auto inline-flex flex-none items-center gap-[7px] self-center rounded-full bg-surface-sunken px-3.5 py-2 text-[13px] font-semibold text-text-secondary">
            <RoleIcon size={15} strokeWidth={2} className="text-ink" />
            {role.label}
          </span>
        </div>

        {reward && (
          <div className="mt-5 flex items-center gap-[18px] rounded-[16px] border border-[rgba(0,143,90,0.18)] bg-green-wash px-[22px] py-5">
            <div className="grid h-[50px] w-[50px] flex-none place-items-center rounded-[14px] bg-white text-green-dark shadow-[0_1px_2px_rgba(19,19,19,0.06)]">
              <Gift size={24} strokeWidth={1.85} />
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-green-dark">
                Your welcome reward
              </span>
              <span className="font-mono text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] text-green-dark">
                ₦{reward.amount.toLocaleString()}
              </span>
              <span className="text-[13.5px] leading-[1.4] text-text-secondary">
                {reward.description}
              </span>
            </div>
          </div>
        )}
      </Reveal>

      {/* ============ BENEFITS ============ */}
      {/* Ported 1:1 from the HTML preview's `.reveal`: each card fades up
          y:28→0 over 0.7s with ease (0.22,1,0.36,1), staggered 55ms apart.
          Explicit per-card motion so no parent/container transition can
          override the timing. */}
      <section className="grid grid-cols-3 gap-4 max-[680px]:grid-cols-1">
        {BENEFITS.map((b, i) => {
          const BIcon = b.Icon;
          return (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.7, ease: EASE, delay: i * 0.055 }}
              whileHover={{ y: -6, transition: { duration: 0.45, ease: EASE } }}
              className="group rounded-card border border-border-hair bg-surface p-6 shadow-card transition-[box-shadow,border-color] duration-[450ms] ease-nc hover:border-border hover:shadow-lift"
            >
              <span className="grid h-[46px] w-[46px] place-items-center rounded-[14px] bg-surface-sunken text-ink transition-colors duration-[450ms] ease-nc group-hover:bg-ink group-hover:text-cream">
                <BIcon size={22} strokeWidth={1.85} />
              </span>
              <h3 className="mt-[18px] text-[17px] font-bold tracking-[-0.02em] text-text-primary">
                {b.title}
              </h3>
              <p className="mt-2 text-[14px] leading-[1.5] text-text-secondary [text-wrap:pretty]">
                {b.desc}
              </p>
            </motion.div>
          );
        })}
      </section>

      {/* ============ CTA ============ */}
      <Reveal
        variants={vCard}
        className="overflow-hidden rounded-card bg-ink px-[clamp(24px,4vw,44px)] py-[clamp(34px,5vw,52px)] text-center text-cream"
      >
        <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-green-bright">
          Claim your reward
        </span>
        <h2 className="mt-3 text-[clamp(26px,3.4vw,36px)] font-bold leading-[1.02] tracking-[-0.04em] text-cream [text-wrap:balance]">
          Ready to get started?
        </h2>
        <p className="mx-auto mt-3.5 max-w-[42ch] text-[15.5px] leading-[1.5] text-text-on-dark-2">
          Create your account today, get set up in minutes, and your welcome credit unlocks on your
          first transaction.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3.5">
          <RButton as="a" href={`/onboarding?ref=${code}`} variant="light" size="md" icon="arrow-right">
            Create your account
          </RButton>
          <span className="text-[14px] text-text-on-dark-2">
            Already have an account?{" "}
            <Link
              href={`/login?ref=${code}`}
              className="border-b border-[rgba(249,249,239,0.3)] pb-px font-semibold text-cream no-underline transition-colors duration-200 ease-nc hover:border-cream"
            >
              Sign in
            </Link>
          </span>
        </div>
      </Reveal>

      {/* ============ HOW IT WORKS ============ */}
      <Reveal
        variants={vCard}
        className="rounded-card border border-border-hair bg-surface p-[clamp(24px,3.4vw,36px)] shadow-card"
      >
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
          How it works
        </span>
        <h2 className="mt-2 text-[clamp(22px,2.6vw,28px)] font-bold tracking-[-0.035em] text-text-primary">
          Three steps to your reward
        </h2>
        <Group stagger={0.08} className="mt-[26px] flex flex-col">
          {STEPS.map((s, i) => (
            <Item
              key={s.t}
              variants={vRow}
              className="flex gap-[18px] border-t border-[rgba(0,0,0,0.08)] py-[18px] first:border-t-0 first:pt-0 last:pb-0"
            >
              <div className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full border border-border bg-surface font-mono text-[15px] font-semibold text-ink">
                {i + 1}
              </div>
              <div className="flex flex-col gap-1 pt-[5px]">
                <span className="text-[16px] font-semibold tracking-[-0.01em] text-text-primary">
                  {s.t}
                </span>
                <span className="text-[14px] leading-[1.5] text-text-secondary">{s.d}</span>
              </div>
            </Item>
          ))}
        </Group>
      </Reveal>
    </main>
  );
}
