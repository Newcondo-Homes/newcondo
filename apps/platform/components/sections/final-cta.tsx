import { SplitButton } from "@/components/ui/split-button";

export function FinalCTA() {
  return (
    <section className="bg-ink text-cream" data-screen-label="Final CTA">
      <div className="max-w-[980px] mx-auto px-[var(--gutter)] py-[clamp(80px,11vw,150px)] text-center">
        <h2
          className="text-[clamp(38px,5.6vw,76px)] font-bold tracking-[-0.045em] leading-[0.98] text-cream m-0 [text-wrap:balance]"
          data-reveal
        >
          The property is already yours. The income should be too.
        </h2>
        <p className="nc-lead text-text-on-dark-2 mt-[26px] mx-auto max-w-[640px]" data-reveal>
          Stop managing a ₦50 million asset with an old phone and a prayer. Newcondo handles your rent, your tenants, your
          maintenance, your documents, and your peace of mind — for less than ₦625 a day.
        </p>
        <div className="flex flex-col items-center gap-[18px] mt-10" data-reveal>
          <SplitButton
            href="#pricing"
            variant="light"
            ariaLabel="List your property"
            label="List your property — start with Elite"
            className="max-[620px]:w-full"
          />
          <a
            href="#pricing"
            className="text-text-on-dark text-[15.5px] font-semibold no-underline border-b border-[rgba(249,249,239,0.4)] pb-[3px] transition-colors duration-200 ease-nc hover:border-cream"
          >
            Start with Essential
          </a>
        </div>
        <p className="text-[14px] text-text-on-dark-2 mt-7" data-reveal>
          No lock-in. Cancel anytime. Rent protected from day one.
        </p>
      </div>
    </section>
  );
}
