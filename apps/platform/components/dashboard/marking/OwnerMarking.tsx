"use client";

/* Owner marking — active confirmations (72h window), request wizard, history
   with per-job detail modal.
   Business rules: broadcast ₦20,000 / Newcondo agent ₦25,000; marker earns 25%
   (₦1,000 held on completion, balance on owner confirmation). */
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { toast } from "@newcondo/ui";
import { PageHead, DBtn, StatusBadge, Card, CardH, Row, Thumb, Banner, Countdown, MapPlaceholder, PhotoGrid, SkeletonRows, KV } from "@/components/dashboard/primitives";
import { Modal, ConfirmDialog } from "@/components/dashboard/Modal";
import { useOwnerMarkingJobs, useCacheUpdate } from "@/hooks/dashboard/useDashboardData";
import { RequestMarkingModal } from "./RequestMarkingModal";
import { ngn } from "@/lib/dashboard/format";
import type { MarkingJob } from "@/lib/dashboard/data";

const METHOD: Record<string, string> = { SELF: "Self-marked on the map", KNOWN_PERSON: "Marked via shared link", BROADCAST: "Agent broadcast (FCFS queue)", NEWCONDO: "Newcondo-managed agent" };

export function OwnerMarking() {
  const { data, isLoading } = useOwnerMarkingJobs();
  const cache = useCacheUpdate();
  const [modal, setModal] = useState<null | "request" | { detail: MarkingJob } | { dispute: MarkingJob }>(null);
  if (isLoading) return (<><PageHead title="Marking Jobs" sub="Loading…" /><SkeletonRows n={3} h={100} /></>);
  const jobs = data ?? [];
  const active = jobs.filter((j) => j.status !== "COMPLETED");
  const done = jobs.filter((j) => j.status === "COMPLETED");
  const confirmJob = (job: MarkingJob) => {
    /* TODO(backend): POST /api/marking-jobs/:id/confirm — releases the remaining
       ₦4,000 to the marker, closes the queue, flips property to PENDING_REVIEW */
    cache.update<MarkingJob[]>(["marking", "owner"], (l) => l.map((j) => (j.id === job.id ? { ...j, status: "COMPLETED" } : j)));
    toast.promise(new Promise((res) => setTimeout(res, 1300)), {
      loading: "Confirming marking…",
      success: `Marking confirmed — ${ngn(4000)} released to ${job.marker}. The boundary is locked to your property.`,
      error: "Could not confirm",
    });
  };
  return (
    <>
      <PageHead title="Marking Jobs" sub="Every property must be GPS-marked before it can be listed. Mark it yourself, or pay to have it marked."
        actions={<DBtn onClick={() => setModal("request")}><Icon name="map-pin" size={15} />Request marking</DBtn>} />
      {active.map((j) => (
        <Card key={j.id} className="mb-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="m-0 flex flex-wrap items-center gap-2.5 text-[16.5px] font-bold tracking-[-0.02em]">{j.property}<StatusBadge s={j.status} /></h3>
            {j.status === "AWAITING_CONFIRMATION" && <Countdown hoursLeft={j.confirmDeadlineH} label="to confirm" />}
          </div>
          {j.status === "AWAITING_CONFIRMATION" && (<>
            <div className="mb-3.5">
              <Banner tone="warn" icon="triangle-alert">
                <b className="font-semibold">{j.marker} ({j.markerRating} ★) marked this property {j.markedAt.toLowerCase()}.</b>
                <div className="mt-0.5 text-[12.5px]">Review the boundary and photos. If you miss the 72-hour window, the marker starts receiving drip payouts from the fee automatically.</div>
              </Banner>
            </div>
            <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
              <MapPlaceholder h={170} tag="Boundary drawn by marker" />
              <div>
                <div className="mb-2 text-[13px] font-semibold">{j.photos} verification photos</div>
                <PhotoGrid n={6} h={56} />
                <div className="mt-3.5 flex gap-2.5 max-sm:flex-col">
                  <DBtn variant="line" onClick={() => setModal({ dispute: j })}>Dispute</DBtn>
                  <DBtn variant="green" className="flex-1" onClick={() => confirmJob(j)}><Icon name="check" size={15} strokeWidth={2.2} />Confirm — this is my property</DBtn>
                </div>
              </div>
            </div>
          </>)}
        </Card>
      ))}
      <Card tight>
        <CardH pad title="History" right={<span className="text-[12px] text-text-tertiary">tap any job for details</span>} />
        {done.map((j) => (
          <Row key={j.id} onClick={() => setModal({ detail: j })}>
            <Thumb icon="map-pin" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{j.property}</div>
              <div className="mt-1 text-[12.5px] text-text-tertiary">Marked by {j.marker} · {j.markedAt} · {j.photos} photos</div>
            </div>
            <div className="flex flex-none items-center gap-2.5">
              {j.fee > 0 && <span className="font-mono text-[13px] font-semibold">{ngn(j.fee)}</span>}
              <StatusBadge s="COMPLETED" /><Icon name="chevron-right" size={14} className="text-text-tertiary" />
            </div>
          </Row>
        ))}
      </Card>
      <AnimatePresence>
        {modal === "request" && <RequestMarkingModal key="req" onClose={() => setModal(null)} />}
        {modal && typeof modal === "object" && "detail" in modal && (
          <Modal key="detail" title={modal.detail.property} sub={`Marking job · ${modal.detail.markedAt}`} onClose={() => setModal(null)}
            footer={<DBtn variant="line" onClick={() => setModal(null)}>Close</DBtn>}>
            <MapPlaceholder h={150} tag="Verified boundary — locked to this property" />
            <div className="mt-3">
              <KV k="Status" v={<StatusBadge s={modal.detail.status} />} />
              <KV k="Marked by" v={`${modal.detail.marker}${modal.detail.markerRating ? ` · ${modal.detail.markerRating} ★` : ""}`} />
              <KV k="Method" v={METHOD[modal.detail.method] ?? modal.detail.method} />
              <KV k="Fee" v={modal.detail.fee > 0 ? ngn(modal.detail.fee) : "Free"} mono />
              <KV k="Reference" v={`NC-MK-${modal.detail.id.toUpperCase()}`} mono />
            </div>
            <div className="mb-2 mt-3.5 text-[13px] font-semibold">{modal.detail.photos} verification photos</div>
            <PhotoGrid n={Math.min(modal.detail.photos, 6)} h={58} />
          </Modal>
        )}
        {modal && typeof modal === "object" && "dispute" in modal && (
          <ConfirmDialog key="dispute" danger title="Dispute this marking?" confirmLabel="Open dispute"
            body="The job pauses, the payout hold stays in place, and Newcondo support reviews the boundary and photos with both of you. Use this if the marked building is not your property."
            onConfirm={() => toast.info("Dispute opened", { description: "Support will contact you within 24 hours. TODO(backend): POST /api/marking-jobs/:id/dispute" })}
            onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
