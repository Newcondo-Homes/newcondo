import type { Metadata } from "next";
import { Careers } from "@/components/sections/careers";

export const metadata: Metadata = {
  title: "Careers | NewCondo",
  description:
    "Help build the platform Nigeria trusts. Open roles, perks, and how we hire at Newcondo.",
};

export default function CareersPage() {
  return <Careers />;
}
