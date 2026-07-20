"use client";

/* Browse — Airbnb-style public property grid with search + filters.
   Data: GET /api/v1/properties/browse (publicBrowseService — PUBLISHED +
   marked only, Redis-cached 60s). Renting a vacant flat opens the checkout
   flow (RentCheckoutModal). Cards use image placeholders until real
   photography lands (S3 coverUrl). */
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { useRole } from "@/components/providers/role-provider";
import { PageHead, StatusBadge, EmptyState, SkeletonRows } from "@/components/dashboard/primitives";
import { NCSelect } from "@/components/dashboard/NCSelect";
import { useBrowse } from "@/hooks/dashboard/useDashboardData";
import { RentCheckoutModal } from "@/components/dashboard/browse/RentCheckoutModal";
import { ngn } from "@/lib/dashboard/format";
import type { BrowseListing } from "@/lib/dashboard/data";

const STATES = ["Rivers", "Imo", "Enugu", "Lagos", "FCT"];
const TYPES = ["Flat", "Mini flat", "Self-contain", "Bungalow", "Duplex", "Studio"];
const PRICE_BANDS: [string, number | undefined, number | undefined][] = [["Any price", undefined, undefined], ["Under ₦500k", undefined, 500000], ["₦500k – ₦1m", 500000, 1000000], ["₦1m – ₦2m", 1000000, 2000000], ["Over ₦2m", 2000000, undefined]];

export default function BrowsePage() {
  const { role } = useRole();
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [type, setType] = useState("");
  const [band, setBand] = useState("Any price");
  const [checkout, setCheckout] = useState<BrowseListing | null>(null);
  const [, minPrice, maxPrice] = PRICE_BANDS.find(([l]) => l === band)!;
  const { data, isLoading } = useBrowse({ q: q || undefined, state: state || undefined, type: type || undefined, minPrice, maxPrice });
  const items = data?.items ?? [];
  return (
    <>
      <PageHead title="Browse properties" sub="Every listing is GPS-marked and verified — no random online posts. Payments are escrowed with a 24-hour protection window." />
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Area, neighbourhood or title…"
            className="w-full rounded-full border border-nc-border bg-surface py-3 pl-11 pr-4 text-[14.5px] outline-none transition-shadow placeholder:text-text-tertiary focus:border-ink focus:shadow-[0_0_0_4px_rgba(19,19,19,0.06)]" />
        </div>
        <div className="w-[150px] max-sm:flex-1"><NCSelect value={state} onChange={setState} placeholder="State" options={["", ...STATES].map((s) => s === "" ? { value: "", label: "All states" } : s)} /></div>
        <div className="w-[160px] max-sm:flex-1"><NCSelect value={type} onChange={setType} placeholder="Type" options={["", ...TYPES].map((s) => s === "" ? { value: "", label: "All types" } : s)} /></div>
        <div className="w-[170px] max-sm:flex-1"><NCSelect value={band} onChange={setBand} options={PRICE_BANDS.map(([l]) => l)} /></div>
      </div>
      {isLoading ? <SkeletonRows n={3} h={140} />
      : items.length === 0 ? <EmptyState icon="search" title="No properties match" sub="Try widening the area or price range." />
      : (
        <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-2 max-sm:grid-cols-1">
          {items.map((p) => (
            <div key={p.id} className="group overflow-hidden rounded-[22px] border border-border-hair bg-surface shadow-[0_1px_2px_rgba(19,19,19,0.04)] transition-all duration-200 ease-nc hover:-translate-y-1 hover:shadow-card">
              <div className="relative grid h-[170px] place-items-center overflow-hidden bg-surface-sunken text-text-tertiary">
                {/* Real photography: coverUrl (presigned S3) — placeholder until supplied */}
                {p.coverUrl ? <img src={p.coverUrl} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" /> : <Icon name="building-2" size={30} />}
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm"><Icon name="map-pin" size={11} className="text-green-dark" />GPS-marked</span>
                {p.vacantFlats === 0 && <span className="absolute right-3 top-3"><StatusBadge s="RENTED" /></span>}
              </div>
              <div className="p-4">
                <div className="truncate text-[14.5px] font-semibold tracking-[-0.01em]">{p.title}</div>
                <div className="mt-1 text-[12.5px] text-text-tertiary">{p.area}, {p.state}{p.listingAgent ? ` · Agent: ${p.listingAgent.name}` : " · Listed by owner"}</div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="font-mono text-[14px] font-semibold">{ngn(p.price)}<span className="font-sans text-[12px] font-normal text-text-tertiary">/year</span></div>
                  {p.vacantFlats > 0
                    ? <button onClick={() => setCheckout(p)} className="rounded-full bg-ink px-4 py-2 text-[12.5px] font-semibold text-cream transition-colors hover:bg-black">Rent{p.vacantFlats > 1 ? ` · ${p.vacantFlats} vacant` : ""}</button>
                    : <span className={cx("text-[12px] font-semibold text-text-tertiary")}>Fully rented</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <AnimatePresence>
        {checkout && <RentCheckoutModal key="co" listing={checkout} renter={role === "RENTER"} onClose={() => setCheckout(null)} />}
      </AnimatePresence>
    </>
  );
}
