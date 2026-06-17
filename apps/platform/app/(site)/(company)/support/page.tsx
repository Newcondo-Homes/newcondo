import type { Metadata } from "next";
import { Support } from "@/components/sections/support";

export const metadata: Metadata = {
  title: "Support | NewCondo",
  description:
    "Get help with renting, listing, payments, refunds, and safety on Newcondo. Browse by topic, read common answers, or reach a human.",
};

export default function SupportPage() {
  return <Support />;
}
