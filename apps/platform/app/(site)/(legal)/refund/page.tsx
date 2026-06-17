import type { Metadata } from "next";
import { RefundPolicy } from "@/components/sections/refund-policy";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | Newcondo",
  description:
    "What is refundable on Newcondo, when, and how — refund windows, cancellation protocols, force-majeure exceptions, and the dispute-resolution process.",
};

export default function RefundPage() {
  return <RefundPolicy />;
}
