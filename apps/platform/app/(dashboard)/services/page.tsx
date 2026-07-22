"use client";

/* Services — third-party vendors (fumigation, waste, inspection, repairs)
   on the owner's/agent's properties. Plan card, upcoming & history,
   job detail modal, request-a-service modal.
   Live API: GET /api/v1/services/overview · POST /services/request ·
   POST /services/jobs/:id/reschedule · POST /services/jobs/:id/issue
   (vendor-service via combined backend). */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast } from "@newcondo/ui";
import { useRole } from "@/components/providers/role-provider";
import { PageHead, DBtn, StatusBadge, Card, CardH, Row, Thumb, KV, EmptyState, SkeletonRows, PhotoGrid } from "@/components/dashboard/primitives";
import { Modal } from "@/components/dashboard/Modal";
import { NCSelect, Field, inputCls } from "@/components/dashboard/NCSelect";
import { useServices } from "@/hooks/dashboard/useDashboardData";
import { ngn } from "@/lib/dashboard/format";
import * as api from "@/lib/api/dashboard";
import { DUMMY_PROPERTIES, type ServiceJob } from "@/lib/dashboard/data";

const PLANS = [
  ["Basic", "₦18,000/quarter", "Fumigation 1×/yr · waste bi-weekly · inspection 1×/yr"],
  ["Shield", "₦45,000/quarter", "Fumigation 3×/yr · waste weekly · inspection 2×/yr"],
  ["Estate", "₦90,000/quarter", "Fumigation 4×/yr · waste 2×/week · inspection quarterly · priority repairs"],
] as const;

export default function ServicesPage() {
  const router = useRouter();
  const { role } = useRole();
  const { data, isLoading } = useServices();
  const [modal, setModal] = useState<null | "request" | "plan">(null);
  const [detail, setDetail] = useState<ServiceJob | null>(null);
  if (role === "RENTER") {
    return <EmptyState icon="briefcase" title="Services are managed by your property owner"
      sub="Fumigation, waste and inspection visits on your building show inside My Rentals — you'll be notified before every visit."
      action={<DBtn onClick={() => router.push("/payments")}>Open My Rentals</DBtn>} />;
  }
  if (isLoading || !data) return (<><PageHead title="Services" sub="Loading…" /><SkeletonRows n={4} h={80} /></>);
  const upcoming = data.jobs.filter((j) => j.status === "SCHEDULED" || j.status === "ACTIVE");
  const history = data.jobs.filter((j) => j.status !== "SCHEDULED" && j.status !== "ACTIVE");
  return (
    <>
      <PageHead title="Services" sub="Vetted third-party vendors working on your properties — every visit scheduled, documented and reviewable."
        actions={<DBtn onClick={() => setModal("request")}><Icon name="plus" size={15} strokeWidth={2.2} />Request a service</DBtn>} />
      <Card className="mb-4">
        <CardH title={`Your plan — ${data.plan.name}`}
          right={<div className="flex items-center gap-2.5">
            <span className="text-[12px] text-text-tertiary max-sm:hidden">{ngn(data.plan.price)}/{data.plan.per} · renews {data.plan.renews}</span>
            <button className="text-[13px] font-semibold text-green-dark hover:text-ink" onClick={() => setModal("plan")}>Change plan</button>
          </div>} />
        <div className="grid grid-cols-4 gap-3 max-[1060px]:grid-cols-2 max-sm:grid-cols-1">
          {data.plan.entitlements.map(([name, freq, vendor]) => (
            <div key={name} className="rounded-2xl bg-surface-sunken px-4 py-3.5">
              <div className="text-[12.5px] font-semibold text-text-tertiary">{name}</div>
              <div className="mt-1.5 text-[15.5px] font-bold tracking-[-0.02em]">{freq}</div>
              <div className="mt-1 text-[12px] text-text-tertiary">{vendor}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card tight className="mb-4">
        <CardH pad title="Upcoming & active" right={<StatusBadge s="PENDING">{upcoming.length}</StatusBadge>} />
        {upcoming.map((j) => <ServiceRow key={j.id} j={j} onClick={() => setDetail(j)} />)}
      </Card>
      <Card tight>
        <CardH pad title="Service history" right={<span className="text-[12px] text-text-tertiary">tap any job for full details</span>} />
        {history.map((j) => <ServiceRow key={j.id} j={j} onClick={() => setDetail(j)} />)}
      </Card>
      <AnimatePresence>
        {detail && <ServiceDetailModal key="detail" job={detail} onClose={() => setDetail(null)} />}
        {modal === "request" && <RequestServiceModal key="request" types={data.types} onClose={() => setModal(null)} />}
        {modal === "plan" && (
          <Modal key="plan" title="Change services plan" sub="Visit frequency scales with the plan. Changes apply from your next renewal." onClose={() => setModal(null)}
            footer={<DBtn variant="line" onClick={() => setModal(null)}>Close</DBtn>}>
            {PLANS.map(([n, p, d]) => (
              <div key={n} className={cx("mb-2.5 rounded-2xl border p-4", n === data.plan.name ? "border-ink shadow-[0_0_0_1px_var(--ink)]" : "border-nc-border")}>
                <b className="flex items-center justify-between text-[14px] tracking-[-0.01em]">{n}<span className="font-mono text-[13px]">{p}</span></b>
                <p className="mb-0 mt-1 text-[12.5px] leading-normal text-text-tertiary">{d}</p>
              </div>
            ))}
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

function ServiceRow({ j, onClick }: { j: ServiceJob; onClick: () => void }) {
  return (
    <Row onClick={onClick}>
      <Thumb icon={j.icon} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{j.service} — {j.vendor}</div>
        <div className="mt-1 text-[12.5px] text-text-tertiary">{j.property} · {j.date}{j.time ? `, ${j.time}` : ""}</div>
      </div>
      <div className="flex flex-none items-center gap-2.5">
        {j.cost > 0 && <span className="font-mono text-[13px] font-semibold">{ngn(j.cost)}</span>}
        <StatusBadge s={j.status} /><Icon name="chevron-right" size={14} className="text-text-tertiary" />
      </div>
    </Row>
  );
}

function ServiceDetailModal({ job, onClose }: { job: ServiceJob; onClose: () => void }) {
  return (
    <Modal title={job.service} sub={`${job.property} · ${job.vendor}`} onClose={onClose}
      footer={<>
        {job.status === "COMPLETED" && <DBtn variant="line" onClick={() => { if (api.isLiveBackend) api.reportServiceIssue(job.id, "Owner reported an issue with this visit").catch(() => {}); toast.info("Issue reported", { description: "Newcondo reviews it with the vendor and follows up with you." }); }}>Report an issue</DBtn>}
        {job.status === "SCHEDULED" && <DBtn variant="line" onClick={() => { if (api.isLiveBackend) api.rescheduleServiceJob(job.id).catch(() => {}); onClose(); toast.success("Reschedule request sent", { description: "The vendor confirms a new slot within 24h." }); }}>Reschedule</DBtn>}
        <DBtn onClick={onClose}>Done</DBtn>
      </>}>
      <KV k="Status" v={<StatusBadge s={job.status} />} />
      <KV k="Vendor" v={`${job.vendor} · ${job.rating} ★`} />
      <KV k={job.status === "SCHEDULED" ? "Scheduled for" : "Date"} v={`${job.date}${job.time ? ` · ${job.time}` : ""}`} />
      <KV k="Cost" v={job.cost > 0 ? ngn(job.cost) : "Included in plan"} mono />
      <KV k="Reference" v={`NC-SV-${job.id.toUpperCase()}`} mono />
      <div className="mb-1.5 mt-3.5 text-[13px] font-semibold">Job notes</div>
      <p className="m-0 text-[13.5px] leading-relaxed text-text-secondary">{job.note}</p>
      {(job.photos ?? 0) > 0 && (<>
        <div className="mb-2 mt-3.5 text-[13px] font-semibold">{job.photos} report photos</div>
        <PhotoGrid n={job.photos!} cols={4} h={56} />
      </>)}
    </Modal>
  );
}

function RequestServiceModal({ types, onClose }: { types: string[]; onClose: () => void }) {
  const [f, setF] = useState({ type: "", property: "", notes: "" });
  const submit = () => {
    if (!f.type) { toast.error("Pick a service type"); return; }
    if (!f.property) { toast.error("Pick which property it's for"); return; }
    onClose();
    // POST /api/v1/services/request — repairs get QUOTE_REQUESTED (vendor quote
    // for approval before dispatch); plan-covered types get REQUESTED
    const propertyId = DUMMY_PROPERTIES.find((p) => p.title === f.property)?.id;
    const doReq = api.isLiveBackend && propertyId
      ? api.requestServiceApi({ propertyId, serviceType: f.type, notes: f.notes })
      : new Promise((res) => setTimeout(res, 1500));
    toast.promise(doReq, {
      loading: "Sending request to vendors…",
      success: f.type.startsWith("Repair") ? "Service request sent — you'll receive a vendor quote to approve before any work starts." : "Service request sent — the vendor proposes a visit slot within 24 hours.",
      error: "Could not send the request",
    });
  };
  return (
    <Modal title="Request a service" sub="Plan-covered services are free within your visit allowance. Repairs are quoted first." onClose={onClose}
      footer={<><DBtn variant="line" onClick={onClose}>Cancel</DBtn><DBtn onClick={submit}><Icon name="send" size={14} />Send request</DBtn></>}>
      <Field label="Service"><NCSelect value={f.type} onChange={(v) => setF((x) => ({ ...x, type: v }))} options={types} /></Field>
      <Field label="Property"><NCSelect value={f.property} onChange={(v) => setF((x) => ({ ...x, property: v }))} options={DUMMY_PROPERTIES.map((p) => p.title)} /></Field>
      <Field label="Notes for the vendor (optional)">
        <textarea className={cx(inputCls(), "min-h-[80px] resize-y")} placeholder="Anything they should know — access, urgency, which flat…" value={f.notes} onChange={(e) => setF((x) => ({ ...x, notes: e.target.value }))} />
      </Field>
    </Modal>
  );
}
