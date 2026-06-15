"use client";

/* ============================================================
   OTPVerification — page-level wrapper.

   Adds the standalone-page chrome (full-height <main>, brand lockup,
   FitToViewport) around the shared OTPVerificationPanel and turns on
   `autoRoute` so success keeps its legacy navigation:
     EMAIL_VERIFICATION → /dashboard
     PASSWORD_RESET     → /reset-password

   This is what the dedicated /verify-otp page renders, so OTP login and
   password-reset flows are unchanged. The onboarding flow embeds
   OTPVerificationPanel directly instead (no chrome, no autoRoute).
   ============================================================ */

import FitToViewport from "./fit-to-viewport";
import { OTPVerificationPanel } from "./OTPVerificationPanel";

interface OTPVerificationProps {
  email: string;
  type: "EMAIL_VERIFICATION" | "LOGIN" | "PASSWORD_RESET";
  onSuccess?: () => void;
  onBack?: () => void;
}

export function OTPVerification({ email, type, onSuccess, onBack }: OTPVerificationProps) {
  return (
    <main
      data-screen-label="Verify OTP"
      className="flex h-dvh flex-col overflow-hidden bg-background px-[clamp(20px,5vw,48px)] py-[clamp(16px,3vh,32px)]"
    >
      <div className="flex min-h-0 w-full flex-1">
        <FitToViewport className="mx-auto w-full max-w-[460px]">
          <div className="flex flex-col items-center">
            {/* brand */}
            <a
              href="/"
              className="mb-[clamp(16px,3vh,28px)] flex items-center gap-[11px] text-[22px] font-bold tracking-[-0.04em] text-ink no-underline"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo-mark-dark.png" alt="Newcondo" className="h-auto w-[30px]" />
              <span>newcondo</span>
            </a>

            <OTPVerificationPanel
              email={email}
              type={type}
              autoRoute
              onVerified={onSuccess}
              onBack={onBack}
            />
          </div>
        </FitToViewport>
      </div>
    </main>
  );
}
