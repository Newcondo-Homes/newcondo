"use client";

import { useState } from "react";
import { signIn } from "@newcondo/auth/client";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@newcondo/ui";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Check, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { cx } from "@/lib/cx";
import { EASE } from "@/components/motion";

/* ============================================================
   Real auth wiring (NextAuth via @newcondo/auth) fused into the
   NewCondo split-screen sign-in design.
   ============================================================ */
interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const initialFormData: LoginFormData = {
  email: "",
  password: "",
  rememberMe: true,
};

interface NextAuthSignInResult {
  error: string | null;
  status: number;
  ok: boolean;
  url: string | null;
}

const INPUT_BASE =
  "w-full rounded-2xl border bg-surface font-sans text-[16px] text-text-primary " +
  "py-[clamp(11px,1.6vh,14px)] pl-[46px] pr-4 placeholder:text-text-tertiary " +
  "outline-none transition-[border-color,box-shadow] duration-200 ease-nc " +
  "focus:border-ink focus:shadow-[0_0_0_4px_rgba(19,19,19,0.06)] " +
  "disabled:cursor-not-allowed disabled:opacity-60";

/** Google "G" mark. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" aria-hidden>
      <path fill="#4285F4" d="M23.06 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h6.2a5.3 5.3 0 0 1-2.3 3.48v2.88h3.72c2.18-2 3.44-4.96 3.44-8.37z" />
      <path fill="#34A853" d="M12 24c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.88c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.03-6.45-4.75H1.7v2.98A11.5 11.5 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.55 14.68a6.9 6.9 0 0 1 0-4.36V7.34H1.7a11.5 11.5 0 0 0 0 9.32l3.85-2.98z" />
      <path fill="#EA4335" d="M12 4.77c1.69 0 3.21.58 4.4 1.72l3.3-3.3A11.5 11.5 0 0 0 12 0 11.5 11.5 0 0 0 1.7 7.34l3.85 2.98C6.46 6.8 9 4.77 12 4.77z" />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<LoginFormData>(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [loginError, setLoginError] = useState("");

  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error as the user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (loginError) setLoginError("");
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setLoginError("");

    try {
      const result = (await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        loginType: "email",
        redirect: true,
        callbackUrl: callbackUrl || "/dashboard",
      })) as unknown as NextAuthSignInResult | undefined;

      if (result?.error) {
        switch (result.error) {
          case "CredentialsSignin":
            setLoginError("Invalid email or password. Please try again.");
            break;
          case "AccountNotVerified":
            setLoginError("Please verify your email before logging in.");
            router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
            break;
          case "AccountLocked":
            setLoginError("Account has been locked due to too many failed attempts. Please try again later.");
            break;
          default:
            setLoginError("Login failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
      setLoginError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    try {
      setIsLoading(true);
      await signIn(provider, { callbackUrl, redirect: true });
    } catch (error) {
      console.error("Social login error:", error);
      toast.error("Social login failed", {
        description: "Please try again or use email login.",
      });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (formData.email.trim()) {
      router.push(`/reset-password?email=${encodeURIComponent(formData.email)}`);
    } else {
      router.push("/reset-password");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        {/* redirected-from-protected-route notice */}
        <AnimatePresence>
          {searchParams?.get("callbackUrl") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="overflow-hidden"
            >
              <p className="m-0 mb-4 flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3 text-[13.5px] text-text-secondary">
                <AlertCircle size={16} strokeWidth={1.85} className="flex-none text-text-tertiary" />
                Please sign in to access that page.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* login error */}
        <AnimatePresence>
          {loginError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="overflow-hidden"
            >
              <p className="m-0 mb-4 flex items-start gap-2.5 rounded-2xl border border-[rgba(192,57,43,0.25)] bg-[rgba(192,57,43,0.07)] px-4 py-3 text-[13.5px] text-danger">
                <AlertCircle size={16} strokeWidth={1.85} className="mt-px flex-none" />
                {loginError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* social */}
        <button
          type="button"
          onClick={() => handleSocialLogin("google")}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-[11px] rounded-full border border-border bg-surface px-5 py-[clamp(11px,1.6vh,13px)] font-sans text-[15px] font-semibold text-text-primary transition-[background,box-shadow,transform] duration-200 ease-nc hover:bg-white hover:shadow-sm active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleMark />
          Continue with Google
        </button>

        <div className="my-[clamp(14px,2.2vh,24px)] flex items-center gap-4 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary before:h-px before:flex-1 before:bg-border before:content-[''] after:h-px after:flex-1 after:bg-border after:content-['']">
          or sign in with email
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[clamp(11px,1.7vh,18px)]">
          {/* email */}
          <div className="flex flex-col gap-[clamp(6px,1vh,8px)]">
            <label htmlFor="email" className="text-[13.5px] font-semibold tracking-[-0.01em] text-text-primary">
              Email address
            </label>
            <div className="relative flex">
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                disabled={isLoading}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={cx(INPUT_BASE, errors.email && "border-danger focus:shadow-[0_0_0_4px_rgba(192,57,43,0.12)]")}
              />
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
                <Mail size={19} strokeWidth={1.85} />
              </span>
            </div>
            {errors.email && (
              <p className="m-0 flex items-center gap-1.5 text-[12.5px] text-danger">
                <AlertCircle size={14} strokeWidth={1.85} /> {errors.email}
              </p>
            )}
          </div>

          {/* password */}
          <div className="flex flex-col gap-[clamp(6px,1vh,8px)]">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="password" className="text-[13.5px] font-semibold tracking-[-0.01em] text-text-primary">
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading}
                className="border-0 bg-transparent p-0 text-[13px] font-semibold text-text-secondary transition-colors duration-200 ease-nc hover:text-ink hover:underline hover:underline-offset-[3px] disabled:opacity-60"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative flex">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={formData.password}
                disabled={isLoading}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={cx(INPUT_BASE, "pr-[50px]", errors.password && "border-danger focus:shadow-[0_0_0_4px_rgba(192,57,43,0.12)]")}
              />
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
                <Lock size={19} strokeWidth={1.85} />
              </span>
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border-0 bg-transparent text-text-tertiary transition-[color,background] duration-200 ease-nc hover:bg-black/[0.04] hover:text-ink disabled:opacity-60"
              >
                {showPassword ? <EyeOff size={19} strokeWidth={1.85} /> : <Eye size={19} strokeWidth={1.85} />}
              </button>
            </div>
            {errors.password && (
              <p className="m-0 flex items-center gap-1.5 text-[12.5px] text-danger">
                <AlertCircle size={14} strokeWidth={1.85} /> {errors.password}
              </p>
            )}
          </div>

          {/* remember */}
          <button
            type="button"
            onClick={() => handleInputChange("rememberMe", !formData.rememberMe)}
            disabled={isLoading}
            className="mt-0.5 flex cursor-pointer select-none items-center gap-2.5 border-0 bg-transparent p-0 text-[14px] text-text-secondary disabled:opacity-60"
          >
            <span
              className={cx(
                "grid h-5 w-5 flex-none place-items-center rounded-md border-[1.5px] text-cream transition-[background,border-color] duration-200 ease-nc",
                formData.rememberMe ? "border-ink bg-ink" : "border-[rgba(0,0,0,0.14)] bg-surface"
              )}
            >
              <Check
                size={14}
                strokeWidth={2.4}
                className={cx("transition-all duration-200 ease-nc", formData.rememberMe ? "scale-100 opacity-100" : "scale-50 opacity-0")}
              />
            </span>
            Keep me signed in
          </button>

          {/* submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-transparent bg-ink px-6 py-[15px] text-[16px] font-semibold leading-none text-cream transition-[transform,background,box-shadow] duration-200 ease-nc hover:bg-black hover:shadow-card active:scale-[0.97] disabled:cursor-default disabled:opacity-[0.65]"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} strokeWidth={2} className="animate-spin" /> Signing in…
              </>
            ) : (
              <>
                Sign in <ArrowRight size={18} strokeWidth={1.85} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </>
  );
}
