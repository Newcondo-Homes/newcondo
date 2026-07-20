"use client";

/* Property detail — shared by OWNER (their properties) and AGENT (their
   listings, full edit rights with owner consent on file). Boundary map,
   performance chart, flats breakdown, photos, share / take down / edit.
   Back uses router.back() so the user returns to wherever they came from. */
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { toast } from "@newcondo/ui";
import { useRole } from "@/components/providers/role-provider";
import { PageHead, DBtn, StatusBadge, Card, CardH, Row, Thumb, KV, Banner, EmptyState, SkeletonRows, MapPlaceholder, PhotoGrid, CopyField } from "@/components/dashboard/primitives";
import { Modal } from "@/components/dashboard/Modal";
import { LineChart, BarChart } from "@/components/dashboard/charts";
import { flatSummary } from "../page";
import { EditPropertyModal, type EditPayload } from "@/components/dashboard/properties/EditPropertyModal";
import { TenantsCard } from "@/components/dashboard/properties/Tenants";
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
  const [modal, setModal] = useState<null | "share" | "delist" | "edit">(null);
  const loading = isAgent ? agent.isLoading : owner.isLoading;
  const p: (Property | AgentListing) | undefined = isAgent ? (agent.data ?? []).find((x) => x.id === id) : (owner.data ?? []).find((x) => x.id === id);
  if (loading) return <SkeletonRows n={3} h={140} />;
  if (!p) return <EmptyState icon="building-2" title="Property not found" sub="It may have been removed." action={<DBtn variant="line" onClick={() => router.push("/properties")}>Back to properties</DBtn>} />;
  const a = p as AgentListing, o = p as Property;
  const updateList = (fn: <T extends Property | AgentListing>(xs: T[]) => T[]) => {
    if (isAgent) cache.update<AgentListing[]>(["agent", "listings"], fn); else cache.update<Property[]>(["properties", "mine"], fn);
  };
  const delist = () => {
    /* TODO(backend): PATCH /api/properties/:id { status:'UNAVAILABLE' } */
    updateList((xs) => xs.map((x) => (x.id === id ? { ...x, status: "UNAVAILABLE" as const } : x)));
    toast.success("Listing taken down", { description: `${p.title} is no longer visible to renters.` });
  };
  const onSave = (f: EditPayload) => {
    /* TODO(backend): PATCH /api/properties/:id + /flats — then invalidate ["flats", id] */
    cache.update(["flats", id], () => f.units);
    updateList((xs) => xs.map((x) => (x.id === id ? { ...x, title: f.title, price: f.price } : x)));
  };
  const onDelete = () => {
    /* TODO(backend): DELETE /api/properties/:id — soft delete; marking record stays */
    updateList((xs) => xs.filter((x) => x.id !== id));
    toast.success("Listing deleted", { description: isAgent ? `${p.title} removed. The owner (${a.owner}) has been notified.` : `${p.title} removed. The GPS marking stays on record.` });
    router.push("/properties");
  };
  return (
    <>
      <PageHead back="HISTORY" title={p.title} sub={`${p.location}, ${p.state}`}
        actions={<>
          <DBtn variant="line" onClick={() => setModal("share")}><Icon name="share-2" size={15} />Share</DBtn>
          {p.status === "PUBLISHED" && <DBtn variant="line" className="!text-danger" onClick={() => setModal("delist")}>Take down</DBtn>}
          {p.status === "PENDING_MARKING" && <DBtn onClick={() => router.push("/marking")}><Icon name="map-pin" size={15} />Mark this property</DBtn>}
        </>} />
      <div className="grid grid-cols-[1.6fr_1fr] gap-4 max-[860px]:grid-cols-1">
        <div className="flex flex-col gap-4">
          <Card>
            <CardH title="Boundary & location" right={p.marked ? <StatusBadge s="VERIFIED">GPS-marked</StatusBadge> : <StatusBadge s="PENDING_MARKING" />} />
            <MapPlaceholder h={230} marked={!p.marked} tag={p.marked ? "Boundary verified — cannot be double-listed" : "Not yet marked"} />
            {!p.marked && (
              <div className="mt-3">
                <Banner tone="warn" icon="triangle-alert" action={<DBtn sm onClick={() => router.push("/marking")}>Start</DBtn>}>
                  <b className="font-semibold">Marking required before this listing can go live.</b>
                  <div className="mt-0.5 text-[12.5px]">Mark it yourself on the map, or pay ₦20,000 to have a nearby verified agent mark it.</div>
                </Banner>
              </div>
            )}
          </Card>
          <Card>
            <CardH title="Performance" right={<span className="text-[12px] text-text-tertiary">views · last 7 days</span>} />
            {p.views > 0 && charts.data ? <BarChart series={charts.data.views} h={130} /> : <EmptyState icon="eye" title="No views yet" sub="Performance data appears once the listing is live." />}
          </Card>
        </div>
        <div className="flex flex-col gap-4">
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
          <TenantsCard propertyId={id} propertyTitle={p.title} flats={flats.data ?? []} />
          <Card>
            <CardH title="Photos" right={<span className="text-[12px] text-text-tertiary">{p.marked ? "6 from marking · 2 yours" : "none yet"}</span>} />
            <PhotoGrid n={6} h={64} />
            <div className="mt-3">
              <DBtn variant="line" sm className="w-full" onClick={() => toast.info("Photo upload", { description: "AWS S3 presigned upload — shared/utils/s3Upload.ts · POST /properties/:id/images/presign" })}>
                <Icon name="camera" size={14} />Upload photos
              </DBtn>
            </div>
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
      </AnimatePresence>
    </>
  );
}
