import { Pageload } from "@/components/ui/pageload";
import { Navbar } from "@/components/sections/navbar";
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
import { Footer } from "@/components/sections/footer";
import { ChatButton } from "@/components/chat-button";

export default function Home() {
  return (
    <>
      {/* pageload overlay — fades itself out via Framer Motion / AnimatePresence */}
      <Pageload />
      <Navbar />
      <main>
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
      </main>
      <Footer />
      <ChatButton />
    </>
  );
}
