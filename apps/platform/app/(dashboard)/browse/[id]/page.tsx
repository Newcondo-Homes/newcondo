"use client";

/* Browse property detail — full-page view a renter lands on when they tap
   a house in Browse (mirrors how owners open My Properties → detail).
   Shows: gallery placeholders, verified/GPS-marked badges, price, whether
   the house is multifamily (per-unit availability) or a single flat,
   amenities, location map, lister info, and the rent CTA → RentGate
   (account check → BVN/VA → Flutterwave escrow checkout with the
   double-booking lock server-side).
   Live: property from GET /properties/browse cache or GET /share resolution. */
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { useRole } from "@/components/providers/role-provider";
import { PageHead, DBtn, StatusBadge, Card, CardH, KV, Banner, MapPlaceholder, SkeletonRows } from "@/components/dashboard/primitives";
import { RentGate } from "@/components/share/rent-gate";
import { useBrowse } from "@/hooks/dashboard/useDashboardData";
import { ngn } from "@/lib/dashboard/format";
import { AMENITIES } from "@/lib/constants/business";

export default function BrowseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { role } = useRole();
  const { data, isLoading } = useBrowse({}); // cache hit — grid already loaded it
  const [renting, setRenting] = useState(false);
  if (isLoading) return <SkeletonRows n={3} h={160} />;
  const p = (data?.items ?? []).find((x) => x.id === id);
  if (!p) return (
    <div className="py-16 text-center">
      <p className="text-[15px] font-semibold">This listing is no longer available.</p>
      <DBtn className="mt-4" onClick={() => router.push("/browse")}>Back to Browse</DBtn>
    </div>
  );
  const multifamily = p.flats.length > 1;
  const vacant = p.flats.filter((f) => f.status === "VACANT");
  return (
    <>
      <PageHead back="/browse" title={p.title} sub={`${p.area}, ${p.state} · listed by ${p.listingAgent ? `agent ${p.listingAgent.name}` : "the owner"}`}
        actions={vacant.length > 0
          ? <DBtn onClick={() => setRenting(true)}><Icon name="key-round" size={15} />Rent this property</DBtn>
          : <StatusBadge s="RENTED">Fully rented</StatusBadge>} />
      <div className="grid grid-cols-[1.6fr_1fr] gap-4 max-[860px]:grid-cols-1">
        <div className="flex flex-col gap-4">
          <Card>
            {/* Real photography lands here (S3 coverUrl + gallery) */}
            <div className="grid h-[300px] grid-cols-3 grid-rows-2 gap-2 max-sm:h-[220px]">
              <div className="col-span-2 row-span-2 grid place-items-center rounded-2xl bg-surface-sunken text-text-tertiary">{p.coverUrl ? <img src={p.coverUrl} alt="" className="size-full rounded-2xl object-cover" /> : <Icon name="building-2" size={34} />}</div>
              {[0, 1].map((i) => <div key={i} className="grid place-items-center rounded-2xl bg-surface-sunken text-text-tertiary"><Icon name="camera" size={20} /></div>)}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-wash px-2.5 py-1 text-[11.5px] font-semibold text-green-dark"><Icon name="map-pin" size={11} />GPS-marked boundary</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-wash px-2.5 py-1 text-[11.5px] font-semibold text-green-dark"><Icon name="shield-check" size={11} />Verified lister</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2.5 py-1 text-[11.5px] font-semibold text-text-secondary"><Icon name="lock" size={11} />Escrow-protected payment</span>
            </div>
          </Card>
          <Card tight>
            <CardH pad title={multifamily ? "Flats in this building" : "The unit"} right={<span className="text-[12px] text-text-tertiary">{multifamily ? `multifamily · ${vacant.length} of ${p.flats.length} vacant` : "single unit"}</span>} />
            {p.flats.map((f) => (
              <div key={f.label} className="flex items-center gap-3 border-b border-border-hair px-4 py-3 last:border-b-0">
                <span className="grid size-10 flex-none place-items-center rounded-xl bg-surface-sunken text-ink"><Icon name="home" size={16} /></span>
                <span className="flex-1 text-[14px] font-semibold">{f.label}</span>
                <span className="font-mono text-[12.5px] text-text-secondary">{ngn(p.price)}/yr</span>
                <StatusBadge s={f.status} />
              </div>
            ))}
            {vacant.length > 0 && <div className="border-t border-border-hair px-4 py-3 text-[12px] text-text-tertiary">Paying locks your chosen flat instantly — no one else can pay for it while your 24-hour window runs.</div>}
          </Card>
          <Card>
            <CardH title="Location" right={<span className="text-[12px] text-text-tertiary">{p.area}, {p.state}</span>} />
            <MapPlaceholder h={200} tag="Boundary verified — cannot be double-listed" />
          </Card>
        </div>
        <div className="flex flex-col gap-4 self-start">
          <Card>
            <div className="font-mono text-[26px] font-semibold tracking-[-0.02em]">{ngn(p.price)}<span className="font-sans text-[13px] font-normal text-text-tertiary">/year</span></div>
            <div className="mt-1 text-[12.5px] text-text-tertiary">+ {ngn(Math.round(p.price * 0.02))} Newcondo service fee (2%)</div>
            {vacant.length > 0 ? (
              <DBtn className="mt-4 w-full" onClick={() => setRenting(true)}><Icon name="key-round" size={15} />Rent{multifamily ? ` — ${vacant.length} flat${vacant.length > 1 ? "s" : ""} vacant` : " this property"}</DBtn>
            ) : (
              <div className="mt-4"><Banner icon="info">Fully rented right now. Save it — you&rsquo;ll be notified when a flat opens up.</Banner></div>
            )}
            <div className="mt-3 text-[11.5px] leading-relaxed text-text-tertiary">Never pay an agent outside Newcondo — protection only covers payments made in-app.</div>
          </Card>
          <Card>
            <CardH title="Details" />
            <KV k="Type" v={p.propertyType} />
            <KV k="Structure" v={multifamily ? `Multifamily · ${p.flats.length} flats` : "Single unit"} />
            <KV k="Listed by" v={p.listingAgent ? `Agent — ${p.listingAgent.name}` : "Property owner"} />
            <KV k="Marking" v="GPS-verified boundary" />
            <KV k="Escrow window" v="24 hours after payment" />
          </Card>
          <Card>
            <CardH title="Amenities" />
            <div className="flex flex-wrap gap-1.5">
              {AMENITIES.slice(0, 8).map((a) => <span key={a} className="rounded-full bg-surface-sunken px-2.5 py-1 text-[11.5px] font-medium text-text-secondary">{a}</span>)}
            </div>
          </Card>
        </div>
      </div>
      <AnimatePresence>
        {renting && <RentGate onClose={() => setRenting(false)} signedIn={role === "RENTER"}
          property={{ id: p.id, title: p.title, price: p.price, shareCode: "", units: p.flats.map((f) => ({ label: f.label, status: f.status, price: p.price })) }} />}
      </AnimatePresence>
    </>
  );
}
