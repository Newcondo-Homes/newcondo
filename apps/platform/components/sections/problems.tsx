import { Section } from "@/components/ui/section";
import { SectionHead } from "@/components/ui/section-head";
import { TextLink } from "@/components/ui/text-link";
import { PROBLEMS } from "@/lib/data";

export function Problems() {
  return (
    <Section id="problems" label="The problem">
      <SectionHead
        eyebrow="The reality of owning property in Nigeria"
        title="You own the building. Everyone else owns the headache — then hands it to you."
        lead="This is what most landlords are quietly dealing with right now."
      />
      <div className="grid grid-cols-3 gap-[22px] max-[1080px]:grid-cols-2 max-[620px]:grid-cols-1">
        {PROBLEMS.map(([n, t, x]) => (
          <article
            key={n}
            data-prob
            className="bg-surface border border-[rgba(0,0,0,0.06)] rounded-card px-[34px] pt-[38px] pb-10 flex flex-col transition-[transform,box-shadow] duration-[280ms] ease-nc hover:-translate-y-1.5 hover:shadow-lift will-change-transform"
          >
            <span className="font-mono text-text-tertiary text-[14px] mb-[26px]">{n}</span>
            <h3 className="text-[clamp(21px,2vw,26px)] font-bold tracking-[-0.03em] leading-[1.1] m-0 mb-3.5 text-text-primary">
              {t}
            </h3>
            <p className="text-[16px] leading-[1.55] text-text-secondary m-0">{x}</p>
          </article>
        ))}
      </div>
      <div className="flex items-center justify-between gap-7 mt-[52px] flex-wrap max-[860px]:flex-col max-[860px]:items-start">
        <p
          className="text-[clamp(20px,2.2vw,28px)] font-semibold tracking-[-0.025em] leading-[1.25] text-text-primary m-0 max-w-[22ch]"
          data-reveal
        >
          None of these are your fault. But they are your problem — until now.
        </p>
        <TextLink href="#how">See how Newcondo handles all of this</TextLink>
      </div>
    </Section>
  );
}
