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
import { CreateListingModal, useLinkedOwners } from "@/components/dashboard/properties/CreateListingModal";
import { InviteAgentModal } from "@/components/dashboard/properties/InviteAgentModal";
import { NCSelect } from "@/components/dashboard/NCSelect";
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
  const [inviteAgent, setInviteAgent] = useState(false);
  const { data, isLoading } = useMyProperties();
  if (isLoading) return (<><PageHead title="My Properties" sub="Loading…" /><SkeletonRows n={4} h={86} /></>);
  const list = data ?? [];
  const shown = list.filter((p) => tab === "all" ? true : tab === "attention" ? ["PENDING_MARKING", "DRAFT"].includes(p.status) : p.status === tab);
  return (
    <>
      <PageHead title="My Properties" sub={`${list.length} properties · ${list.reduce((a, p) => a + p.flats, 0)} flats`}
        actions={<>
          <DBtn variant="line" onClick={() => setInviteAgent(true)}><Icon name="user-plus" size={15} />Invite agent</DBtn>
          <DBtn onClick={() => setCreate(true)}><Icon name="plus" size={15} strokeWidth={2.2} />List a property</DBtn>
        </>} />
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
      <AnimatePresence>
        {create && <CreateListingModal onClose={() => setCreate(false)} />}
        {inviteAgent && <InviteAgentModal key="inv" onClose={() => setInviteAgent(false)} />}
      </AnimatePresence>
    </>
  );
}

function AgentListings() {
  const router = useRouter();
  const [tab, setTab] = usePersistedTab("nc-agent-list-tab", "listings");
  const [create, setCreate] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
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
      {tab === "listings" && (() => {
        // One agent lists for several owners — filter chips per owner.
        const all = listings.data ?? [];
        const owners = Array.from(new Set(all.map((l) => (l as AgentListing & { ownerName?: string }).ownerName ?? "Adaeze Okafor")));
        const shown = ownerFilter === "all" ? all : all.filter((l) => ((l as AgentListing & { ownerName?: string }).ownerName ?? "Adaeze Okafor") === ownerFilter);
        return (<>
          {owners.length > 1 && (
            <div className="mb-3 mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-semibold text-text-tertiary">Owner:</span>
              {["all", ...owners].map((o) => (
                <button key={o} onClick={() => setOwnerFilter(o)}
                  className={o === ownerFilter ? "rounded-full bg-ink px-3.5 py-1.5 text-[12.5px] font-semibold text-cream" : "rounded-full bg-surface-sunken px-3.5 py-1.5 text-[12.5px] font-semibold text-text-secondary transition-colors hover:bg-[#ECE9DE] hover:text-ink"}>
                  {o === "all" ? "All owners" : o}
                </button>
              ))}
            </div>
          )}
          <ListingsCard shown={shown} router={router} cyclePromo={cyclePromo} />
        </>);
      })()}
      {tab === "promos" && (
        <Card tight>
          {(promos.data ?? []).map((pr) => (
            <Row key={pr.id}>
              <Thumb icon="share-2" className="max-sm:hidden" />
              {/* Mobile: text wraps cleanly, copy action gets its own row */}
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
                <div className="min-w-0 flex-1 basis-[200px]">
                  <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{pr.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-text-tertiary">
                    <span className="whitespace-nowrap">Agent: {pr.listingAgent}</span>
                    <span className="whitespace-nowrap">{pr.clicks} clicks</span>
                    <span className="whitespace-nowrap">{pr.conversions} conversion{pr.conversions !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="flex flex-none items-center gap-2.5 max-sm:w-full max-sm:justify-between">
                  {pr.earned > 0 ? <span className="whitespace-nowrap font-mono text-[13px] font-semibold text-green-dark">+{ngn(pr.earned)}</span> : <span />}
                  <PromoCopyBtn link={pr.link} />
                </div>
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

/* Copy button that stays green after the toast clears on mobile (the toast
   covers the button there). */
function PromoCopyBtn({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <DBtn variant={copied ? "green" : "line"} sm onClick={async () => {
      try { await navigator.clipboard.writeText("https://" + link); } catch {}
      setCopied(true);
      toast.success("Promo link copied", { description: "Payments through this link split commission with you automatically." });
      const isMobile = window.matchMedia("(max-width: 640px)").matches;
      setTimeout(() => setCopied(false), isMobile ? 9000 : 1800);
    }}><Icon name={copied ? "check" : "copy"} size={13} strokeWidth={2.2} />{copied ? "Copied" : "Copy link"}</DBtn>
  );
}

/* Mobile-friendly listings rows, shared by the owner-filtered view. */
function ListingsCard({ shown, router, cyclePromo }: { shown: AgentListing[]; router: ReturnType<typeof useRouter>; cyclePromo: (l: AgentListing) => void }) {
  return (
    <Card tight>
      {shown.length === 0 && <EmptyState icon="building-2" title="No listings for this owner" sub="Pick another owner filter, or create a new listing." />}
      {shown.map((l) => (
        <Row key={l.id} onClick={() => router.push(`/properties/${l.id}`)}>
          <Thumb className="max-sm:hidden" />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
            <div className="min-w-0 flex-1 basis-[200px]">
              <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{l.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-text-tertiary">
                <StatusBadge s={l.status} />
                <span className="whitespace-nowrap">Owner: {(l as AgentListing & { ownerName?: string }).ownerName ?? "Adaeze Okafor"}</span>
                <span className="whitespace-nowrap">{l.views} views</span>
                <span className="whitespace-nowrap">{l.viaSubAgent} via {l.subAgents} sub-agents</span>
              </div>
            </div>
            <div className="flex flex-none items-center gap-2.5 max-sm:w-full max-sm:justify-between">
              <span role="button" tabIndex={0} title="Click to change promotion mode"
                onClick={(e) => { e.stopPropagation(); cyclePromo(l); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); cyclePromo(l); } }}
                className="flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full bg-surface-sunken px-2.5 py-1 text-[11.5px] font-semibold text-text-secondary">
                <Icon name="users" size={11} />{l.promoMode === "PUBLIC" ? "Open promo" : l.promoMode === "PERMISSION" ? "By approval" : "Restricted"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="whitespace-nowrap font-mono text-[13px] font-semibold">{ngn(l.price)}</span>
                <Icon name="chevron-right" size={14} className="text-text-tertiary" />
              </span>
            </div>
          </div>
        </Row>
      ))}
    </Card>
  );
}
