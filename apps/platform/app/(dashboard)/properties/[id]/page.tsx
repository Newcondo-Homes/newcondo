"use client";

/* Property detail — shared by OWNER (their properties) and AGENT (their
   listings, full edit rights with owner consent on file). Boundary map,
   performance chart, flats breakdown, photos, share / take down / edit.
   Back uses router.back() so the user returns to wherever they came from.

   OWNERSHIP GATE: marking, sharing and tenant invites all put this property
   in front of other people, so each is blocked until an ownership document
   is on file. The check runs here for the UI (buttons read as locked rather
   than failing on tap) AND server-side in assertOwnershipProof() — the
   client check is courtesy, the server one is the rule. */
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { toast } from "@newcondo/ui";
import { useRole } from "@/components/providers/role-provider";
import { PageHead, DBtn, StatusBadge, Card, CardH, Row, Thumb, KV, Banner, EmptyState, SkeletonRows, MapPlaceholder, CopyField } from "@/components/dashboard/primitives";
import { Modal } from "@/components/dashboard/Modal";
import { BarChart } from "@/components/dashboard/charts";
import { flatSummary } from "../page";
import { EditPropertyModal, type EditPayload } from "@/components/dashboard/properties/EditPropertyModal";
import { TenantsCard } from "@/components/dashboard/properties/Tenants";
import { SubAgentRequestsCard } from "@/components/dashboard/properties/SubAgentRequests";
import { PropertyPhotos } from "@/components/dashboard/properties/PropertyPhotos";
import { ProofOfOwnershipSection, useOwnershipGate, OwnershipRequiredModal } from "@/components/dashboard/properties/ProofOfOwnership";
import { DeletePropertyModal } from "@/components/dashboard/properties/DeletePropertyModal";
import { useMyProperties, useAgentListings, useFlatUnits, useCharts, useCacheUpdate } from "@/hooks/dashboard/useDashboardData";
import { ngn } from "@/lib/dashboard/format";
import type { AgentListing, Property } from "@/lib/dashboard/data";

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { role } = useRole();
  const isAgent = role === "AGENT";
  const owner = useMyProperties();
  const agent = useAgentListings();
  const flats = useFlatUnits(id);
  const charts = useCharts();
  const cache = useCacheUpdate();
  const [modal, setModal] = useState<null | "share" | "delist" | "edit" | "delete">(null);
  // Which gated action the user attempted without a document, if any.
  const [blocked, setBlocked] = useState<null | "mark" | "share" | "invite a tenant">(null);
  const { hasProof } = useOwnershipGate(id);
  const loading = isAgent ? agent.isLoading : owner.isLoading;
  const p: (Property | AgentListing) | undefined = isAgent ? (agent.data ?? []).find((x) => x.id === id) : (owner.data ?? []).find((x) => x.id === id);
  if (loading) return <SkeletonRows n={3} h={140} />;
  if (!p) return <EmptyState icon="building-2" title="Property not found" sub="It may have been removed." action={<DBtn variant="line" onClick={() => router.push("/properties")}>Back to properties</DBtn>} />;
  const a = p as AgentListing, o = p as Property;

  /* One helper for every gated action — keeps the rule in a single place
     instead of three near-identical guards that can drift apart. */
  const gated = (action: "mark" | "share" | "invite a tenant", run: () => void) => () => {
    if (!hasProof) { setBlocked(action); return; }
    run();
  };

  const updateList = (fn: <T extends Property | AgentListing>(xs: T[]) => T[]) => {
    if (isAgent) cache.update<AgentListing[]>(["agent", "listings"], fn); else cache.update<Property[]>(["properties", "mine"], fn);
  };
  const delist = () => {
    /* TODO(backend): PATCH /api/v1/properties/:id { status:'UNAVAILABLE' } */
    updateList((xs) => xs.map((x) => (x.id === id ? { ...x, status: "UNAVAILABLE" as const } : x)));
    toast.success("Listing taken down", { description: `${p.title} is no longer visible to renters.` });
  };
  const onSave = (f: EditPayload) => {
    /* TODO(backend): PATCH /api/v1/properties/:id + /flats — then invalidate ["flats", id] */
    cache.update(["flats", id], () => f.units);
    updateList((xs) => xs.map((x) => (x.id === id ? { ...x, title: f.title, price: f.price } : x)));
  };
  const onDelete = () => {
    // EditPropertyModal's "Delete listing" hands off to the real dialog, which
    // knows the owner/agent rules and the tenancy + payment guards.
    setModal("delete");
  };

  return (
    <>
      <PageHead back="HISTORY" title={p.title} sub={`${p.location}, ${p.state}`}
        actions={<>
          <DBtn variant="line" onClick={gated("share", () => setModal("share"))}>
            <Icon name={hasProof ? "share-2" : "lock"} size={15} />Share
          </DBtn>
          {p.status === "PUBLISHED" && <DBtn variant="line" className="!text-danger" onClick={() => setModal("delist")}>Take down</DBtn>}
          {p.status === "PENDING_MARKING" && (
            <DBtn onClick={gated("mark", () => router.push("/marking"))}>
              <Icon name={hasProof ? "map-pin" : "lock"} size={15} />Mark this property
            </DBtn>
          )}
        </>} />
      <div className="grid grid-cols-[1.6fr_1fr] gap-4 max-[860px]:grid-cols-1">
        <div className="flex flex-col gap-4">
          <Card>
            <CardH title="Boundary & location" right={p.marked ? <StatusBadge s="VERIFIED">GPS-marked</StatusBadge> : <StatusBadge s="PENDING_MARKING" />} />
            <MapPlaceholder h={230} marked={!p.marked} tag={p.marked ? "Boundary verified — cannot be double-listed" : "Not yet marked"} />
            {!p.marked && (
              <div className="mt-3">
                <Banner tone="warn" icon="triangle-alert" action={<DBtn sm onClick={gated("mark", () => router.push("/marking"))}>Start</DBtn>}>
                  <b className="font-semibold">Marking required before this listing can go live.</b>
                  <div className="mt-0.5 text-[12.5px]">
                    {hasProof
                      ? "Mark it yourself on the map, or pay ₦20,000 to have a nearby verified agent mark it."
                      : "Upload proof of ownership first — marking is locked until this property is documented."}
                  </div>
                </Banner>
              </div>
            )}
          </Card>
          <Card>
            <CardH title="Performance" right={<span className="text-[12px] text-text-tertiary">views · last 7 days</span>} />
            {p.views > 0 && charts.data ? <BarChart series={charts.data.views} h={130} /> : <EmptyState icon="eye" title="No views yet" sub="Performance data appears once the listing is live." />}
          </Card>

          {/* Real S3 gallery: system file picker, capped count, tap-to-view
              lightbox, permanent delete. */}
          <Card>
            <CardH title="Photos" right={<span className="text-[12px] text-text-tertiary">up to 20 · tap to view</span>} />
            <PropertyPhotos propertyId={id} cols={4} max={20} />
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          {/* Sits at the top of the sidebar on purpose: until this is filled
              the property can't be marked, shared or tenanted, so it's the
              most consequential thing on the page. */}
          <ProofOfOwnershipSection propertyId={id} />

          <Card>
            <CardH title="Details" right={<button className="flex items-center gap-1 text-[13px] font-semibold text-green-dark hover:text-ink" onClick={() => setModal("edit")}><Icon name="settings" size={13} />Edit</button>} />
            <KV k="Rent" v={`${ngn(p.price)}/${p.per}`} mono />
            {isAgent ? (<>
              <KV k="Owner" v={`${a.owner} · consent on file`} />
              <KV k="Promotion" v={<StatusBadge s={a.promoMode} />} />
              <KV k="Sub-agents" v={`${a.subAgents} · ${a.viaSubAgent} views via links`} />
            </>) : (
              <KV k="Listed by" v={o.listedBy === "agent" ? `Agent — ${o.agent}` : "You"} />
            )}
            <KV k="Status" v={<StatusBadge s={p.status} />} />
            <KV k="Inquiries" v={p.inquiries} />
          </Card>
          <Card tight>
            <CardH pad title="Flats" right={<span className="text-[12px] text-text-tertiary">{flatSummary(id)}</span>} />
            {(flats.data ?? []).map((f) => (
              <Row key={f.n}>
                <Thumb size={44} icon={f.status === "UNDER_CONSTRUCTION" ? "hammer" : "home"} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold">{f.n}</div>
                  <div className="mt-0.5 text-[12.5px] text-text-tertiary">{f.status === "OCCUPIED" ? `${f.renter} · till ${f.till}` : f.status === "VACANT" ? "Ready to rent" : f.note ?? "Not available for rent yet"}</div>
                </div>
                <StatusBadge s={f.status} />
              </Row>
            ))}
          </Card>
          {/* canInvite gates the invite affordances inside the card. */}
          <TenantsCard propertyId={id} propertyTitle={p.title} flats={flats.data ?? []}
            canInvite={hasProof} onBlockedInvite={() => setBlocked("invite a tenant")} />
          <SubAgentRequestsCard propertyId={id} title="Sub-agent requests on this property" />

          {/* Danger zone — last in the sidebar, where destructive actions
              belong. The label differs by role because the ACTION differs:
              an agent can only detach themselves; the property is the
              owner's to destroy. */}
          <Card>
            <CardH title={isAgent ? "Leave this listing" : "Danger zone"} />
            <p className="m-0 mb-3 text-[12.5px] leading-normal text-text-tertiary">
              {isAgent
                ? "Step down as listing agent. The property, its marking and its tenants stay with the owner."
                : "Permanently delete this property, its flats and its photos. Blocked while there's an active tenancy or payment history."}
            </p>
            <DBtn variant="line" sm className="w-full !text-danger" onClick={() => setModal("delete")}>
              <Icon name={isAgent ? "user-minus" : "trash-2"} size={14} />
              {isAgent ? "Remove me as listing agent" : "Delete this property"}
            </DBtn>
          </Card>
        </div>
      </div>
      <AnimatePresence>
        {modal === "share" && (
          <Modal key="share" title="Share this property" sub="Anyone with the link sees the public listing. Payments still go through escrow." onClose={() => setModal(null)}>
            <CopyField value={`newcondo.homes/share/${id}-a8k2`} />
          </Modal>
        )}
        {modal === "delist" && (
          <Modal key="delist" title="Take down this listing?" onClose={() => setModal(null)}
            footer={<>
              <DBtn variant="line" onClick={() => setModal(null)}>Cancel</DBtn>
              <DBtn variant="danger" onClick={() => { delist(); setModal(null); }}>Take down</DBtn>
            </>}>
            <p className="m-0 text-[14px] leading-relaxed text-text-secondary">{p.title} will stop appearing in search and all promo links will be paused. You can re-publish it anytime — the marking stays valid.</p>
          </Modal>
        )}
        {modal === "edit" && (
          <EditPropertyModal key="edit" propTitle={p.title} propPrice={p.price} units={flats.data ?? []} agentOwner={isAgent ? a.owner : undefined}
            onSave={onSave} onDelete={onDelete} onClose={() => setModal(null)} />
        )}
        {modal === "delete" && (
          <DeletePropertyModal key="delete" propertyId={id} title={p.title} isAgent={isAgent} onClose={() => setModal(null)} />
        )}
        {blocked && (
          <OwnershipRequiredModal
            key="proof"
            action={blocked}
            onClose={() => setBlocked(null)}
            onUpload={() => {
              setBlocked(null);
              toast.info("Proof of ownership", { description: "Use the “Proof of ownership” card on this page to upload the document." });
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
