import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordForm from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password | Newcondo",
  description: "Reset your Newcondo account password.",
};

export default function ResetPasswordPage() {
  // useSearchParams() inside the form requires a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
