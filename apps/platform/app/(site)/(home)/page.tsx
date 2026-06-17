import { Pageload } from "@/components/ui/pageload";
import { Hero } from "@/components/sections/hero";
import { Problems } from "@/components/sections/problems";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Comparison } from "@/components/sections/comparison";
import { Features } from "@/components/sections/features";
import { Testimonials } from "@/components/sections/testimonials";
import { Pricing } from "@/components/sections/pricing";
import { CEO } from "@/components/sections/ceo";
import { FAQ } from "@/components/sections/faq";
import { FinalCTA } from "@/components/sections/final-cta";

export const metadata = {
  title: "Newcondo — For Property Owners",
  description: "Rent out your property without agent confusion, double-booking, or payment stress.",
};

export default function OwnersPage() {
  return (
    <>
      <Pageload />
      <Hero />
      <Problems />
      <HowItWorks />
      <Comparison />
      <Features />
      <Testimonials />
      <Pricing />
      <CEO />
      <FAQ />
      <FinalCTA />
    </>
  );
}