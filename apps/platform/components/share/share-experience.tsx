"use client";

/* ============================================================
   ShareExperience — the public shared-property view.
   Gentle, slow framer-motion entrances (reused site primitives:
   vFade / vLead / vCard over 0.7–1.15s with the NewCondo EASE).
   ============================================================ */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RentGate } from "@/components/share/rent-gate";
import { cx } from "@/lib/cx";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { ImageSlot } from "@/components/ui/image-slot";
import { Reveal, Group, Item, vFade, vLead, vCard, EASE } from "@/components/motion";
import { type SharedProperty, formatPrice } from "./share-types";

/* photo grid slots fall back to placeholders until real images exist */
const SLOT_LABELS = ["Living room", "Kitchen", "Bedroom", "Bathroom"];

export function ShareExperience({ property, shareCode = "" }: { property: SharedProperty; shareCode?: string }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [renting, setRenting] = useState(false);

  const imgs = property.images ?? [];
  const primary = imgs.find((i) => i.isPrimary)?.url ?? imgs[0]?.url;
  const rest = imgs.filter((i) => i.url !== primary).slice(0, 4);
  const ownerName = property.owner?.name || "Property owner";
  const initials = ownerName
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      /* clipboard may be blocked — ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
    <main className="max-w-[1240px] mx-auto px-[var(--gutter)] pt-[clamp(20px,3vw,34px)]">
      {/* breadcrumbs */}
      <Reveal as="nav" variants={vFade} className="inline-flex items-center gap-2 text-[13.5px] text-text-tertiary mb-[18px]">
        <a href="/properties" className="hover:text-ink transition-colors">{property.city}</a>
        <span className="opacity-50">/</span>
        <a href="/properties" className="hover:text-ink transition-colors">{property.state}</a>
        <span className="opacity-50">/</span>
        <span>{property.title}</span>
      </Reveal>

      {/* gallery */}
      <Reveal
        variants={vCard}
        className="grid grid-cols-[1.42fr_1fr] gap-3 h-[clamp(360px,46vw,540px)] mb-[34px] max-[760px]:grid-cols-1 max-[760px]:h-auto"
      >
        <div className="relative max-[760px]:h-[300px]">
          <div className="w-full h-full rounded-[20px] overflow-hidden bg-[linear-gradient(135deg,#c7cfca,#9aa8a0)]">
            {primary ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primary} alt={property.title} className="w-full h-full object-cover" />
            ) : (
              <ImageSlot placeholder="Main photo" />
            )}
          </div>
          <span className="absolute right-[14px] bottom-[14px] z-[3] inline-flex items-center gap-[7px] bg-[rgba(19,19,19,0.72)] text-cream text-[13px] font-medium px-[14px] py-[9px] rounded-full backdrop-blur-[6px]">
            <Icon name="image" size={16} /> {property.photoCount ?? (imgs.length || 12)} photos
          </span>
        </div>
        <div className="grid grid-cols-2 grid-rows-2 gap-3 max-[760px]:grid-rows-1 max-[760px]:h-[130px]">
          {SLOT_LABELS.map((label, i) => (
            <div
              key={label}
              className={cx(
                "rounded-[20px] overflow-hidden bg-[linear-gradient(135deg,#d2ccbe,#b0a892)]",
                i >= 2 && "max-[760px]:hidden"
              )}
            >
              {rest[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={rest[i].url} alt={rest[i].altText ?? label} className="w-full h-full object-cover" />
              ) : (
                <ImageSlot placeholder={label} />
              )}
            </div>
          ))}
        </div>
      </Reveal>

      {/* body */}
      <div className="grid grid-cols-[1fr_380px] gap-14 pb-[90px] items-start max-[980px]:grid-cols-1 max-[980px]:gap-9">
        {/* LEFT */}
        <div>
          <Reveal variants={vLead}>
            <h1 className="text-[clamp(28px,3.4vw,40px)] leading-[1.04] tracking-[-0.03em] font-bold text-text-primary m-0 [text-wrap:balance]">
              {property.title}
            </h1>
            <div className="inline-flex items-center gap-2 text-[15px] text-text-secondary mt-3">
              <Icon name="map-pin" size={18} className="text-text-tertiary" />
              {property.address} · {property.city}, {property.state}
            </div>
            <div className="flex flex-wrap gap-2.5 mt-[18px]">
              {property.isVerified !== false && (
                <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold px-[14px] py-2 rounded-full bg-green-wash text-green-dark">
                  <Icon name="shield-check" size={16} /> Verified &amp; GPS-marked
                </span>
              )}
              <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold px-[14px] py-2 rounded-full bg-surface text-text-secondary border border-nc-border">
                <Icon name="map" size={16} /> Boundary confirmed
              </span>
              <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold px-[14px] py-2 rounded-full bg-ink text-cream capitalize">
                {property.propertyType.toLowerCase().replace(/_/g, " ")}
              </span>
            </div>
          </Reveal>

          {/* specs */}
          <Group stagger={0.08} className="flex flex-wrap gap-3.5 mt-[30px]">
            {[
              ["bed-double", property.bedrooms ?? "—", "Bedrooms"],
              ["bath", property.bathrooms ?? "—", "Bathrooms"],
              ["ruler", property.area ?? "Marked", "Floor area"],
            ].map(([icon, value, label]) => (
              <Item
                key={label as string}
                variants={vFade}
                className="flex items-center gap-3 flex-1 min-w-[150px] bg-surface border border-border-hair rounded-[16px] px-[18px] py-4"
              >
                <span className="w-[42px] h-[42px] flex-none rounded-[12px] bg-surface-soft flex items-center justify-center text-ink">
                  <Icon name={icon as string} size={20} />
                </span>
                <span>
                  <span className="block text-[17px] font-semibold tracking-[-0.02em] text-text-primary leading-[1.1]">{value}</span>
                  <span className="block text-[12.5px] text-text-tertiary mt-[3px]">{label}</span>
                </span>
              </Item>
            ))}
          </Group>

          {/* description */}
          <Reveal variants={vFade} className="mt-11">
            <h3 className="text-[21px] leading-[1.2] tracking-[-0.02em] font-semibold text-text-primary m-0 mb-3.5">About this property</h3>
            <p className="text-[16px] leading-[1.62] text-text-secondary m-0 max-w-[62ch] whitespace-pre-line">{property.description}</p>
          </Reveal>

          {/* amenities */}
          {property.features && property.features.length > 0 && (
            <>
              <div className="h-px bg-divider mt-11" />
              <Reveal variants={vFade} className="mt-11">
                <h3 className="text-[21px] leading-[1.2] tracking-[-0.02em] font-semibold text-text-primary m-0 mb-3.5">What this place offers</h3>
                <div className="grid grid-cols-2 gap-x-[26px] gap-y-3.5 max-w-[560px] max-[560px]:grid-cols-1">
                  {property.features.map((f) => (
                    <div key={f} className="flex items-center gap-[11px] text-[15.5px] text-text-secondary py-1">
                      <Icon name="check" size={18} className="text-green-dark flex-none" /> {f}
                    </div>
                  ))}
                </div>
              </Reveal>
            </>
          )}

          {/* verified location */}
          <div className="h-px bg-divider mt-11" />
          <Reveal variants={vFade} className="mt-11">
            <h3 className="text-[21px] leading-[1.2] tracking-[-0.02em] font-semibold text-text-primary m-0 mb-3.5">Verified location</h3>
            <p className="text-[16px] leading-[1.62] text-text-secondary m-0 max-w-[62ch] mb-[18px]">
              The exact building has been marked on the map — its coordinates and boundary are recorded with NewCondo.
            </p>
            <div className="relative h-[320px] rounded-[20px] overflow-hidden border border-nc-border bg-[#e7e4d9]">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg,transparent 36%,#f4f2ea 36%,#f4f2ea 40%,transparent 40%),linear-gradient(0deg,transparent 60%,#f4f2ea 60%,#f4f2ea 64%,transparent 64%),#e7e4d9",
                }}
              />
              <div className="absolute left-[43%] top-[42%] w-[15%] h-[20%] rounded-[4px] bg-[rgba(0,180,115,0.26)] border-2 border-green shadow-[0_0_0_6px_rgba(0,180,115,0.08)]" />
              <motion.div
                className="absolute left-[48.2%] top-[30%] text-ink"
                style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3.4, ease: EASE, repeat: Infinity }}
              >
                <Icon name="map-pin" size={30} strokeWidth={2} />
              </motion.div>
              <span className="absolute right-[14px] top-[14px] inline-flex items-center gap-[7px] bg-[rgba(255,255,255,0.92)] px-3 py-[7px] rounded-full text-[12px] font-semibold text-ink shadow-xs">
                <Icon name="circle-check-big" size={15} className="text-green-dark" /> This property
              </span>
              {property.lat != null && property.lng != null && (
                <span className="absolute left-[14px] bottom-[14px] inline-flex items-center gap-2 bg-white px-[13px] py-2 rounded-full font-mono text-[12.5px] text-text-primary shadow-sm">
                  <Icon name="locate-fixed" size={15} className="text-green-dark" />
                  {Math.abs(property.lat).toFixed(4)}° {property.lat >= 0 ? "N" : "S"},{" "}
                  {Math.abs(property.lng).toFixed(4)}° {property.lng >= 0 ? "E" : "W"}
                </span>
              )}
            </div>
          </Reveal>
        </div>

        {/* RIGHT — sticky booking + owner */}
        <aside className="sticky top-24 max-[980px]:static">
          <Reveal variants={vCard} className="bg-surface border border-border-hair rounded-[24px] p-[26px] shadow-card">
            <div className="flex items-baseline gap-2 flex-wrap">
              <b className="text-[30px] font-bold tracking-[-0.03em] text-text-primary">{formatPrice(property.price, property.currency)}</b>
              <span className="text-[15px] text-text-tertiary">/ year</span>
            </div>
            <div
              className={cx(
                "inline-flex items-center gap-2 text-[13px] font-semibold px-[13px] py-[7px] rounded-full mt-3.5",
                property.isAvailable ? "bg-green-wash text-green-dark" : "bg-danger-wash text-danger"
              )}
            >
              {property.isAvailable ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green shadow-[0_0_0_4px_rgba(0,180,115,0.16)]" /> Available now
                </>
              ) : (
                <>Not available</>
              )}
            </div>

            <div className="mt-[22px]">
              {property.isAvailable ? (
                <button type="button" onClick={() => setRenting(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 text-[16px] font-semibold text-cream transition-colors hover:bg-black">
                  Rent this property <Icon name="arrow-right" size={17} strokeWidth={2.2} />
                </button>
              ) : (
                <button
                  disabled
                  className="w-full rounded-full bg-surface-sunken text-text-tertiary py-4 text-[16px] font-semibold cursor-not-allowed"
                >
                  Not available
                </button>
              )}
              <p className="text-[13px] text-text-tertiary text-center mt-3 leading-[1.5]">
                Sign in to pay through NewCondo — never an agent. Your rent is held in escrow until you confirm the property is real and yours.
              </p>
            </div>

            <div className="flex gap-2.5 mt-[18px]">
              <button
                type="button"
                onClick={share}
                className="flex-1 inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-ink bg-surface border border-nc-border rounded-full py-3 cursor-pointer hover:bg-surface-soft active:scale-[0.97] transition-[background,transform] duration-200 ease-nc"
              >
                <Icon name={copied ? "check" : "share-2"} size={17} /> {copied ? "Link copied" : "Share"}
              </button>
              <button
                type="button"
                onClick={() => setSaved((s) => !s)}
                className={cx(
                  "flex-1 inline-flex items-center justify-center gap-2 text-[14px] font-semibold rounded-full py-3 cursor-pointer active:scale-[0.97] transition-[background,transform] duration-200 ease-nc",
                  saved
                    ? "text-danger border border-[rgba(192,57,43,0.3)] bg-danger-wash"
                    : "text-ink bg-surface border border-nc-border hover:bg-surface-soft"
                )}
              >
                <Icon name="heart" size={17} className={saved ? "fill-current" : ""} /> {saved ? "Saved" : "Save"}
              </button>
            </div>

            <div className="flex items-center gap-2 justify-center text-[12.5px] text-text-tertiary mt-5 pt-[18px] border-t border-border-hair">
              <Icon name="shield-check" size={15} className="text-green-dark flex-none" /> Escrow-protected — released to the landlord only after a 24-hour confirmation window.
            </div>
          </Reveal>

          {/* owner */}
          <Reveal variants={vCard} className="mt-[18px] flex items-center gap-[13px] bg-surface border border-border-hair rounded-[20px] p-[18px] shadow-xs">
            <span className="w-[46px] h-[46px] flex-none rounded-full bg-ink text-cream flex items-center justify-center text-[15px] font-bold">{initials}</span>
            <div>
              <div className="text-[12px] text-text-tertiary uppercase tracking-[0.1em] font-semibold">Listed by</div>
              <div className="text-[15.5px] font-semibold text-text-primary flex items-center gap-1.5 mt-[3px]">
                {ownerName} <Icon name="badge-check" size={16} className="text-green-dark" />
              </div>
              <span
                className={cx(
                  "mt-[7px] inline-flex items-center gap-1.5 text-[11.5px] font-bold tracking-[0.05em] uppercase px-[11px] py-[5px] rounded-full",
                  property.isOwnerListing ? "bg-green-wash text-green-dark" : "bg-surface-soft text-text-secondary"
                )}
              >
                <Icon name={property.isOwnerListing ? "home" : "users"} size={13} />
                {property.isOwnerListing ? "Direct from owner" : "Listed by agent"}
              </span>
            </div>
          </Reveal>
        </aside>
      </div>
    </main>
      <AnimatePresence>
        {renting && <RentGate onClose={() => setRenting(false)} signedIn={false}
          property={{ id: (property as SharedProperty & { id?: string }).id ?? shareCode, title: property.title, price: Number(property.price), shareCode,
            units: (property as SharedProperty & { units?: { label: string; status: string; price?: number }[] }).units ?? [{ label: "Main unit", status: property.isAvailable ? "VACANT" : "OCCUPIED" }] }} />}
      </AnimatePresence>
    </>
  );
}
