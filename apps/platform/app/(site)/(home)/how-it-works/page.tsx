import type { Metadata } from "next";
import { HowItWorksPage } from "@/components/sections/how-it-works-page";

export const metadata: Metadata = {
  title: "How it works | NewCondo",
  description:
    "How Newcondo works for renters, agents and property owners — list and verify, GPS-mark, escrow rent, and get paid. The whole journey, step by step.",
};

export default function HowItWorks() {
  return <HowItWorksPage />;
}
