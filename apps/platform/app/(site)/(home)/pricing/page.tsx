import type { Metadata } from "next";
import { PricingPage } from "@/components/sections/pricing-page";

export const metadata: Metadata = {
  title: "Pricing | NewCondo",
  description:
    "Transparent Newcondo pricing for renters, agents and property owners. Compare plans side by side — escrow rent collection, verified listings, marking jobs and more.",
};

export default function Pricing() {
  return <PricingPage />;
}
