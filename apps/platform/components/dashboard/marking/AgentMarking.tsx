"use client";

/* Agent marking desk — active 3-hour slot, FCFS queue of nearby jobs,
   job history, complete/abandon flows.
   TODO(backend): GET /api/marking/available-jobs?lat&lng ·
   POST /api/marking/queue/:jobId/join · POST /api/marking/my-jobs/:id/complete */
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { toast } from "@newcondo/ui";
import { PageHead, DBtn, StatusBadge, Card, CardH, Row, Thumb, Tabs, Countdown, Meter, MapPlaceholder, PhotoGrid, KV, SkeletonRows } from "@/components/dashboard/primitives";
import { Modal, ConfirmDialog } from "@/components/dashboard/Modal";
import { usePersistedTab } from "@/hooks/dashboard/usePersistedTab";
import { useAvailableJobs, useActiveJob, useJobHistory, useCacheUpdate } from "@/hooks/dashboard/useDashboardData";
import { ngn } from "@/lib/dashboard/format";
import type { ActiveJob, AvailableJob, JobHistoryItem } from "@/lib/dashboard/data";

export function AgentMarking() {
  const [tab, setTab] = usePersistedTab("nc-agent-marking-tab", "available");
  const [modal, setModal] = useState<null | "complete" | "abandon">(null);
  const available = useAvailableJobs();
  const active = useActiveJob();
  const history = useJobHistory();
  const cache = useCacheUpdate();
  if (available.isLoading || history.isLoading) return (<><PageHead title="Marking Queue" sub="Loading…" /><SkeletonRows n={3} h={100} /></>);
  const act = active.data;
  const joinQueue = (j: AvailableJob) => {
    /* TODO(backend): POST /api/marking/queue/:jobId/join → returns position + est. slot time */
    cache.update<AvailableJob[]>(["marking", "available"], (l) => l.map((x) => (x.id === j.id ? { ...x, queue: x.queue + 1, joined: true } : x)));
    toast.success(`Joined the queue — position ${j.queue + 1}`, { description: j.queue === 0 ? "You are first! Your 3-hour slot starts now." : "You'll be notified when your 3-hour slot starts." });
  };
  const completeJob = () => {
    if (!act) return;
    /* TODO(backend): POST /api/marking/my-jobs/:id/complete { boundary, photos[] } → holds ₦1,000, notifies owner */
    cache.update<ActiveJob | null>(["marking", "active"], () => null);
    cache.update<JobHistoryItem[]>(["marking", "history"], (l) => [{ id: "hx", title: act.title, date: "Today", payout: 1000, status: "PARTIAL", note: "₦1,000 held · balance on owner confirmation" }, ...l]);
    toast.promise(new Promise((res) => setTimeout(res, 1700)), {
      loading: "Uploading boundary & photos…",
      success: "Marking submitted — ₦1,000 held in your wallet. The rest releases when the owner confirms (max 72h).",
      error: "Upload failed — retry from My jobs",
    });
  };
  return (
    <>
      <PageHead title="Marking Queue" sub="First-come-first-served jobs near you. Each marker gets a 3-hour slot. ₦5,000 per completed job." />
      {act && (
        <Card className="mb-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h3 className="m-0 flex flex-wrap items-center gap-2.5 text-[16.5px] font-bold tracking-[-0.02em]">Active job — {act.title}<StatusBadge s="ACTIVE">Your slot</StatusBadge></h3>
            <Countdown minsLeft={act.slotMinsLeft} label="in slot" />
          </div>
          <div className="mb-3.5"><Meter warn pct={(act.slotMinsLeft / 180) * 100} /></div>
          <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
            <MapPlaceholder h={150} tag="Navigate to property" />
            <div>
              <KV k="Area" v={act.area} />
              <KV k="Guide" v={`${act.contactName} · ${act.contactPhone}`} />
              <KV k="Payout" v={`${ngn(act.payout)} — ₦1,000 on completion`} mono />
              <div className="mt-3.5 flex gap-2.5 max-sm:flex-col">
                <DBtn variant="line" onClick={() => setModal("abandon")}>Leave job</DBtn>
                <DBtn className="flex-1" onClick={() => setModal("complete")}><Icon name="map-pin" size={15} />Mark & upload photos</DBtn>
              </div>
            </div>
          </div>
        </Card>
      )}
      <Tabs value={tab} onChange={setTab} items={[["available", "Available nearby", (available.data ?? []).length], ["history", "My jobs", (history.data ?? []).length]]} />
      {tab === "available" && (
        <Card tight>
          {(available.data ?? []).map((j) => (
            <Row key={j.id}>
              <Thumb icon="map-pin" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{j.title}</div>
                <div className="mt-1 text-[12.5px] text-text-tertiary">{j.area} · <b className="text-text-primary">{j.distanceKm} km away</b> · posted {j.posted} · {j.photos > 0 ? `${j.photos} reference photos` : "no photos"}</div>
              </div>
              <div className="flex flex-none items-center gap-3">
                <div className="text-right">
                  <div className="font-mono text-[13px] font-semibold">{ngn(j.payout)}</div>
                  <div className="mt-0.5 text-[11.5px] text-text-tertiary">{j.queue} in queue</div>
                </div>
                {j.joined
                  ? <StatusBadge s="ACTIVE"><Icon name="check" size={11} />In queue</StatusBadge>
                  : <DBtn sm onClick={() => joinQueue(j)}>Join queue</DBtn>}
              </div>
            </Row>
          ))}
        </Card>
      )}
      {tab === "history" && (
        <Card tight>
          {(history.data ?? []).map((h) => (
            <Row key={h.id}>
              <Thumb icon="check" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{h.title}</div>
                <div className="mt-1 text-[12.5px] text-text-tertiary">{h.date}{h.note && ` · ${h.note}`}</div>
              </div>
              <div className="flex flex-none items-center gap-2.5">
                <span className="font-mono text-[13px] font-semibold text-green-dark">+{ngn(h.payout)}</span>
                <StatusBadge s={h.status} />
              </div>
            </Row>
          ))}
        </Card>
      )}
      <AnimatePresence>
        {modal === "complete" && (
          <Modal key="complete" title="Complete marking" sub="Draw the boundary on-site, then upload photos of key rooms and the building exterior." onClose={() => setModal(null)}
            footer={<>
              <DBtn variant="line" onClick={() => setModal(null)}>Not yet</DBtn>
              <DBtn variant="green" onClick={() => { setModal(null); completeJob(); }}><Icon name="check" size={14} strokeWidth={2.2} />Submit marking</DBtn>
            </>}>
            <MapPlaceholder h={150} tag="Tap the building — default map view" />
            <div className="mt-3"><PhotoGrid n={4} cols={4} h={60} labels={["Exterior", "Living rm", "Bedroom", "Kitchen"]} /></div>
          </Modal>
        )}
        {modal === "abandon" && (
          <ConfirmDialog key="abandon" danger title="Leave this job?" confirmLabel="Leave job"
            body="Your slot passes to the next agent in the queue immediately, and repeated abandons lower your reliability score."
            onConfirm={() => {
              /* TODO(backend): POST /api/marking/my-jobs/:id/abandon */
              cache.update<ActiveJob | null>(["marking", "active"], () => null);
              toast.info("You left the job", { description: "The next agent in the queue has been notified." });
            }}
            onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
