import { Section } from "@/components/ui/section";
import { SectionHead } from "@/components/ui/section-head";
import { TextLink } from "@/components/ui/text-link";
import { Icon } from "@/components/ui/icon";
import { Group, Item, Reveal, vRow } from "@/components/motion";
import { CMP_ROWS } from "@/lib/data";

export function Comparison() {
  return (
    <Section id="comparison" label="Comparison">
      <SectionHead
        center
        eyebrow="Newcondo vs. how it works today"
        title="You've been managing a ₦50 million asset with WhatsApp and verbal agreements."
      >
        <Reveal as="p" className="nc-lead mt-5 mx-auto">
          Here is what the old way looks like — and what Newcondo replaces it with.
        </Reveal>
        <div className="cmp-swipe flex-col items-center gap-1 mt-[18px] mx-auto text-text-tertiary" aria-hidden>
          <svg className="cmp-swipe-ico w-12 h-auto" viewBox="0 0 56 24" fill="none">
            <path d="M12 12 H44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 6 L9 12 L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M40 6 L47 12 L40 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[12px] font-semibold tracking-[0.14em] uppercase">Swipe</span>
        </div>
      </SectionHead>

      <Reveal className="js-cmp relative max-w-[1080px] mx-auto bg-surface rounded-card shadow-card pt-3 px-[clamp(16px,2.4vw,34px)] pb-7 max-[620px]:px-3 max-[620px]:overflow-x-auto">
        <div className="cmp-hl" />
        <Group stagger={0.05} className="relative z-[2] max-[620px]:min-w-[540px]">
          <div className="grid grid-cols-[1.5fr_1fr_1.15fr] py-5 max-[860px]:grid-cols-[1.3fr_1fr_1.1fr]">
            <div className="text-[13px] font-semibold tracking-[0.04em] uppercase text-text-tertiary self-center">Feature</div>
            <div className="text-[17px] font-bold tracking-[-0.02em] text-text-secondary px-[22px] self-center max-[860px]:px-3 max-[860px]:text-[13.5px]">
              The old way
            </div>
            <div className="text-[17px] font-bold tracking-[-0.02em] text-ink px-[22px] self-center flex items-center gap-[9px] max-[860px]:px-3 max-[860px]:text-[13.5px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo-mark-dark.png" alt="" className="w-[22px] h-auto" /> With Newcondo
            </div>
          </div>
          {CMP_ROWS.map(([f, o, n]) => (
            <Item
              key={f}
              variants={vRow}
              className="grid grid-cols-[1.5fr_1fr_1.15fr] py-5 border-t border-[rgba(0,0,0,0.06)] max-[860px]:grid-cols-[1.3fr_1fr_1.1fr]"
            >
              <div className="text-[16px] font-semibold tracking-[-0.01em] text-text-primary self-center pr-[18px]">{f}</div>
              <div className="text-[14.5px] leading-[1.5] text-text-tertiary px-[22px] self-center flex gap-[9px] max-[860px]:px-3 max-[860px]:text-[13.5px]">
                <Icon name="x" size={17} className="flex-none mt-0.5 text-danger opacity-70" />
                <span>{o}</span>
              </div>
              <div className="text-[14.5px] leading-[1.5] text-text-secondary px-[22px] self-center flex gap-[9px] max-[860px]:px-3 max-[860px]:text-[13.5px]">
                <Icon name="check" size={17} className="flex-none mt-0.5 text-green-dark" />
                <span dangerouslySetInnerHTML={{ __html: n }} />
              </div>
            </Item>
          ))}
        </Group>
      </Reveal>

      <div className="flex items-center justify-between gap-7 mt-[52px] flex-wrap max-[860px]:flex-col max-[860px]:items-start">
        <Reveal
          as="p"
          className="text-[clamp(20px,2.2vw,28px)] font-semibold tracking-[-0.025em] leading-[1.25] text-text-primary m-0 max-w-[34ch]"
        >
          The old way built on WhatsApp and verbal agreements was never a system. It was a risk you got used to carrying. Newcondo is the system.
        </Reveal>
        <TextLink href="#pricing">Start listing your property</TextLink>
      </div>
    </Section>
  );
}
