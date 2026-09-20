"use client";

/* ============================================================
   SocialAccountDetails — cohesive gap-fill step for OAuth sign-ups

   Replaces separate screens (terms, then phone, then email) with ONE
   card so the tail end of a social sign-up doesn't feel like friction:
   a short intro, the fields the provider didn't give us, then the terms
   checkbox sitting directly above the single Continue button that gates
   on all of them.

   EMAIL: Google always returns a verified email, but Facebook does NOT
   guarantee one — the user may have signed up with a phone number, or
   declined the email permission, or their Facebook email may be
   unverified. When that happens the account has no email to send
   receipts, marking updates or password resets to, so we ask for it
   here. `needsEmail` is set by the flow when session.user.email is
   empty, and the field simply doesn't render for Google users.
   ============================================================ */

import { useState } from "react";
import { ArrowRight, ArrowLeft, Phone, Mail, Loader2 } from "lucide-react";
import { UserType } from "@/types/api";

const NG_PHONE_RE = /^(\+234|0)[789]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SocialDetailsPayload {
  phone: string;
  /** Only present when the provider (Facebook) gave us no email. */
  email?: string;
}

export default function SocialAccountDetails({
  name,
  role,
  needsEmail = false,
  error,
  onSubmit,
  onBack,
}: {
  name?: string | null;
  /** Drives the helper copy so it matches what they chose in step 1. */
  role?: UserType;
  /** True when the OAuth provider returned no email (Facebook). */
  needsEmail?: boolean;
  /** Server-side failure to show under the fields — e.g. the 409 from
   *  PATCH /api/user/profile when the address is on another account. Without
   *  this the request failed silently and the button span forever. */
  error?: string | null;
  onSubmit: (payload: SocialDetailsPayload) => void | Promise<void>;
  onBack?: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const phoneValid = NG_PHONE_RE.test(phone.trim());
  const emailValid = !needsEmail || EMAIL_RE.test(email.trim());
  const canContinue = phoneValid && emailValid && agreed && !submitting;

  const contactWho =
    role === UserType.AGENT
      ? "owners and renters"
      : role === UserType.RENTER
        ? "agents and owners"
        : "agents and renters";

  const helperCopy = needsEmail
    ? `Facebook didn't share an email address with us, so add one below along with your phone number — that's where your receipts and updates go.`
    : `Add your phone number so ${contactWho} can reach you, then confirm you agree to our terms.`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canContinue) return;
    setSubmitting(true);
    try {
      await onSubmit({
        phone: phone.trim(),
        ...(needsEmail ? { email: email.trim().toLowerCase() } : {}),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldWrap = (invalid: boolean) =>
    `flex w-full items-center gap-2.5 rounded-full border bg-surface px-4 py-3 transition-colors duration-200 ease-nc ${
      invalid ? "border-danger" : "border-border-strong focus-within:border-ink"
    }`;

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-[440px] flex-col items-center rounded-card border border-border-hair bg-surface p-[clamp(24px,3vw,32px)] text-center shadow-card max-sm:p-5"
    >
      <h2 className="m-0 text-[clamp(21px,2.4vw,26px)] font-bold leading-[1.15] tracking-[-0.03em] text-text-primary">
        {name ? `Almost there, ${name.split(" ")[0]}` : "Almost there"}
      </h2>
      <p className="mt-2.5 max-w-[38ch] text-[14px] leading-[1.5] text-text-secondary">{helperCopy}</p>

      {/* Email — only for providers that gave us none (Facebook). */}
      {needsEmail && (
        <label className="mt-6 flex w-full flex-col items-start gap-1.5 text-left">
          <span className="text-[12.5px] font-semibold text-text-secondary">Email address</span>
          <div className={fieldWrap(touched && !emailValid)}>
            <Mail size={17} strokeWidth={1.9} className="flex-none text-text-tertiary" />
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              className="w-full border-0 bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-tertiary"
            />
          </div>
          {touched && !emailValid && (
            <span className="text-[12px] font-medium text-danger">Enter a valid email address.</span>
          )}
        </label>
      )}

      <label className={`${needsEmail ? "mt-4" : "mt-6"} flex w-full flex-col items-start gap-1.5 text-left`}>
        <span className="text-[12.5px] font-semibold text-text-secondary">Phone number</span>
        <div className={fieldWrap(touched && !phoneValid)}>
          <Phone size={17} strokeWidth={1.9} className="flex-none text-text-tertiary" />
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0803 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => setTouched(true)}
            className="w-full border-0 bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </div>
        {touched && !phoneValid && (
          <span className="text-[12px] font-medium text-danger">Enter a valid Nigerian phone number.</span>
        )}
      </label>

      <label className="mt-4 flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-border-hair bg-surface-sunken/40 p-3.5 text-left transition-colors duration-200 ease-nc hover:border-border-strong">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-[18px] w-[18px] flex-none accent-[color:var(--ink)]"
        />
        <span className="text-[13px] leading-[1.5] text-text-secondary">
          I agree to NewCondo&apos;s{" "}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2 hover:text-green-dark">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2 hover:text-green-dark">
            Privacy Policy
          </a>
          .
        </span>
      </label>

      {error && (
        <p className="mt-4 w-full rounded-2xl border border-danger/30 bg-danger/[0.06] px-4 py-3 text-left text-[13px] font-medium leading-[1.5] text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 flex w-full items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border-strong bg-surface px-5 py-3 text-[14.5px] font-semibold text-ink transition-colors duration-200 ease-nc hover:cursor-pointer hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={!canContinue}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-[14.5px] font-semibold text-cream transition-[transform,background,box-shadow] duration-200 ease-nc hover:cursor-pointer hover:bg-black hover:shadow-card active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-ink disabled:hover:shadow-none"
        >
          {submitting ? (
            <>
              <Loader2 size={16} strokeWidth={2} className="animate-spin" />
              Continuing…
            </>
          ) : (
            <>
              Continue
              <ArrowRight size={16} strokeWidth={2} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
