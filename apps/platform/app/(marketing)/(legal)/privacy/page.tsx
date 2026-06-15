import type { Metadata } from "next";
import { PrivacyPolicy } from "@/components/sections/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy Policy | Newcondo",
  description:
    "What personal data Newcondo collects, why we collect it, how we protect it, and the rights you have over it — for renters, property owners, agents, and visitors.",
};

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}
