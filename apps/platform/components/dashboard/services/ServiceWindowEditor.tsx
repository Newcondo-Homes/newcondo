"use client";
/* Visit availability for one property — owner or listing agent only.
   Days are limited to Mon–Thu & Sat and hours to 9:00–17:00 (VENDORS.hours);
   the backend clamps anything else. Saving rebooks unfrozen visits inside
   the new window and notifies the assigned provider. Mount it on the
   property detail page (Services section). */
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { Card, CardH, DBtn } from "@/components/dashboard/primitives";
import { cx } from "@/lib/cx";
import { VENDORS_PUBLIC as VENDORS, minuteLabel } from "@newcondo/backend-shared/constants";
import { getServiceWindow, setServiceWindow, type ServiceWindow } from "@/lib/api/service-visits";

const NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: (VENDORS.hours.endMinute - VENDORS.hours.startMinute) / 60 + 1 }, (_, i) => VENDORS.hours.startMinute + i * 60);

export function ServiceWindowEditor({ propertyId }: { propertyId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["service-window", propertyId], queryFn: () => getServiceWindow(propertyId) });
  const [w, setW] = useState<ServiceWindow | null>(null);
  useEffect(() => { if (data) setW(data); }, [data]);
  const save = useMutation({
    mutationFn: (v: ServiceWindow) => setServiceWindow(propertyId, v),
    onSuccess: (r) => { qc.setQueryData(["service-window", propertyId], r.window); qc.invalidateQueries({ queryKey: ["service-visits"] }); toast.success("Availability saved", { description: "Upcoming visits were moved to fit, and your provider was told." }); },
    onError: (e) => toast.error("Couldn't save availability", { description: (e as Error).message }),
  });
  if (!w) return null;
  const toggle = (d: number) => setW({ ...w, days: w.days.includes(d) ? w.days.filter((x) => x !== d) : [...w.days, d].sort() });
  const tooShort = w.endMinute - w.startMinute < VENDORS.hours.minWindowMinutes;
  return <Card>
    <CardH title="When providers can visit" />
    <div className="flex flex-wrap gap-1.5">
      {[1, 2, 3, 4, 5, 6].map((d) => { const allowed = VENDORS.hours.allowedDays.includes(d); return <button key={d} disabled={!allowed} onClick={() => toggle(d)}
        className={cx("rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors", !allowed ? "cursor-not-allowed bg-surface-sunken text-text-tertiary line-through opacity-50" : w.days.includes(d) ? "bg-ink text-cream" : "bg-surface-sunken text-text-secondary hover:text-ink")}>{NAMES[d]}</button>; })}
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3">
      {(["startMinute", "endMinute"] as const).map((k) => <label key={k} className="flex flex-col gap-1.5 text-[13px] font-semibold">{k === "startMinute" ? "From" : "Until"}
        <select className="rounded-2xl border border-nc-border bg-surface px-3.5 py-3 text-[14.5px] font-normal outline-none focus:border-ink" value={w[k]} onChange={(e) => setW({ ...w, [k]: Number(e.target.value) })}>
          {HOURS.map((m) => <option key={m} value={m}>{minuteLabel(m)}</option>)}
        </select></label>)}
    </div>
    <p className="mb-4 mt-3 text-[12px] leading-relaxed text-text-tertiary">Fridays and Sundays are kept free for worship. Pick at least {VENDORS.hours.minWindowMinutes / 60} hours so the provider can fit the visit in.</p>
    <DBtn disabled={!w.days.length || tooShort || save.isPending} onClick={() => save.mutate(w)}>Save availability</DBtn>
  </Card>;
}
