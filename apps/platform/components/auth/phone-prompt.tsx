"use client";

/* ============================================================
   PhonePrompt

   Shown once, only for social (Google/Facebook) sign-ups that have no
   phone number on file — OAuth never provides one, but the platform
   needs it (agent contact, SMS updates, rent notifications). Slots
   into the flow between the authenticated-session resolve and the
   plan step, so it never blocks email/password users (they already
   collect phone in OnboardingForm).
   ============================================================ */

import { useState } from "react";
import { Phone, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { cx } from "@/lib/cx";
import { updateProfile } from "@/lib/api/profile";

const NG_PHONE_RE = /^(\+234|0)[789]\d{9}$/;

const INPUT_BASE =
  "w-full rounded-[16px] border bg-surface px-4 py-[13px] text-[16px] text-text-primary outline-none transition-[border-color,box-shadow] duration-200 ease-nc placeholder:text-text-tertiary focus:shadow-[0_0_0_4px_rgba(19,19,19,0.06)]";

export default function PhonePrompt({
  name,
  onSaved,
  onUpdateSession,
}: {
  /** First name (or full name) for a friendly greeting — cosmetic only. */
  name?: string;
  /** Called with the saved phone once the backend confirms it. */
  onSaved: (phone: string) => void;
  /**
   * Pass the NextAuth `update()` hook here so the session/JWT reflects the
   * new phone immediately (merged via the `trigger === "update"` branch of
   * your jwt callback) — without this, session.user.phone would stay stale
   * until the next full sign-in.
   */
  onUpdateSession?: (patch: Record<string, unknown>) => Promise<unknown>;
}) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const firstName = name?.trim().split(/\s+/)[0];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/\s/g, "");
    if (!NG_PHONE_RE.test(cleaned)) {
      setError("Please enter a valid Nigerian phone number");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const result = await updateProfile({ phone: cleaned });
      if (!result.success) {
        setError(result.error ?? "Couldn't save that number. Please try again.");
        return;
      }
      await onUpdateSession?.({ phone: cleaned });
      onSaved(cleaned);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[440px]">
      <div className="mb-5 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-wash text-green-dark">
          <Phone size={22} strokeWidth={1.9} />
        </span>
        <h1 className="m-0 mt-4 text-[clamp(23px,2.6vw,28px)] font-bold leading-[1.05] tracking-[-0.03em] text-text-primary">
          {firstName ? `One more thing, ${firstName}` : "One more thing"}
        </h1>
        <p className="mx-auto mt-2 max-w-[38ch] text-[14.5px] leading-[1.5] text-text-secondary">
          Google doesn&apos;t share a phone number with us — add yours so agents, tenants, and rent alerts can
          reach you.
        </p>
      </div>

      <div className="rounded-card border border-border-hair bg-surface p-[clamp(20px,2.4vw,26px)] shadow-card">
        <form onSubmit={submit} noValidate>
          <label htmlFor="onb-phone" className="mb-1.5 block text-[13.5px] font-semibold tracking-[-0.01em] text-text-primary">
            Phone number
          </label>
          <div className="relative">
            <Phone size={18} strokeWidth={1.85} className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              id="onb-phone"
              type="tel"
              autoFocus
              placeholder="+234 XXX XXX XXXX"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (error) setError(null);
              }}
              className={cx(INPUT_BASE, "pl-[44px]", error ? "border-danger" : "border-nc-border focus:border-ink")}
            />
          </div>
          {error && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-danger">
              <AlertCircle size={14} strokeWidth={2} className="flex-none" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="group mt-4 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[16px] font-semibold leading-none text-cream transition-[transform,background,box-shadow] duration-200 ease-nc hover:bg-black hover:shadow-card active:scale-[0.97] disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={18} strokeWidth={2} className="animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight size={18} strokeWidth={2} className="transition-transform duration-200 ease-nc group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
