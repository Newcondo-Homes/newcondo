"use client";
import { Bug, Eye, Trash2, ShieldCheck } from "lucide-react";
import type { VendorJobDTO } from "@/lib/types";
import { VENDORS, fmtDay, fmtTime, isTodayLagos, naira } from "@/lib/constants";
import { Badge } from "@/components/ui/primitives";
import { useUI } from "@/store/ui";

export const SvcIcon = ({ s, size = 20 }: { s: string; size?: number }) => s === "FUMIGATION" ? <Bug size={size} /> : s === "INSPECTION" ? <Eye size={size} /> : <Trash2 size={size} />;
export const svcLabel = (s: string) => VENDORS.services[s as keyof typeof VENDORS.services]?.label ?? s;
export const windowLabel = (j: VendorJobDTO) => (j.scheduledFor ? `${fmtTime(j.scheduledFor)} – ${j.windowEnd ? fmtTime(j.windowEnd) : ""}` : "Not booked");

export function JobStatus({ j }: { j: VendorJobDTO }) {
  if (j.status === "COMPLETED") return <Badge s={j.payout === "PAID" ? "PAID" : j.payout === "BATCHED" ? "BATCHED" : "PROCESSING"} />;
  if (["MISSED", "LOCKED", "PAUSED"].includes(j.status)) return <Badge s={j.status} />;
  return j.scheduledFor && isTodayLagos(j.scheduledFor) ? <span className="badge b-ink">Today</span> : <Badge s="SCHEDULED" />;
}

export function JobRow({ j, showDate = true }: { j: VendorJobDTO; showDate?: boolean }) {
  const { setOpenJob, setVerifyJob } = useUI();
  const today = ["SCHEDULED", "ACTIVE"].includes(j.status) && !!j.scheduledFor && isTodayLagos(j.scheduledFor);
  return <div className="prow v-job" onClick={() => setOpenJob(j.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpenJob(j.id)}>
    <div className={`v-svc ${j.service}`}><SvcIcon s={j.service} /></div>
    <div className="prow-b">
      <div className="prow-t">{j.property}</div>
      <div className="prow-s"><span>{svcLabel(j.service)}</span><span>·</span><span>{showDate && j.scheduledFor ? `${isTodayLagos(j.scheduledFor) ? "Today" : fmtDay(j.scheduledFor)}, ` : ""}{windowLabel(j)}</span></div>
    </div>
    <div className="row-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span className="prow-price">{naira(j.cost)}</span>
      <JobStatus j={j} />
      {today && <button className="btn btn-dark btn-sm" onClick={(e) => { e.stopPropagation(); setVerifyJob(j.id); }}><ShieldCheck size={14} />Verify visit</button>}
    </div>
  </div>;
}
