import { Suspense } from "react";
import { Metadata } from "next";
import { VerificationMain } from "@/components/profile/VerificationMain";
import { VerificationSkeleton } from "@/components/profile/VerificationSkeleton";

export const metadata: Metadata = {
  title: "Identity Verification | NewCondo",
  description:
    "Complete your identity verification to access all platform features",
};

export default function VerificationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Identity Verification
            </h1>
            <p className="text-gray-600">
              Complete your identity verification to access all platform
              features and build trust with other users.
            </p>
          </div>

          {/* Main Content */}
          <Suspense fallback={<VerificationSkeleton />}>
            <VerificationMain />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
