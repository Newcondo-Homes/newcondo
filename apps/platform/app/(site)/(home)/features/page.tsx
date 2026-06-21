import type { Metadata } from "next";
import { FeaturesPage } from "@/components/sections/features-page";

export const metadata: Metadata = {
  title: "Features | NewCondo",
  description:
    "Every Newcondo feature, explained for renters, agents and property owners — escrow, verification, marking jobs, sub-agent network, refund window and more.",
};

export default function Features() {
  return <FeaturesPage />;
}
