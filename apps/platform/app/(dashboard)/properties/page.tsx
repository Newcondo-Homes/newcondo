"use client";

/* Properties index — OWNER: My Properties with status tabs;
   AGENT: My Listings + sub-agent promotions. Tabs persist across navigation. */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { toast } from "@newcondo/ui";
import { useRole } from "@/components/providers/role-provider";
import { PageHead, DBtn, StatusBadge, Card, CardH, Row, Thumb, Tabs, EmptyState, SkeletonRows } from "@/components/dashboard/primitives";
import { usePersistedTab } from "@/hooks/dashboard/usePersistedTab";
import { useMyProperties, useAgentListings, usePromotions, useCacheUpdate } from "@/hooks/dashboard/useDashboardData";
import { CreateListingModal } from "@/components/dashboard/properties/CreateListingModal";
import { ngn } from "@/lib/dashboard/format";
import { DUMMY_FLAT_UNITS, type AgentListing, type PromoMode } from "@/lib/dashboard/data";

export function flatSummary(id: string): string | null {
  const u = DUMMY_FLAT_UNITS[id] ?? []; /* TODO(backend): comes with the property payload */
  if (!u.length) return null;
  const c = { OCCUPIED: 0, VACANT: 0, UNDER_CONSTRUCTION: 0 };
  u.forEach((f) => c[f.status]++);
  return [c.OCCUPIED && `${c.OCCUPIED} occupied`, c.VACANT && `${c.VACANT} vacant`, c.UNDER_CONSTRUCTION && `${c.UNDER_CONSTRUCTION} under construction`].filter(Boolean).join(" · ");
}

export default function PropertiesPage() {
  const { role } = useRole();
  return role === "AGENT" ? <AgentListings /> : <OwnerProperties />;
}

function OwnerProperties() {
  const router = useRouter();
  const [tab, setTab] = usePersistedTab("nc-props-tab", "all");
  const [create, setCreate] = useState(false);
  const { data, isLoading } = useMyProperties();
  if (isLoading) return (<><PageHead title="My Properties" sub="Loading…" /><SkeletonRows n={4} h={86} /></>);
  const list = data ?? [];
  const shown = list.filter((p) => tab === "all" ? true : tab === "attention" ? ["PENDING_MARKING", "DRAFT"].includes(p.status) : p.status === tab);
  return (
    <>
      <PageHead title="My Properties" sub={`${list.length} properties · ${list.reduce((a, p) => a + p.flats, 0)} flats`}
        actions={<DBtn onClick={() => setCreate(true)}><Icon name="plus" size={15} strokeWidth={2.2} />List a property</DBtn>} />
      <Tabs value={tab} onChange={setTab} items={[
        ["all", "All", list.length],
        ["PUBLISHED", "Live", list.filter((p) => p.status === "PUBLISHED").length],
        ["RENTED", "Rented", list.filter((p) => p.status === "RENTED").length],
        ["attention", "Needs action", list.filter((p) => ["PENDING_MARKING", "DRAFT"].includes(p.status)).length],
      ]} />
      <Card tight>
        {shown.length === 0 && <EmptyState icon="building-2" title="Nothing here" sub="No properties match this filter yet." />}
        {shown.map((p) => (
          <Row key={p.id} onClick={() => router.push(`/properties/${p.id}`)}>
            <Thumb />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{p.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-text-tertiary">
                <StatusBadge s={p.status} />
                {p.marked && <StatusBadge s="VERIFIED"><Icon name="map-pin" size={11} />Marked</StatusBadge>}
                <span>{p.location}</span>
              </div>
            </div>
            <div className="flex-none text-right">
              <div className="whitespace-nowrap font-mono text-[13px] font-semibold">{ngn(p.price)}<span className="font-normal text-text-tertiary">/{p.per}</span></div>
              <div className="mt-1 text-[12px] text-text-tertiary">{flatSummary(p.id) ?? `${p.flatsRented}/${p.flats} flats rented`}</div>
            </div>
            <Icon name="chevron-right" size={15} className="text-text-tertiary" />
          </Row>
        ))}
      </Card>
      <AnimatePresence>{create && <CreateListingModal onClose={() => setCreate(false)} />}</AnimatePresence>
    </>
  );
}

function AgentListings() {
  const router = useRouter();
  const [tab, setTab] = usePersistedTab("nc-agent-list-tab", "listings");
  const [create, setCreate] = useState(false);
  const listings = useAgentListings();
  const promos = usePromotions();
  const cache = useCacheUpdate();
  if (listings.isLoading || promos.isLoading) return (<><PageHead title="My Listings" sub="Loading…" /><SkeletonRows n={4} h={86} /></>);
  const NEXT: Record<PromoMode, PromoMode> = { PUBLIC: "PERMISSION", PERMISSION: "RESTRICTED", RESTRICTED: "PUBLIC" };
  const cyclePromo = (l: AgentListing) => {
    const next = NEXT[l.promoMode];
    /* TODO(backend): PATCH /api/properties/:id/promotion { mode } */
    cache.update<AgentListing[]>(["agent", "listings"], (xs) => xs.map((x) => (x.id === l.id ? { ...x, promoMode: next } : x)));
    toast.success("Promotion setting updated", { description: `${l.title} → ${next === "PUBLIC" ? "open to all sub-agents" : next === "PERMISSION" ? "sub-agents need your approval" : "promotion restricted"}` });
  };
  return (
    <>
      <PageHead title="My Listings" sub="You are the sole listing agent on these properties — enforced by the platform."
        actions={<DBtn onClick={() => setCreate(true)}><Icon name="plus" size={15} strokeWidth={2.2} />New listing</DBtn>} />
      <Tabs value={tab} onChange={setTab} items={[["listings", "My listings", (listings.data ?? []).length], ["promos", "Promoting as sub-agent", (promos.data ?? []).length]]} />
      {tab === "listings" && (
        <Card tight>
          {(listings.data ?? []).map((l) => (
            <Row key={l.id} onClick={() => router.push(`/properties/${l.id}`)}>
              <Thumb />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{l.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-text-tertiary">
                  <StatusBadge s={l.status} /><span>{l.views} views · {l.viaSubAgent} via {l.subAgents} sub-agents</span>
                </div>
              </div>
              <div className="flex flex-none items-center gap-2.5">
                <span role="button" tabIndex={0} title="Click to change promotion mode"
                  onClick={(e) => { e.stopPropagation(); cyclePromo(l); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); cyclePromo(l); } }}
                  className="flex cursor-pointer items-center gap-1 rounded-full bg-surface-sunken px-2.5 py-1 text-[11.5px] font-semibold text-text-secondary">
                  <Icon name="users" size={11} />{l.promoMode === "PUBLIC" ? "Open promo" : l.promoMode === "PERMISSION" ? "By approval" : "Restricted"}
                </span>
                <span className="font-mono text-[13px] font-semibold">{ngn(l.price)}</span>
                <Icon name="chevron-right" size={14} className="text-text-tertiary" />
              </div>
            </Row>
          ))}
        </Card>
      )}
      {tab === "promos" && (
        <Card tight>
          {(promos.data ?? []).map((pr) => (
            <Row key={pr.id}>
              <Thumb icon="share-2" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{pr.title}</div>
                <div className="mt-1 text-[12.5px] text-text-tertiary">Listing agent: {pr.listingAgent} · {pr.clicks} clicks · {pr.conversions} conversion{pr.conversions !== 1 ? "s" : ""}</div>
              </div>
              <div className="flex flex-none items-center gap-2.5">
                {pr.earned > 0 && <span className="font-mono text-[13px] font-semibold text-green-dark">+{ngn(pr.earned)}</span>}
                <DBtn variant="line" sm onClick={async () => {
                  try { await navigator.clipboard.writeText("https://" + pr.link); } catch {}
                  toast.success("Promo link copied", { description: "Payments through this link split commission with you automatically." });
                }}><Icon name="copy" size={13} />Copy link</DBtn>
              </div>
            </Row>
          ))}
          <div className="border-t border-border-hair px-4 py-3.5 text-[12.5px] text-text-tertiary">
            Tap <b className="text-text-primary">Promote</b> on any listed property in Browse to add it here. If a renter pays through your link, you and the listing agent split 50% of the 20% platform commission — automatically.
          </div>
        </Card>
      )}
      <AnimatePresence>{create && <CreateListingModal agent onClose={() => setCreate(false)} />}</AnimatePresence>
    </>
  );
}
