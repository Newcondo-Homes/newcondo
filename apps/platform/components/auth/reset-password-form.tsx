"use client";

/* ============================================================
   ResetPasswordForm

   Your original reset-password flow, restyled to the NewCondo
   system and locked to the viewport (FitToViewport) so neither step
   scrolls on desktop or mobile. Functionality is unchanged:
   request → reset steps, token/email from the URL, the resend
   countdown, the same validation, the useAuth calls, and the redirect.
   ============================================================ */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cx } from "@/lib/cx";
import { useAuth } from "@/hooks/useAuth";
import FitToViewport from "./fit-to-viewport";

const LOGO_DARK = "/assets/logo-mark-dark.png";

const INPUT_BASE =
  "w-full rounded-[16px] border bg-surface px-4 py-[13px] text-[16px] text-text-primary outline-none transition-[border-color,box-shadow] duration-200 ease-nc placeholder:text-text-tertiary focus:shadow-[0_0_0_4px_rgba(19,19,19,0.06)]";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13.5px] font-semibold tracking-[-0.01em] text-text-primary">
      {children}
    </label>
  );
}

function ErrorAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-[14px] border border-danger/20 bg-danger/[0.07] px-4 py-3 text-[13.5px] leading-[1.45] text-danger">
      <AlertCircle size={17} strokeWidth={2} className="mt-px flex-none" />
      <span>{children}</span>
    </div>
  );
}

function SuccessAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-[14px] border border-green-dark/15 bg-green-wash px-4 py-3 text-[13.5px] leading-[1.45] text-green-dark">
      <CheckCircle size={17} strokeWidth={2} className="mt-px flex-none" />
      <span>{children}</span>
    </div>
  );
}

export default function ResetPasswordForm() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { requestPasswordReset, resetPassword } = useAuth();

  // Check if token is in URL (direct reset link)
  useEffect(() => {
    const token = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (token && emailParam) {
      setStep("reset");
      setEmail(emailParam);
    }
  }, [searchParams]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setSuccess("Password reset instructions have been sent to your email.");
      setStep("reset");
      setTimeLeft(60); // 1 minute cooldown
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send password reset email";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!otp || otp.length < 6) {
      setError("Please enter the 6-digit code from your email");
      return;
    }

    setIsLoading(true);

    try {
      const token = searchParams.get("token");
      if (token) {
        await resetPassword(token, password, confirmPassword);
      } else return;

      setSuccess("Password reset successfully! Redirecting to login...");

      setTimeout(() => {
        router.push("/login?message=Password reset successfully");
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to reset password";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (timeLeft > 0) return;

    setError("");
    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setSuccess("New reset code sent to your email");
      setTimeLeft(60);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to resend code";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const backToLogin = (
    <div className="text-center">
      <Link
        href="/login"
        className="text-[14px] font-semibold text-ink underline decoration-border-strong underline-offset-[3px] transition-colors duration-200 ease-nc hover:decoration-ink"
      >
        Back to login
      </Link>
    </div>
  );

  return (
    <main
      data-screen-label="Reset password"
      className="flex h-dvh flex-col overflow-hidden bg-background px-[clamp(20px,5vw,48px)] py-[clamp(16px,3vh,32px)]"
    >
      <div className="flex min-h-0 w-full flex-1">
        <FitToViewport className="mx-auto w-full max-w-[460px]">
          <div className="flex flex-col items-center">
            <Link
              href="/"
              className="mb-[clamp(16px,3vh,28px)] flex items-center gap-[11px] text-[22px] font-bold tracking-[-0.04em] text-ink no-underline"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_DARK} alt="Newcondo" className="h-auto w-[30px]" />
              <span>newcondo</span>
            </Link>

            <div className="w-full rounded-card border border-border-hair bg-surface p-[clamp(24px,3vw,36px)] shadow-card">
              {step === "request" ? (
                <>
                  <div className="text-center">
                    <h1 className="m-0 text-[clamp(24px,2.8vw,30px)] font-bold leading-[1.05] tracking-[-0.04em] text-text-primary">
                      Reset your password
                    </h1>
                    <p className="mx-auto mt-2 max-w-[42ch] text-[14.5px] leading-[1.5] text-text-secondary">
                      Enter your email address and we&apos;ll send instructions to reset your password.
                    </p>
                  </div>

                  <form onSubmit={handleRequestReset} className="mt-6 flex flex-col gap-3.5">
                    {error && <ErrorAlert>{error}</ErrorAlert>}
                    {success && <SuccessAlert>{success}</SuccessAlert>}

                    <div>
                      <FieldLabel htmlFor="email">Email address</FieldLabel>
                      <div className="relative">
                        <Mail size={19} strokeWidth={1.85} className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          disabled={isLoading}
                          className={cx(INPUT_BASE, "pl-[44px] border-nc-border focus:border-ink")}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !email}
                      className="mt-1 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[16px] font-semibold leading-none text-cream transition-[transform,background,box-shadow] duration-200 ease-nc hover:bg-black hover:shadow-card active:scale-[0.97] disabled:cursor-default disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={18} strokeWidth={2} className="animate-spin" />
                          Sending instructions…
                        </>
                      ) : (
                        "Send reset instructions"
                      )}
                    </button>

                    {backToLogin}
                  </form>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <h1 className="m-0 text-[clamp(24px,2.8vw,30px)] font-bold leading-[1.05] tracking-[-0.04em] text-text-primary">
                      Set a new password
                    </h1>
                    <p className="mx-auto mt-2 max-w-[42ch] text-[14.5px] leading-[1.5] text-text-secondary">
                      Enter the code sent to{" "}
                      <span className="font-semibold text-text-primary">{email || "your email"}</span> and your new password.
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="mt-6 flex flex-col gap-3.5">
                    {error && <ErrorAlert>{error}</ErrorAlert>}
                    {success && <SuccessAlert>{success}</SuccessAlert>}

                    <div>
                      <FieldLabel htmlFor="otp">Reset code</FieldLabel>
                      <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        required
                        disabled={isLoading}
                        className={cx(INPUT_BASE, "border-nc-border focus:border-ink text-center text-[18px] font-medium tracking-[0.3em] placeholder:tracking-normal placeholder:text-[16px]")}
                      />
                      <div className="mt-1.5 flex items-center justify-between text-[12.5px]">
                        <span className="text-text-tertiary">Code sent to your email</span>
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={timeLeft > 0 || isLoading}
                          className="font-semibold text-green-dark transition-colors duration-200 ease-nc hover:text-green disabled:text-text-tertiary disabled:hover:text-text-tertiary"
                        >
                          {timeLeft > 0 ? `Resend in ${timeLeft}s` : "Resend code"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <FieldLabel htmlFor="password">New password</FieldLabel>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter new password"
                          minLength={8}
                          required
                          disabled={isLoading}
                          className={cx(INPUT_BASE, "pr-12 border-nc-border focus:border-ink")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 grid h-[34px] w-[34px] -translate-y-1/2 place-items-center rounded-full text-text-tertiary transition-colors duration-200 ease-nc hover:bg-black/5 hover:text-ink"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff size={19} strokeWidth={1.85} /> : <Eye size={19} strokeWidth={1.85} />}
                        </button>
                      </div>
                      <p className="mt-1.5 text-[12px] text-text-tertiary">Must be at least 8 characters long.</p>
                    </div>

                    <div>
                      <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          minLength={8}
                          required
                          disabled={isLoading}
                          className={cx(INPUT_BASE, "pr-12 border-nc-border focus:border-ink")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-1/2 grid h-[34px] w-[34px] -translate-y-1/2 place-items-center rounded-full text-text-tertiary transition-colors duration-200 ease-nc hover:bg-black/5 hover:text-ink"
                          aria-label="Toggle password visibility"
                        >
                          {showConfirmPassword ? <EyeOff size={19} strokeWidth={1.85} /> : <Eye size={19} strokeWidth={1.85} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !otp || !password || !confirmPassword}
                      className="mt-1 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[16px] font-semibold leading-none text-cream transition-[transform,background,box-shadow] duration-200 ease-nc hover:bg-black hover:shadow-card active:scale-[0.97] disabled:cursor-default disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={18} strokeWidth={2} className="animate-spin" />
                          Resetting password…
                        </>
                      ) : (
                        "Reset password"
                      )}
                    </button>

                    {backToLogin}
                  </form>
                </>
              )}
            </div>
          </div>
        </FitToViewport>
      </div>
    </main>
  );
}
