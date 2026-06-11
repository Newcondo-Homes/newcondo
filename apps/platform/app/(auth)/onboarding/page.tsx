import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@newcondo/auth";
import OnboardingFlow from "@/components/auth/onboarding-flow";

export const metadata: Metadata = {
  title: "Get started | NewCondo",
  description:
    "Create your Newcondo account, choose your plan, and start renting out — or finding — verified property.",
};

export default async function OnboardingPage() {
  const session = await auth();

  // Already signed in? Skip onboarding.
  // if (session) {
  //   redirect("/dashboard");
  // }

  return <OnboardingFlow />;
}
