import type { Metadata } from "next";
import { About } from "@/components/sections/about";

export const metadata: Metadata = {
  title: "About | NewCondo",
  description:
    "Newcondo exists so property owners never lose money to confusion, fake listings, or silent agents. Our mission, values, and story.",
};

export default function AboutPage() {
  return <About />;
}
