"use client";

/* ============================================================
   OTPVerificationPanel

   The reusable core of OTP verification — all the behaviour from the
   original OTPVerification (6-box entry with auto-advance / backspace /
   paste, auto-submit on completion, localStorage-persistent expiry
   countdown, resend cooldown, the three `type` variants) WITHOUT the
   page chrome (<main>, brand lockup, FitToViewport).

   Because it carries no chrome, it can be embedded anywhere:
     • the dedicated /verify-otp page (via the OTPVerification wrapper,
       which passes `autoRoute` to keep the old routing behaviour), and
     • the onboarding flow, as an inline step that advances via
       `onVerified` instead of navigating away.

   NOTE: this panel assumes a code has already been sent (registration
   triggers the first EMAIL_VERIFICATION email; the dedicated page is
   reached the same way). Users can request another with Resend.
   ============================================================ */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { cx } from "@/lib/cx";
import { useAuth } from "@/hooks/useAuth";

interface OTPVerificationPanelProps {
  email: string;
  type: "EMAIL_VERIFICATION" | "LOGIN" | "PASSWORD_RESET";
  /** Called after a code is successfully verified (e.g. advance the onboarding flow). */
  onVerified?: () => void;
  /** Optional back button (e.g. return to the details form). Hidden when omitted. */
  onBack?: () => void;
  /** Label for the back button. Defaults to "Back". */
  backLabel?: string;
  /**
   * When true, the panel performs the legacy full-page routing on success
   * (EMAIL_VERIFICATION → /dashboard, PASSWORD_RESET → /reset-password).
   * The dedicated /verify-otp page sets this; the onboarding flow leaves it
   * false and drives navigation through `onVerified`.
   */
  autoRoute?: boolean;
  /**
   * Request a fresh code as soon as the panel mounts. Used by the onboarding
   * flow, where registration is deferred so nothing has sent a code yet.
   * The dedicated /verify-otp page leaves this off (its code was already sent).
   */
  sendOnMount?: boolean;
  /**
   * Keep the Back button locked until the current code expires, so the user
   * can't bounce in and out spamming fresh codes. On expiry it unlocks and a
   * new code is generated when they return.
   */
  disableBackUntilExpired?: boolean;
}

export function OTPVerificationPanel({
  email,
  type,
  onVerified,
  onBack,
  backLabel = "Back",
  autoRoute = false,
  sendOnMount = false,
  disableBackUntilExpired = false,
}: OTPVerificationPanelProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");

  const [timeLeft, setTimeLeft] = useState(() => {
    if (typeof window !== "undefined") {
      const storageKey = `otp_expiry_${email}_${type}`;
      const storedTarget = localStorage.getItem(storageKey);

      if (storedTarget) {
        const remaining = Math.ceil((parseInt(storedTarget, 10) - Date.now()) / 1000);

        if (remaining > 0) {
          return remaining;
        } else {
          // Clear out old, stale, negative historical keys right away!
          localStorage.removeItem(storageKey);
        }
      }
    }
    return 60; // Fresh registration defaults to a clean 60-second timer window!
  });

  const [canResend, setCanResend] = useState(timeLeft <= 0);

  const router = useRouter();
  const { verifyOTP, resendOTP, sendOTP } = useAuth();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Persistent Countdown Effect
  useEffect(() => {
    // If there isn't a target time in localStorage yet (e.g., first mount), set one.
    const storageKey = `otp_expiry_${email}_${type}`;
    if (!localStorage.getItem(storageKey) && timeLeft > 0) {
      const targetTime = Date.now() + timeLeft * 1000;
      localStorage.setItem(storageKey, targetTime.toString());
    }

    if (timeLeft <= 0) {
      setCanResend(true);
      localStorage.removeItem(storageKey); // Clean up storage when done
      return;
    }

    setCanResend(false);

    // Using precise interval sync based on system clock
    const timer = setInterval(() => {
      const storedTarget = localStorage.getItem(storageKey);
      if (storedTarget) {
        const remaining = Math.ceil((parseInt(storedTarget, 10) - Date.now()) / 1000);
        if (remaining <= 0) {
          setTimeLeft(0);
          setCanResend(true);
          localStorage.removeItem(storageKey);
          clearInterval(timer);
        } else {
          setTimeLeft(remaining);
        }
      } else {
        // Fallback if localStorage disappeared unexpectedly
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, email, type]);

  // Deferred-flow entry: request the first code on mount and start a clean 60s
  // timer (any stale key from a prior visit is overwritten).
  const didSendRef = useRef(false);
  useEffect(() => {
    if (!sendOnMount || didSendRef.current) return;
    didSendRef.current = true;
    (async () => {
      try {
        const result = await sendOTP({ identifier: email, type });
        const target = Date.now() + 60 * 1000;
        localStorage.setItem(`otp_expiry_${email}_${type}`, target.toString());
        setTimeLeft(60);
        setCanResend(false);
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

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== "") && value) {
      handleVerifyOTP(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    if (pastedData.length === 6) {
      handleVerifyOTP(pastedData);
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const result = await verifyOTP({
        identifier: email,
        code: otpCode,
        type,
      });

      if (result.success) {
        // Cleanup storage on successful verification
        localStorage.removeItem(`otp_expiry_${email}_${type}`);

        // Legacy full-page routing — only when this panel owns the whole page.
        if (autoRoute) {
          if (type === "EMAIL_VERIFICATION") {
            router.push("/dashboard");
          } else if (type === "PASSWORD_RESET") {
            router.push("/reset-password");
          }
        }

        // Let the host advance (onboarding flow → plan step, etc.).
        onVerified?.();
      } else {
        setError(result.error || "Invalid verification code");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error(error);
      setError("Verification failed. Please try again.");
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
      const result = await resendOTP({
        identifier: email,
        type,
      });

      if (result.success) {
        // Establish a brand-new 60-second target timestamp in localStorage on resend
        const newTargetTime = Date.now() + 60 * 1000;
        localStorage.setItem(`otp_expiry_${email}_${type}`, newTargetTime.toString());

        setTimeLeft(60);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.error || "Failed to resend code");
      }
    } catch (error) {
      console.error(error);
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "EMAIL_VERIFICATION":
        return "Verify your email";
      case "LOGIN":
        return "Enter verification code";
      case "PASSWORD_RESET":
        return "Reset your password";
      default:
        return "Verify your email";
    }
  };

  const getDescription = () => {
    switch (type) {
      case "EMAIL_VERIFICATION":
        return "We sent a 6-digit verification code to your email address.";
      case "LOGIN":
        return "Please enter the 6-digit code sent to your email.";
      case "PASSWORD_RESET":
        return "Enter the 6-digit code to reset your password.";
      default:
        return "We sent a 6-digit verification code to your email address.";
    }
  };

  return (
    <div className="w-full rounded-card border border-border-hair bg-surface p-[clamp(24px,3vw,36px)] shadow-card">
      {/* header */}
      <div className="text-center">
        <span className="mx-auto mb-4 grid h-[54px] w-[54px] place-items-center rounded-full bg-surface-sunken text-ink">
          <Mail size={25} strokeWidth={1.85} />
        </span>
        <h1 className="m-0 text-[clamp(23px,2.7vw,29px)] font-bold leading-[1.05] tracking-[-0.04em] text-text-primary">
          {getTitle()}
        </h1>
        <p className="mx-auto mt-2 max-w-[40ch] text-[14.5px] leading-[1.5] text-text-secondary">
          {getDescription()}
          <br />
          <span className="font-semibold text-text-primary">{email}</span>
        </p>
      </div>

      {/* error */}
      {error && (
        <div className="mt-5 rounded-[14px] border border-danger/20 bg-danger/[0.07] px-4 py-3 text-center text-[13.5px] font-medium leading-[1.45] text-danger">
          {error}
        </div>
      )}

      {/* code inputs */}
      <div className="mt-6">
        <div className="flex justify-center gap-2.5 max-[420px]:gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
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

        {/* expiry */}
        <div className="mt-3.5 text-center text-[13px]">
          {timeLeft > 0 ? (
            <p className="m-0 text-text-tertiary">
              Code expires in <span className="font-mono font-medium text-text-secondary">{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <p className="m-0 font-medium text-danger">Code has expired</p>
          )}
        </div>
      </div>

      {/* actions */}
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => handleVerifyOTP(otp.join(""))}
          disabled={otp.some((digit) => !digit) || isVerifying}
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[16px] font-semibold leading-none text-cream transition-[transform,background,box-shadow] duration-200 ease-nc hover:bg-black hover:shadow-card active:scale-[0.97] disabled:cursor-default disabled:opacity-60"
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
            className="inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-green-dark transition-colors duration-200 ease-nc hover:text-green disabled:cursor-default disabled:text-text-tertiary disabled:hover:text-text-tertiary"
          >
            {isResending ? (
              <Loader2 size={15} strokeWidth={2} className="animate-spin" />
            ) : (
              <RefreshCw size={15} strokeWidth={2} />
            )}
            {canResend ? "Resend code" : `Resend in ${formatTime(timeLeft)}`}
          </button>
        </div>

        {onBack && (
          <div>
            <button
              type="button"
              onClick={onBack}
              disabled={isVerifying || (disableBackUntilExpired && !canResend)}
              className="inline-flex w-full items-center justify-center rounded-full border border-border-strong bg-surface px-7 py-[14px] text-[15px] font-semibold text-ink transition-colors duration-200 ease-nc hover:bg-surface-sunken disabled:opacity-60 disabled:hover:bg-surface"
            >
              {backLabel}
            </button>
            {disableBackUntilExpired && !canResend && (
              <p className="m-0 mt-2 text-center text-[12.5px] text-text-tertiary">
                You can edit your details once the code expires.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
