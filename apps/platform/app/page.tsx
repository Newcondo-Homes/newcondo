import { SiteAnimations } from "@/components/site-animations";
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
      {/* pageload overlay — faded out by <SiteAnimations /> */}
      <div
        id="pageload"
        className="fixed inset-0 z-[200] bg-background flex items-start justify-start"
      >
        <div className="flex items-center gap-[11px] px-[var(--gutter)] py-[26px] font-bold text-[21px] tracking-[-0.04em] text-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-mark-dark.png" alt="" className="w-[30px] h-auto" />
          <span>newcondo</span>
        </div>
      </div>

      <SiteAnimations />
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
