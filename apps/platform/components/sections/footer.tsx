import { Icon } from "@/components/ui/icon";
import { FOOTER } from "@/lib/data";
import { CONTACT } from "@/lib/contact-data";

/** Live destinations for footer items that have real pages. Everything else → "#". */
const FOOTER_HREFS: Record<string, string> = {
  // Product
  "How it works": "/#how",
  Features: "/#features",
  Pricing: "/#pricing",
  // Company
  About: "/about",
  Blog: "/blog",
  Support: "/support",
  Careers: "/careers",
  Contact: "/contact",
  // Legal
  "Privacy Policy": "/privacy",
  "Refund Policy": "/refund",
  "Terms of Service": "/terms",
  "Trust & Safety": "/trust",
  "Cookie Policy": "/cookies",
  "Data Handling": "/data-handling",
};

export function Footer() {
  return (
    <footer className="bg-ink text-text-on-dark relative overflow-hidden" data-screen-label="Footer">
      <div className="max-w-[1440px] mx-auto px-[var(--gutter)] pt-20 pb-12 grid grid-cols-[1.2fr_2fr] gap-12 max-[860px]:grid-cols-1 max-[860px]:gap-9">
        <div>
          <a href="#" className="flex items-center gap-[11px] no-underline font-bold text-[21px] tracking-[-0.04em] text-cream mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-mark-cream.png" alt="Newcondo" className="w-[30px] h-auto" />
            <span>newcondo</span>
          </a>
          <p className="text-[16px] leading-[1.5] text-text-on-dark-2 m-0 mb-[22px] max-w-[30ch]">
            Property management, finally working the way it should.
          </p>
          <a
            href={`mailto:${CONTACT.email}`}
            className="flex items-center gap-2.5 text-[14.5px] text-text-on-dark-2 m-0 mb-2.5 no-underline transition-opacity duration-200 ease-nc hover:opacity-100 opacity-[0.9]"
          >
            <Icon name="mail" size={17} /> {CONTACT.email}
          </a>
          <a
            href={`tel:${CONTACT.phoneRaw}`}
            className="flex items-center gap-2.5 text-[14.5px] text-text-on-dark-2 m-0 mb-2.5 no-underline transition-opacity duration-200 ease-nc hover:opacity-100 opacity-[0.9]"
          >
            <Icon name="phone" size={17} /> {CONTACT.phoneDisplay}
          </a>
          <p className="flex items-start gap-2.5 text-[14.5px] leading-[1.5] text-text-on-dark-2 m-0 max-w-[30ch]">
            <Icon name="map-pin" size={17} className="mt-0.5 flex-none" /> {CONTACT.addressOneLine}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-7 max-[860px]:grid-cols-2">
          {Object.entries(FOOTER).map(([h, items]) => (
            <div key={h} className="flex flex-col gap-[13px]">
              <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-text-on-dark-2 mb-1.5">{h}</div>
              {items.map((it) => (
                <a
                  key={it}
                  href={FOOTER_HREFS[it] ?? "#"}
                  className="no-underline text-[14.5px] text-text-on-dark opacity-[0.78] transition-opacity duration-200 ease-nc hover:opacity-100"
                >
                  {it}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="footer-wordmark px-[var(--gutter)] mt-6 mx-auto max-w-[1440px]">
        <span className="footer-wm-tile">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-mark-cream-tight.png" alt="" />
        </span>
        <span>newcondo</span>
      </div>

      <div className="max-w-[1440px] mx-auto px-[var(--gutter)] pt-8 pb-11 flex justify-between gap-4 flex-wrap text-[13px] text-text-on-dark-2 border-t border-[rgba(249,249,239,0.1)] mt-[30px]">
        <span>© Newcondo LLC 2026</span>
        <span>Escrow rent collection · Verified tenants · Owner dashboard</span>
      </div>
    </footer>
  );
}
