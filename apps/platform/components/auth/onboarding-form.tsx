"use client";

/* ============================================================
   OnboardingForm

   Step 1: pick a role (UserTypeSelector — Owner / Renter / Agent).
   Step 2: enter details.

   >>> DEFERRED REGISTRATION <<<
   This form no longer calls register(). It only collects + validates
   the details and hands them up via onDetailsSubmit (INCLUDING the
   password). The account is created later, in PaymentProcessing,
   after the plan + payment step — so an abandoned onboarding never
   leaves a half-created account behind.

   Social sign-in still creates the account immediately via OAuth, and
   carries the chosen role through the callback URL so the flow can
   resume at the plan step. Google One Tap is mounted on the details
   step to auto-prompt returning Gmail users (see GoogleOneTap).
   ============================================================ */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@newcondo/auth/client";
import { toast } from "@newcondo/ui";
import { Mail, Phone, Eye, EyeOff, Loader2, Check, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { cx } from "@/lib/cx";
import UserTypeSelector from "./UserTypeSelector";
import GoogleOneTap from "./GoogleOneTap";
import { UserType } from "@/types/api";

/** Details collected in the form — held in the flow until final registration. */
export interface OnboardingDraft {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserType;
}

interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: UserType;
  agreeToTerms: boolean;
}

const initialFormData: RegisterFormData = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: UserType.OWNER,
  agreeToTerms: false,
};

const ROLE_LABEL: Partial<Record<UserType, string>> = {
  [UserType.OWNER]: "property owner",
  [UserType.RENTER]: "renter",
  [UserType.AGENT]: "agent",
};

/** Slug carried through OAuth callback + One Tap so the flow can restore the role. */
function roleSlug(role: UserType): string {
  if (role === UserType.AGENT) return "agent";
  if (role === UserType.RENTER) return "renter";
  return "owner";
}

const INPUT_BASE =
  "w-full rounded-[16px] border bg-surface px-4 py-[13px] text-[16px] text-text-primary outline-none transition-[border-color,box-shadow] duration-200 ease-nc placeholder:text-text-tertiary focus:shadow-[0_0_0_4px_rgba(19,19,19,0.06)]";

function ErrMsg({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-danger">
      <AlertCircle size={14} strokeWidth={2} className="flex-none" />
      {children}
    </p>
  );
}

export default function OnboardingForm({
  initialRole,
  onDetailsSubmit,
}: {
  /** Pre-select a role (e.g. PROPERTY_OWNER, or AGENT when arriving from /agents). */
  initialRole?: UserType;
  /** Hands the validated details (incl. password) up to the flow. Registration is deferred. */
  onDetailsSubmit?: (draft: OnboardingDraft) => void;
} = {}) {
  const router = useRouter();
  const [step, setStep] = useState<"user-type" | "details">(initialRole ? "details" : "user-type");
  const [formData, setFormData] = useState<RegisterFormData>({
    ...initialFormData,
    role: initialRole ?? initialFormData.role,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [socialLoading, setSocialLoading] = useState<null | "google" | "facebook">(null);

  const handleUserTypeSelect = (type: UserType) => {
    setFormData((prev) => ({ ...prev, role: type }));
    setStep("details");
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^(\+234|0)[789]\d{9}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid Nigerian phone number";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Must contain uppercase, lowercase, and a number";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // No register() here — details are held by the flow until after payment.
    onDetailsSubmit?.({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.replace(/\s/g, ""),
      password: formData.password,
      role: formData.role,
    });
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    setSocialLoading(provider);
    try {
      // Carry the chosen role + a social marker back so the flow resumes at the plan step.
      await signIn(provider, {
        callbackUrl: `/onboarding?role=${roleSlug(formData.role)}&social=1`,
        redirect: true,
      });
    } catch (error) {
      console.error(error);
      setSocialLoading(null);
      toast("Social login failed", {
        description: "Please try again or use email registration.",
      });
    }
  };

  /* ============================================================
     STEP 1 — account type (3 roles)
     ============================================================ */
  if (step === "user-type") {
    return (
      <div className="mx-auto w-full max-w-[840px]">
        <div className="mb-[clamp(12px,2vh,20px)] text-center">
          <h1 className="m-0 text-[clamp(24px,2.9vw,37px)] font-bold leading-[1.02] tracking-[-0.04em] text-text-primary text-balance">
            What brings you to Newcondo?
          </h1>
          <p className="mx-auto mt-2 max-w-[54ch] text-[15px] leading-[1.45] text-text-secondary">
            Pick the kind of account you want. You can always add another later.
          </p>
        </div>

        <UserTypeSelector selectedType={formData.role} onSelect={handleUserTypeSelect} />

        <p className="mt-7 text-center text-[14.5px] text-text-secondary">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="border-b border-border-strong pb-px font-semibold text-ink transition-colors duration-200 ease-nc hover:border-ink"
          >
            Sign in
          </button>
        </p>
      </div>
    );
  }

  /* ============================================================
     STEP 2 — details form
     ============================================================ */
  return (
    <div className="mx-auto w-full max-w-[560px]">
      {/* Auto Google One Tap — backend signs in ONLY users already registered with this Gmail. */}
      <GoogleOneTap role={roleSlug(formData.role)} />

      <button
        type="button"
        onClick={() => setStep("user-type")}
        className="group mb-4 inline-flex items-center gap-2 text-[14.5px] font-semibold text-text-secondary transition-colors duration-200 ease-nc hover:text-ink"
      >
        <ArrowLeft size={17} strokeWidth={2} className="transition-transform duration-200 ease-nc group-hover:-translate-x-1" />
        Back
      </button>

      <div className="mb-4 text-center">
        <h1 className="m-0 text-[clamp(24px,2.8vw,32px)] font-bold leading-[1.02] tracking-[-0.04em] text-text-primary">
          Create your account
        </h1>
        <p className="mt-1.5 text-[15px] leading-[1.45] text-text-secondary">
          Setting up your {ROLE_LABEL[formData.role] ?? "Newcondo"} account.
        </p>
      </div>

      <div className="rounded-card border border-border-hair bg-surface p-[clamp(22px,2.4vw,30px)] shadow-card">
        <form onSubmit={handleSubmit} noValidate>
          {/* Full name */}
          <div className="mb-3">
            <label htmlFor="name" className="mb-1.5 block text-[13.5px] font-semibold tracking-[-0.01em] text-text-primary">
              Full name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={cx(INPUT_BASE, errors.name ? "border-danger" : "border-nc-border focus:border-ink")}
            />
            {errors.name && <ErrMsg>{errors.name}</ErrMsg>}
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-x-3.5 max-[560px]:grid-cols-1">
            <div className="mb-3">
              <label htmlFor="email" className="mb-1.5 block text-[13.5px] font-semibold tracking-[-0.01em] text-text-primary">
                Email address
              </label>
              <div className="relative">
                <Mail size={19} strokeWidth={1.85} className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={cx(INPUT_BASE, "pl-[44px]", errors.email ? "border-danger" : "border-nc-border focus:border-ink")}
                />
              </div>
              {errors.email && <ErrMsg>{errors.email}</ErrMsg>}
            </div>

            <div className="mb-3">
              <label htmlFor="phone" className="mb-1.5 block text-[13.5px] font-semibold tracking-[-0.01em] text-text-primary">
                Phone number
              </label>
              <div className="relative">
                <Phone size={18} strokeWidth={1.85} className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  id="phone"
                  type="tel"
                  placeholder="+234 XXX XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={cx(INPUT_BASE, "pl-[44px]", errors.phone ? "border-danger" : "border-nc-border focus:border-ink")}
                />
              </div>
              {errors.phone && <ErrMsg>{errors.phone}</ErrMsg>}
            </div>
          </div>

          {/* Password + Confirm */}
          <div className="grid grid-cols-2 gap-x-3.5 max-[560px]:grid-cols-1">
            <div className="mb-3">
              <label htmlFor="password" className="mb-1.5 block text-[13.5px] font-semibold tracking-[-0.01em] text-text-primary">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={cx(INPUT_BASE, "pr-12", errors.password ? "border-danger" : "border-nc-border focus:border-ink")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 grid h-[34px] w-[34px] -translate-y-1/2 place-items-center rounded-full text-text-tertiary transition-colors duration-200 ease-nc hover:bg-black/5 hover:text-ink"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={19} strokeWidth={1.85} /> : <Eye size={19} strokeWidth={1.85} />}
                </button>
              </div>
              {errors.password && <ErrMsg>{errors.password}</ErrMsg>}
            </div>

            <div className="mb-3">
              <label htmlFor="confirmPassword" className="mb-1.5 block text-[13.5px] font-semibold tracking-[-0.01em] text-text-primary">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={cx(INPUT_BASE, "pr-12", errors.confirmPassword ? "border-danger" : "border-nc-border focus:border-ink")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-2 top-1/2 grid h-[34px] w-[34px] -translate-y-1/2 place-items-center rounded-full text-text-tertiary transition-colors duration-200 ease-nc hover:bg-black/5 hover:text-ink"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={19} strokeWidth={1.85} /> : <Eye size={19} strokeWidth={1.85} />}
                </button>
              </div>
              {errors.confirmPassword && <ErrMsg>{errors.confirmPassword}</ErrMsg>}
            </div>
          </div>

          {/* Terms — checkbox toggles; the two policy phrases are real links */}
          <div className="mb-1.5 mt-1 flex w-full items-start gap-2.5 text-left">
            <button
              type="button"
              role="checkbox"
              aria-checked={formData.agreeToTerms}
              aria-label="I agree to the Terms of Service and Privacy Policy"
              onClick={() => handleInputChange("agreeToTerms", !formData.agreeToTerms)}
              className={cx(
                "mt-px grid h-5 w-5 flex-none cursor-pointer place-items-center rounded-md border-[1.5px] transition-[background,border-color,transform] duration-200 ease-nc hover:scale-110 active:scale-95",
                formData.agreeToTerms ? "border-ink bg-ink text-cream" : "border-border-strong bg-surface text-transparent hover:border-ink"
              )}
            >
              <Check size={13} strokeWidth={2.6} />
            </button>
            <span className="text-[13.5px] leading-[1.45] text-text-secondary">
              I agree to the{" "}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="nc-policy-link cursor-pointer font-medium text-text-primary"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="nc-policy-link cursor-pointer font-medium text-text-primary"
              >
                Privacy Policy
              </Link>
            </span>
          </div>
          {errors.agreeToTerms && <ErrMsg>{errors.agreeToTerms}</ErrMsg>}

          <button
            type="submit"
            className="group mt-2 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[16px] font-semibold leading-none text-cream transition-[transform,background,box-shadow] duration-200 ease-nc hover:bg-black hover:shadow-card active:scale-[0.97]"
          >
            Continue
            <ArrowRight size={18} strokeWidth={2} className="transition-transform duration-200 ease-nc group-hover:translate-x-1" />
          </button>
        </form>

        <p className="mt-2.5 text-center text-[12.5px] leading-[1.5] text-text-tertiary">
          We&apos;ll verify your email next. Your account is only created after you choose a plan.
        </p>

        {/* divider */}
        <div className="my-4 flex items-center gap-4 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
          <span className="h-px flex-1 bg-nc-border" />
          Or continue with
          <span className="h-px flex-1 bg-nc-border" />
        </div>

        {/* social */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            disabled={socialLoading !== null}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-nc-border bg-surface py-3 text-[15px] font-semibold text-text-primary transition-[background,box-shadow] duration-200 ease-nc hover:bg-white hover:shadow-card disabled:opacity-60"
          >
            {socialLoading === "google" ? (
              <Loader2 size={18} strokeWidth={2} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Google
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin("facebook")}
            disabled={socialLoading !== null}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-nc-border bg-surface py-3 text-[15px] font-semibold text-text-primary transition-[background,box-shadow] duration-200 ease-nc hover:bg-white hover:shadow-card disabled:opacity-60"
          >
            {socialLoading === "facebook" ? (
              <Loader2 size={18} strokeWidth={2} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            )}
            Facebook
          </button>
        </div>
      </div>
    </div>
  );
}
