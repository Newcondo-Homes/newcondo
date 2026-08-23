"use client";

/* ============================================================
   OTPVerificationPanel

   6-box entry (auto-advance / backspace / paste), auto-submit on
   completion, resend cooldown, code-expiry countdown, the three `type`
   variants — with no page chrome, so it embeds in both the dedicated
   /verify-otp page (via the OTPVerification wrapper, which passes
   `autoRoute`) and the onboarding flow (which advances via `onVerified`).

   >>> TWO TIMERS, NOT ONE <<<
   The previous version tracked a single 60-second countdown and labelled it
   "Code expires in" / "Code has expired". But the OTP is valid for TEN
   minutes (OTP.expiryMinutes) — 60 seconds is the RESEND COOLDOWN. So the
   panel told every user their code had expired one minute in, while the code
   in their inbox still worked perfectly. Two independent things:

     resendIn   60s   — gates the Resend button
     expiresIn  10m   — gates the EXPIRED STATE below

   Conflating them would have made the expired state fire for everyone.

   >>> EXPIRED STATE <<<
   When the code has genuinely expired we replace the input and countdown
   entirely rather than adding a warning above them. A dead six-box input
   invites people to type into something that cannot work. They get one clear
   prompt and one primary button.

   No auto-send on mount, deliberately. The panel remounts for reasons the
   user didn't intend (refresh, tab restore, dev remount) and each remount
   would fire a send — then the 60s cooldown returns 429 for an action they
   never took, which reads as broken. An explicit tap makes a 429 sensible
   ("wait 45s" on the thing you just pressed) and spends no email on someone
   who merely opened the tab.
   ============================================================ */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, RefreshCw, TimerOff, PencilLine, ArrowRight, X } from "lucide-react";
import { cx } from "@/lib/cx";
import { errMsg } from "@/lib/errMsg";
import { useAuth } from "@/hooks/useAuth";

/** Mirrors OTP.expiryMinutes in backend-shared. Kept in sync there. */
const CODE_TTL_SEC = 10 * 60;
const RESEND_COOLDOWN_SEC = 60;

interface OTPVerificationPanelProps {
  email: string;
  type: "EMAIL_VERIFICATION" | "LOGIN" | "PASSWORD_RESET";
  onVerified?: () => void;
  onBack?: () => void;
  backLabel?: string;
  autoRoute?: boolean;
  /**
   * Request a fresh code on mount. Left OFF by the onboarding flow: register
   * already issues the first code, so sending again would mint a second one
   * and invalidate the one already in the user's inbox.
   */
  sendOnMount?: boolean;
  /** Lock Back until the code expires, so users can't bounce out spamming codes. */
  disableBackUntilExpired?: boolean;
  /**
   * Enables the "Wrong email address?" affordance. Receives the corrected
   * address; the host persists it, resets verification and re-issues the code.
   * Without this prop a typo is a dead end — Back only edits the role once the
   * account exists, so there is no other way to fix the address.
   */
  onChangeEmail?: (email: string) => Promise<{ ok: boolean; error?: string }>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function OTPVerificationPanel({
  email,
  type,
  onVerified,
  onBack,
  backLabel = "Back",
  autoRoute = false,
  sendOnMount = false,
  disableBackUntilExpired = false,
  onChangeEmail,
}: OTPVerificationPanelProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");

  // Editing the address in place, from the expired state or the footer.
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState(email);
  const [savingEmail, setSavingEmail] = useState(false);

  const router = useRouter();
  const { verifyOTP, resendOTP } = useAuth();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const expiryKey = `otp_expiry_${email}_${type}`;
  const resendKey = `otp_resend_${email}_${type}`;

  /* Both clocks are absolute timestamps in localStorage, so backgrounding the
     tab (or Chrome discarding it on mobile) can't freeze them — on return we
     recompute from wall time rather than resuming a paused interval. */
  const readRemaining = (key: string, fallbackSec: number) => {
    if (typeof window === "undefined") return fallbackSec;
    const stored = localStorage.getItem(key);
    if (!stored) return fallbackSec;
    return Math.max(0, Math.ceil((parseInt(stored, 10) - Date.now()) / 1000));
  };

  const [expiresIn, setExpiresIn] = useState(() => readRemaining(expiryKey, CODE_TTL_SEC));
  const [resendIn, setResendIn] = useState(() => readRemaining(resendKey, 0));

  const expired = expiresIn <= 0;
  const canResend = resendIn <= 0;

  // Seed the expiry clock on first mount so a returning user sees real time
  // remaining rather than a fresh 10 minutes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(expiryKey) && expiresIn > 0) {
      localStorage.setItem(expiryKey, String(Date.now() + expiresIn * 1000));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One interval drives both clocks.
  useEffect(() => {
    if (expiresIn <= 0 && resendIn <= 0) return;
    const t = setInterval(() => {
      setExpiresIn(readRemaining(expiryKey, 0));
      setResendIn(readRemaining(resendKey, 0));
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresIn > 0, resendIn > 0, expiryKey, resendKey]);

  const startClocks = () => {
    localStorage.setItem(expiryKey, String(Date.now() + CODE_TTL_SEC * 1000));
    localStorage.setItem(resendKey, String(Date.now() + RESEND_COOLDOWN_SEC * 1000));
    setExpiresIn(CODE_TTL_SEC);
    setResendIn(RESEND_COOLDOWN_SEC);
  };

  const didSendRef = useRef(false);
  useEffect(() => {
    if (!sendOnMount || didSendRef.current) return;
    didSendRef.current = true;
    (async () => {
      try {
        const result = await resendOTP({ identifier: email, type });
        startClocks();
        if (result && !result.success && result.error) setError(result.error);
      } catch (e) {
        console.error(e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendOnMount, email, type]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== "") && value) handleVerifyOTP(newOtp.join(""));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    if (pasted.length === 6) handleVerifyOTP(pasted);
  };

  const handleVerifyOTP = async (otpCode: string) => {
    if (otpCode.length !== 6) { setError("Please enter all 6 digits"); return; }
    setIsVerifying(true);
    setError("");
    try {
      const result = await verifyOTP({ identifier: email, code: otpCode, type });
      if (result.success) {
        localStorage.removeItem(expiryKey);
        localStorage.removeItem(resendKey);
        if (autoRoute) {
          if (type === "EMAIL_VERIFICATION") router.push("/dashboard");
          else if (type === "PASSWORD_RESET") router.push("/reset-password");
        }
        onVerified?.();
      } else {
        setError(result.error || "Invalid verification code");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (e) {
      setError(errMsg(e, "Verification failed. Please try again."));
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    setIsResending(true);
    setError("");
    try {
      const result = await resendOTP({ identifier: email, type });
      if (result.success) {
        startClocks();
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.error || "Failed to resend code");
      }
    } catch (e) {
      setError(errMsg(e, "Failed to resend code. Please try again."));
    } finally {
      setIsResending(false);
    }
  };

  const submitEmailChange = async () => {
    const next = newEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(next)) { setError("Enter a valid email address"); return; }
    if (next === email.toLowerCase()) { setEditing(false); return; }
    if (!onChangeEmail) return;
    setSavingEmail(true);
    setError("");
    try {
      const res = await onChangeEmail(next);
      if (!res.ok) { setError(res.error ?? "Couldn't update your email."); return; }
      // The host re-issues the code against the new address, so both clocks
      // restart — and they restart under the NEW localStorage keys, since those
      // are derived from the email. The old keys are dropped here.
      localStorage.removeItem(expiryKey);
      localStorage.removeItem(resendKey);
      setEditing(false);
      setOtp(["", "", "", "", "", ""]);
    } catch (e) {
      setError(errMsg(e, "Couldn't update your email."));
    } finally {
      setSavingEmail(false);
    }
  };

  const title =
    type === "LOGIN" ? "Enter verification code"
    : type === "PASSWORD_RESET" ? "Reset your password"
    : "Verify your email";

  const description =
    type === "LOGIN" ? "Please enter the 6-digit code sent to your email."
    : type === "PASSWORD_RESET" ? "Enter the 6-digit code to reset your password."
    : "We sent a 6-digit verification code to your email address.";

  /* ---------- inline email editor (shared by both states) ---------- */
  const emailEditor = (
    <div className="mt-5 rounded-[16px] border border-nc-border bg-surface-sunken/60 p-4">
      <label htmlFor="otp-new-email" className="mb-1.5 block text-[13px] font-semibold text-text-primary">
        Your email address
      </label>
      <input
        id="otp-new-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-[14px] border border-nc-border bg-surface px-4 py-3 text-[16px] text-text-primary outline-none transition-[border-color,box-shadow] duration-200 ease-nc placeholder:text-text-tertiary focus:border-ink focus:shadow-[0_0_0_4px_rgba(19,19,19,0.06)]"
      />
      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={submitEmailChange}
          disabled={savingEmail}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[14.5px] font-semibold leading-none text-cream transition-[transform,background] duration-200 ease-nc hover:cursor-pointer hover:bg-black active:scale-[0.97] disabled:cursor-default disabled:opacity-70"
        >
          {savingEmail
            ? <><Loader2 size={16} strokeWidth={2} className="animate-spin" />Updating…</>
            : <>Save &amp; send code<ArrowRight size={16} strokeWidth={2} /></>}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setNewEmail(email); setError(""); }}
          className="inline-flex flex-none items-center justify-center gap-1.5 rounded-full border border-border-strong bg-surface px-4 py-3 text-[14px] font-semibold text-ink transition-colors duration-200 ease-nc hover:cursor-pointer hover:bg-surface-sunken"
        >
          <X size={15} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full rounded-card border border-border-hair bg-surface p-[clamp(24px,3vw,36px)] shadow-card">
      {/* ============ EXPIRED ============
          The input and countdown are gone on purpose — one prompt, one button. */}
      {expired && !editing ? (
        <>
          <div className="text-center">
            <span className="mx-auto mb-4 grid h-[54px] w-[54px] place-items-center rounded-full bg-warn-wash text-warn-line">
              <TimerOff size={25} strokeWidth={1.85} />
            </span>
            <h1 className="m-0 text-[clamp(23px,2.7vw,29px)] font-bold leading-[1.05] tracking-[-0.04em] text-text-primary">
              Your code has expired
            </h1>
            <p className="mx-auto mt-2 max-w-[42ch] text-[14.5px] leading-[1.5] text-text-secondary">
              Codes are only valid for {CODE_TTL_SEC / 60} minutes. Send a new one to continue setting up
              your account — nothing else you&apos;ve entered has been lost.
            </p>
            <p className="mt-2.5 text-[14px] font-semibold text-text-primary">{email}</p>
          </div>

          {error && (
            <div className="mt-5 rounded-[14px] border border-danger/20 bg-danger/[0.07] px-4 py-3 text-center text-[13.5px] font-medium leading-[1.45] text-danger">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={!canResend || isResending}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[16px] font-semibold leading-none text-cream transition-[transform,background,box-shadow] duration-200 ease-nc hover:cursor-pointer hover:bg-black hover:shadow-card active:scale-[0.97] disabled:cursor-default disabled:opacity-60"
            >
              {isResending
                ? <><Loader2 size={18} strokeWidth={2} className="animate-spin" />Sending…</>
                : <><RefreshCw size={17} strokeWidth={2} />{canResend ? "Send a new code" : `Send a new code in ${formatTime(resendIn)}`}</>}
            </button>

            {/* The expired state is exactly when someone realises the code never
                arrived because the address was wrong — so the fix lives here. */}
            {onChangeEmail && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex w-full items-center justify-center gap-2 text-[14px] font-semibold text-text-secondary transition-colors duration-200 ease-nc hover:cursor-pointer hover:text-ink"
              >
                <PencilLine size={15} strokeWidth={2} />
                Wrong email address? Change it
              </button>
            )}

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex w-full items-center justify-center rounded-full border border-border-strong bg-surface px-7 py-[14px] text-[15px] font-semibold text-ink transition-colors duration-200 ease-nc hover:cursor-pointer hover:bg-surface-sunken"
              >
                {backLabel}
              </button>
            )}
          </div>
        </>
      ) : (
        /* ============ ACTIVE ============ */
        <>
          <div className="text-center">
            <span className="mx-auto mb-4 grid h-[54px] w-[54px] place-items-center rounded-full bg-surface-sunken text-ink">
              <Mail size={25} strokeWidth={1.85} />
            </span>
            <h1 className="m-0 text-[clamp(23px,2.7vw,29px)] font-bold leading-[1.05] tracking-[-0.04em] text-text-primary">
              {title}
            </h1>
            <p className="mx-auto mt-2 max-w-[40ch] text-[14.5px] leading-[1.5] text-text-secondary">
              {description}
              <br />
              <span className="font-semibold text-text-primary">{email}</span>
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-[14px] border border-danger/20 bg-danger/[0.07] px-4 py-3 text-center text-[13.5px] font-medium leading-[1.45] text-danger">
              {error}
            </div>
          )}

          {editing ? emailEditor : (
            <>
              <div className="mt-6">
                <div className="flex justify-center gap-2.5 max-[420px]:gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      disabled={isVerifying}
                      className={cx(
                        "h-[58px] w-[48px] rounded-[14px] border bg-surface text-center text-[22px] font-semibold text-text-primary outline-none transition-[border-color,box-shadow] duration-200 ease-nc focus:border-ink focus:shadow-[0_0_0_4px_rgba(19,19,19,0.06)] disabled:opacity-60 max-[420px]:h-[52px] max-[420px]:w-[42px] max-[420px]:text-[19px]",
                        digit ? "border-ink" : "border-nc-border"
                      )}
                    />
                  ))}
                </div>

                <div className="mt-3.5 text-center text-[13px]">
                  <p className="m-0 text-text-tertiary">
                    Code expires in{" "}
                    <span className="font-mono font-medium text-text-secondary">{formatTime(expiresIn)}</span>
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => handleVerifyOTP(otp.join(""))}
                  disabled={otp.some((d) => !d) || isVerifying}
                  className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[16px] font-semibold leading-none text-cream transition-[transform,background,box-shadow] duration-200 ease-nc hover:cursor-pointer hover:bg-black hover:shadow-card active:scale-[0.97] disabled:cursor-default disabled:opacity-60"
                >
                  {isVerifying && <Loader2 size={18} strokeWidth={2} className="animate-spin" />}
                  Verify code
                </button>

                <div className="text-center">
                  <p className="m-0 mb-1.5 text-[13.5px] text-text-secondary">Didn&apos;t receive the code?</p>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={!canResend || isResending}
                    className="inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-green-dark transition-colors duration-200 ease-nc hover:cursor-pointer hover:text-green disabled:cursor-default disabled:text-text-tertiary disabled:hover:text-text-tertiary"
                  >
                    {isResending
                      ? <Loader2 size={15} strokeWidth={2} className="animate-spin" />
                      : <RefreshCw size={15} strokeWidth={2} />}
                    {canResend ? "Resend code" : `Resend in ${formatTime(resendIn)}`}
                  </button>
                </div>

                {onChangeEmail && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex w-full items-center justify-center gap-2 text-[13.5px] font-semibold text-text-tertiary transition-colors duration-200 ease-nc hover:cursor-pointer hover:text-ink"
                  >
                    <PencilLine size={14} strokeWidth={2} />
                    Wrong email address? Change it
                  </button>
                )}

                {onBack && (
                  <div>
                    <button
                      type="button"
                      onClick={onBack}
                      disabled={isVerifying || (disableBackUntilExpired && !expired)}
                      className="inline-flex w-full items-center justify-center rounded-full border border-border-strong bg-surface px-7 py-[14px] text-[15px] font-semibold text-ink transition-colors duration-200 ease-nc hover:cursor-pointer hover:bg-surface-sunken disabled:cursor-default disabled:opacity-60 disabled:hover:bg-surface"
                    >
                      {backLabel}
                    </button>
                    {disableBackUntilExpired && !expired && (
                      <p className="m-0 mt-2 text-center text-[12.5px] text-text-tertiary">
                        {onChangeEmail
                          ? "Need a different email? Use “Change it” above."
                          : "You can edit your details once the code expires."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
