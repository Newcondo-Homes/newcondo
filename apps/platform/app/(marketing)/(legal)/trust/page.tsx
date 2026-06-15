import type { Metadata } from "next";
import { TrustSafety } from "@/components/sections/trust-safety";

export const metadata: Metadata = {
  title: "Trust & Safety | Newcondo",
  description:
    "How Newcondo keeps renting safe — verified identities and owners, escrow-protected rent, round-the-clock fraud monitoring, safe inspections, and fast reporting.",
};

export default function TrustPage() {
  return <TrustSafety />;
}
