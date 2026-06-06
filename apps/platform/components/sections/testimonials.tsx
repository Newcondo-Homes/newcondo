import { Section } from "@/components/ui/section";
import { SectionHead } from "@/components/ui/section-head";
import { Icon } from "@/components/ui/icon";
import { ImageSlot } from "@/components/ui/image-slot";
import { TESTIMONIALS } from "@/lib/data";

export function Testimonials() {
  return (
    <Section id="stories" label="Testimonials">
      <SectionHead
        eyebrow="What landlords say"
        title="You're not the first person who got tired of managing property with WhatsApp."
      />
      <div className="grid grid-cols-3 gap-[22px] max-[860px]:grid-cols-1">
        {TESTIMONIALS.map((t) => (
          <article
            key={t.id}
            data-result
            className="group relative h-[480px] rounded-card overflow-hidden flex flex-col justify-between shadow-card transition-[transform,box-shadow] duration-[280ms] ease-nc hover:-translate-y-2 hover:shadow-lift max-[860px]:h-[420px]"
            style={{ background: "linear-gradient(135deg,#3a3a36,#23231f)" }}
          >
            <div className="absolute inset-0 transition-transform duration-[700ms] ease-nc group-hover:scale-105">
              <ImageSlot placeholder={t.ph} />
            </div>
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(10,10,9,0.9) 6%, rgba(10,10,9,0.25) 55%, rgba(10,10,9,0.4) 100%)" }}
            />
            <div className="relative z-[2] px-7 py-[26px] inline-flex items-center gap-2 text-[14px] font-semibold text-cream">
              <Icon name="map-pin" size={16} className="text-green-bright" /> {t.place}
            </div>
            <div className="relative z-[2] px-7 pt-[26px] pb-[30px]">
              <p className="text-[20px] font-semibold tracking-[-0.02em] leading-[1.3] text-cream m-0 mb-4 [text-wrap:pretty]">
                {t.quote}
              </p>
              <p className="text-[13.5px] text-text-on-dark-2 m-0">{t.by}</p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
