import type { Metadata } from "next";
import { TermsOfService } from "@/components/sections/terms-of-service";

export const metadata: Metadata = {
  title: "Terms of Service | Newcondo",
  description:
    "The agreement between you and Newcondo — eligibility, account verification, escrow rent collection, fees, acceptable use, fraud enforcement, and liability.",
};

export default function TermsPage() {
  return <TermsOfService />;
}
