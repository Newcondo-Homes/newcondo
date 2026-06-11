import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { OTPVerification } from "@/components/auth/OTPVerification";
import type { OTPType } from "@/types/api";

export const metadata: Metadata = {
  title: "Verify Email | Newcondo",
  description: "Verify your email address to complete registration",
};

interface VerifyOTPPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VerifyOTPPage({ searchParams }: VerifyOTPPageProps) {
  const params = await searchParams;
  const email = params.email as string;
  const type = params.type as OTPType;

  // Redirect if required params are missing
  if (!email || !type) {
    redirect("/login");
  }

  return (
    <Suspense fallback={null}>
      <OTPVerification email={email} type={type} />
    </Suspense>
  );
}
