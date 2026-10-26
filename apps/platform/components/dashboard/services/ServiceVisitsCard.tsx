"use client";
/* Visit code card — mounted on the Services page (owners/agents) and the
   renter's My Rentals → Services tab. On the visit day the owner, listing
   agent or a tenant creates a one-time code; the provider types the 6 digits
   or scans the QR. The QR is drawn with error-correction "L" and a large
   module scale (VENDORS.codes.qr) so weak phone cameras read it.
   Deps: `pnpm --filter @newcondo/platform add qrcode @types/qrcode` */
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@newcondo/ui";
import { Card, CardH, DBtn, EmptyState, SkeletonRows, StatusBadge } from "@/components/dashboard/primitives";
import { Modal } from "@/components/dashboard/Modal";
import { Icon } from "@/components/ui/icon";
import { getServiceVisits, createVisitCode, getVisitPhotos, type ServiceVisit, type VisitCode } from "@/lib/api/service-visits";

const LABEL = { FUMIGATION: "Fumigation", INSPECTION: "Inspection", WASTE_MANAGEMENT: "Waste pickup" } as const;
const TZ = "Africa/Lagos";
const when = (v: ServiceVisit) => v.scheduledFor
  ? `${new Date(v.scheduledFor).toLocaleDateString("en-NG", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" })} · ${new Date(v.scheduledFor).toLocaleTimeString("en-NG", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false })}${v.windowEnd ? `–${new Date(v.windowEnd).toLocaleTimeString("en-NG", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false })}` : ""}`
  : "Date pending";

function CodeModal({ visit, code, onClose }: { visit: ServiceVisit; code: VisitCode; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvas.current) void QRCode.toCanvas(canvas.current, code.qr, { errorCorrectionLevel: code.qrOptions.errorCorrectionLevel, scale: code.qrOptions.scale, margin: code.qrOptions.margin, color: { dark: "#131313", light: "#ffffff" } });
  }, [code]);
  const until = new Date(code.expiresAt).toLocaleTimeString("en-NG", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
  return <Modal title="Visit code" sub={`${LABEL[visit.service]} · ${visit.property}`} onClose={onClose} footer={<DBtn onClick={onClose}>Done</DBtn>}>
    <p className="m-0 text-[14px] leading-relaxed text-text-secondary">Give this to <b className="text-ink">{visit.vendor ?? "the provider"}</b> only <b className="text-ink">after the work is done</b>. They can type it or scan the QR.</p>
    <div className="my-5 flex justify-center gap-2 font-mono text-[34px] font-medium tracking-[0.18em] max-sm:text-[28px]" aria-label={`Code ${code.code.split("").join(" ")}`}>{code.code}</div>
    <div className="flex justify-center"><canvas ref={canvas} className="max-w-full rounded-2xl border border-border-hair" style={{ imageRendering: "pixelated", width: "min(300px, 100%)", height: "auto" }} /></div>
    <p className="mb-0 mt-3 text-center text-[12px] text-text-tertiary">Works until {until} today, for this visit only. Creating a new code cancels this one.</p>
  </Modal>;
}

/* Report photos are PRIVATE (S3 private bucket). The backend checks you're the
   owner / listing agent / tenant, then returns 10-minute presigned URLs —
   fetched only when this modal opens, never cached long-term. */
function PhotosModal({ visit, onClose }: { visit: ServiceVisit; onClose: () => void }) {
  const { data = [], isLoading, isError } = useQuery({ queryKey: ["visit-photos", visit.jobId], queryFn: () => getVisitPhotos(visit.jobId), staleTime: 5 * 60_000, gcTime: 9 * 60_000 });
  return <Modal wide title="Visit photos" sub={`${LABEL[visit.service]} · ${visit.property}${visit.vendor ? ` · ${visit.vendor}` : ""}`} onClose={onClose} footer={<DBtn onClick={onClose}>Done</DBtn>}>
    {isLoading ? <SkeletonRows n={2} h={120} /> : isError ? <p className="m-0 text-[14px] text-text-secondary">Couldn't load the photos. Try again in a moment.</p>
      : data.length === 0 ? <p className="m-0 text-[14px] text-text-secondary">No photos were uploaded for this visit.</p>
      : <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-2">{data.map((p) => <a key={p.key} href={p.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl border border-border-hair"><img src={p.url} alt="" loading="lazy" className="aspect-square w-full object-cover" /></a>)}</div>}
    <p className="mb-0 mt-3 text-[12px] text-text-tertiary">Only you, your listing agent, your tenants and Newcondo can see these.</p>
  </Modal>;
}

export function ServiceVisitsCard() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["service-visits"], queryFn: getServiceVisits, refetchInterval: 60_000 });
  const [open, setOpen] = useState<{ visit: ServiceVisit; code: VisitCode } | null>(null);
  const [photos, setPhotos] = useState<ServiceVisit | null>(null);
  const gen = useMutation({
    mutationFn: (v: ServiceVisit) => createVisitCode(v.jobId).then((code) => ({ visit: v, code })),
    onSuccess: (r) => { setOpen(r); qc.invalidateQueries({ queryKey: ["service-visits"] }); },
    onError: (e) => toast.error("Couldn't create a code", { description: (e as Error).message }),
  });
  const upcoming = data.filter((v) => ["SCHEDULED", "ACTIVE", "RESCHEDULE_REQUESTED"].includes(v.status));
  const done = data.filter((v) => v.status === "COMPLETED").slice(-5).reverse();
  return <Card tight>
    <CardH pad title="Service visits" right={<span className="text-[12px] text-text-tertiary">Mon–Thu & Sat, 9:00–17:00</span>} />
    {isLoading ? <div className="p-4"><SkeletonRows n={2} /></div> : upcoming.length === 0
      ? <EmptyState icon="calendar" title="No visits booked" sub="Fumigation, inspection and waste visits appear here once your plan has funded them." />
      : upcoming.map((v) => <div key={v.jobId} className="flex flex-wrap items-center gap-3.5 border-b border-border-hair px-5 py-3.5 last:border-b-0 max-sm:px-4">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-[14px] bg-surface-sunken text-ink"><Icon name={v.service === "FUMIGATION" ? "bug" : v.service === "INSPECTION" ? "eye" : "trash-2"} size={19} /></div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold">{LABEL[v.service]} · {v.property}</div>
          <div className="mt-0.5 text-[12.5px] text-text-tertiary">{when(v)}{v.vendor ? ` · ${v.vendor}` : ""}</div>
        </div>
        {v.canGenerateCode
          ? <DBtn sm disabled={gen.isPending} onClick={() => gen.mutate(v)}><Icon name="qr-code" size={14} />{v.codeActive ? "New visit code" : "Get visit code"}</DBtn>
          : <StatusBadge s="SCHEDULED">Booked</StatusBadge>}
      </div>)}
    {done.length > 0 && <>
      <div className="border-t border-border-hair px-5 pb-1 pt-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary max-sm:px-4">Recent visits</div>
      {done.map((v) => <div key={v.jobId} className="flex flex-wrap items-center gap-3.5 border-b border-border-hair px-5 py-3 last:border-b-0 max-sm:px-4">
        <div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-semibold">{LABEL[v.service]} · {v.property}</div><div className="mt-0.5 text-[12.5px] text-text-tertiary">{when(v)}</div></div>
        <StatusBadge s="COMPLETED">Done</StatusBadge>
        <DBtn sm variant="line" onClick={() => setPhotos(v)}><Icon name="image" size={14} />Photos</DBtn>
      </div>)}
    </>}
    {open && <CodeModal visit={open.visit} code={open.code} onClose={() => setOpen(null)} />}
    {photos && <PhotosModal visit={photos} onClose={() => setPhotos(null)} />}
  </Card>;
}
