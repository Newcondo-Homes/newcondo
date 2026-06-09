// apps/platform/app/(auth)/login/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Wallet, ShieldCheck, Receipt, Lock } from "lucide-react";
import { ImageSlot } from "@/components/ui/image-slot";
import { auth } from '@newcondo/auth'
import { redirect } from 'next/navigation'
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In | NewCondo",
  description: "Sign in to your NewCondo account",
};

const LOGO_CREAM = "/assets/logo-mark-cream-tight.png";
const LOGO_DARK = "/assets/logo-mark-dark-tight.png";

const POINTS = [
  { icon: Wallet, label: "Rent held in escrow — agents cannot touch it" },
  { icon: ShieldCheck, label: "Identity-verified tenants and tracked agents" },
  { icon: Receipt, label: "Know who paid, when, and what is still pending" },
];

export default async function LoginPage() {
  const session = await auth();

  // Redirect if already authenticated
  if (session) {
    redirect('/dashboard')
  }

  return (
    <main
      data-screen-label="Sign in"
      className="grid h-screen grid-cols-[1.05fr_1fr] overflow-hidden max-[940px]:grid-cols-1"
    >
      {/* ============ LEFT — cinematic brand aside ============ */}
      <aside className="relative flex flex-col justify-between gap-[clamp(18px,3.5vh,44px)] overflow-hidden bg-ink p-[clamp(28px,3.2vh,56px)] text-cream max-[940px]:hidden">
        {/* photography placeholder (swap for next/image) */}
        <div className="absolute inset-0 z-0">
          <ImageSlot placeholder="Nigerian apartment building · warm evening light" />
        </div>
        {/* hero-style scrim */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(to top, rgba(8,8,7,0.92) 2%, rgba(8,8,7,0.5) 48%, rgba(8,8,7,0.55) 100%), linear-gradient(to right, rgba(8,8,7,0.55), rgba(8,8,7,0.2) 60%, rgba(8,8,7,0.45))",
          }}
        />

        {/* brand */}
        <Link
          href="/"
          className="relative z-[2] flex items-center gap-[11px] self-start text-[22px] font-bold tracking-[-0.04em] text-cream no-underline"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_CREAM} alt="Newcondo" className="w-[30px] h-auto" />
          <span>newcondo</span>
        </Link>

        {/* value prop */}
        <div className="relative z-[2] max-w-[30ch]">
          <p className="m-0 mb-[clamp(12px,1.8vh,22px)] text-[12px] font-semibold uppercase tracking-[0.16em] text-green-bright">
            For property owners
          </p>
          <h2 className="m-0 text-[clamp(30px,3vw,50px)] font-bold leading-[0.98] tracking-[-0.045em] text-cream text-balance">
            Your property, finally under your control.
          </h2>
          <p className="mt-[clamp(14px,2vh,22px)] max-w-[34ch] text-[clamp(18px,1.6vw,22px)] leading-[1.5] text-text-on-dark-2">
            Sign in to track rent, verified tenants, and every agent — from one dashboard.
          </p>

          <ul className="m-0 mt-[clamp(22px,3.5vh,40px)] flex list-none flex-col gap-[clamp(12px,1.8vh,18px)] p-0">
            {POINTS.map(({ icon: PtIcon, label }) => (
              <li key={label} className="flex items-center gap-3.5 text-[15.5px] font-medium text-text-on-dark">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-[rgba(249,249,239,0.14)] bg-[rgba(249,249,239,0.08)] text-green-bright">
                  <PtIcon size={19} strokeWidth={1.85} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* foot */}
        <p className="relative z-[2] flex items-center gap-3 text-[14px] text-text-on-dark-2">
          <Lock size={16} strokeWidth={1.85} className="flex-none text-green-bright" />
          Bank-grade security. Your data is encrypted end to end.
        </p>
      </aside>

      {/* ============ RIGHT — form panel ============ */}
      <section className="relative flex flex-col overflow-hidden bg-background px-[clamp(24px,4vw,56px)] py-[clamp(20px,2.6vh,40px)]">
        <div className="flex items-center justify-between">
          {/* brand shows only when the aside is collapsed */}
          <Link
            href="/"
            className="hidden items-center gap-2.5 text-[19px] font-bold tracking-[-0.04em] text-ink no-underline max-[940px]:inline-flex"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_DARK} alt="Newcondo" className="w-[26px] h-auto" />
            <span>newcondo</span>
          </Link>
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[14.5px] font-semibold text-text-secondary no-underline transition-colors duration-200 ease-nc hover:text-ink"
          >
            <ArrowLeft size={17} strokeWidth={1.85} className="transition-transform duration-200 ease-nc group-hover:-translate-x-[3px]" />
            Back to site
          </Link>
        </div>

        <div className="mx-auto my-auto w-full max-w-[408px] py-[clamp(8px,1.8vh,32px)]">
          <div className="mb-[clamp(16px,2.6vh,28px)]">
            <h1 className="m-0 text-[clamp(30px,3.2vw,42px)] font-bold leading-none tracking-[-0.04em] text-text-primary">
              Welcome back
            </h1>
            <p className="mt-2.5 text-[16px] leading-[1.5] text-text-secondary">
              Sign in to your account to continue.
            </p>
          </div>

          <LoginForm />

          <p className="mt-[clamp(12px,2.2vh,28px)] text-center text-[14.5px] text-text-secondary">
            New to Newcondo?{" "}
            <Link
              href="/#pricing"
              className="border-b border-[rgba(0,0,0,0.14)] pb-px font-semibold text-ink no-underline transition-colors duration-200 ease-nc hover:border-ink"
            >
              List your property
            </Link>
          </p>

          <p className="mt-[clamp(10px,1.8vh,26px)] text-center text-[12px] leading-[1.5] text-text-tertiary">
            By signing in you agree to our{" "}
            <Link href="/#terms" className="text-text-secondary underline underline-offset-2">Terms</Link>{" "}
            and{" "}
            <Link href="/#privacy" className="text-text-secondary underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
