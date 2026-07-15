"use client";

/* ============================================================
   SocialAccountDetails — cohesive phone + terms step (Google/FB signups)

   Replaces two separate screens (terms, then phone) with ONE card so
   the tail end of a social sign-up doesn't feel like extra friction:
   a short intro, the phone field, then the terms checkbox sitting
   directly above the single Continue button that gates on both.
   ============================================================ */

import { useState } from "react";
import { ArrowRight, ArrowLeft, Phone, Loader2 } from "lucide-react";
import { UserType } from "@/types/api";

const NG_PHONE_RE = /^(\+234|0)[789]\d{9}$/;

export default function SocialAccountDetails({
  name,
  role,
  onSubmit,
  onBack,
}: {
  name?: string | null;
  /** Drives the phone-field helper copy so it matches what they chose in step 1. */
  role?: UserType;
  onSubmit: (phone: string) => void | Promise<void>;
  onBack?: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const phoneValid = NG_PHONE_RE.test(phone.trim());
  const canContinue = phoneValid && agreed && !submitting;

  const helperCopy =
    role === UserType.AGENT
      ? "Add your phone number so owners and renters can reach you, then confirm you agree to our terms."
      : role === UserType.RENTER
        ? "Add your phone number so agents and owners can reach you, then confirm you agree to our terms."
        : "Add your phone number so agents and renters can reach you, then confirm you agree to our terms.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!phoneValid || !agreed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(phone.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-[440px] flex-col items-center rounded-card border border-border-hair bg-surface p-[clamp(24px,3vw,32px)] text-center shadow-card"
    >
      <h2 className="m-0 text-[clamp(21px,2.4vw,26px)] font-bold tracking-[-0.03em] leading-[1.15] text-text-primary">
        {name ? `Almost there, ${name.split(" ")[0]}` : "Almost there"}
      </h2>
      <p className="mt-2.5 max-w-[36ch] text-[14px] leading-[1.5] text-text-secondary">{helperCopy}</p>

      <label className="mt-6 flex w-full flex-col items-start gap-1.5 text-left">
        <span className="text-[12.5px] font-semibold text-text-secondary">Phone number</span>
        <div
          className={`flex w-full items-center gap-2.5 rounded-full border bg-surface px-4 py-3 transition-colors duration-200 ease-nc ${
            touched && !phoneValid ? "border-danger" : "border-border-strong focus-within:border-ink"
          }`}
        >
          <Phone size={17} strokeWidth={1.9} className="flex-none text-text-tertiary" />
          <input
            type="tel"
            inputMode="tel"
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
