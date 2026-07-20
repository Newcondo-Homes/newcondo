"use client";

/* Renter rental modal — Details / building Services / Maintenance /
   Raise a challenge. TODO(backend): POST /api/rentals/:id/requests
   { kind: MAINTENANCE|CHALLENGE, type, description } — maintenance routes to
   the owner's vendor plan, challenges to owner + Newcondo support. */
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast } from "@newcondo/ui";
import { Modal } from "@/components/dashboard/Modal";
import { DBtn, StatusBadge, KV, Banner, MapPlaceholder, Tabs, PhotoGrid, Thumb } from "@/components/dashboard/primitives";
import { NCSelect, Field, inputCls } from "@/components/dashboard/NCSelect";
import { ngn } from "@/lib/dashboard/format";
import { DUMMY_RENTER_RENTAL } from "@/lib/dashboard/data";

type View = "details" | "services" | "maintenance" | "challenge";

export function RentalModal({ onClose, initialView = "details" }: { onClose: () => void; initialView?: View }) {
  const r = DUMMY_RENTER_RENTAL; /* TODO(backend): from useRenterRental() */
  const [view, setView] = useState<View>(initialView);
  const [issue, setIssue] = useState({ type: "", desc: "" });
  const submit = (kind: "maintenance" | "challenge") => {
    if (!issue.type) { toast.error("Pick what the request is about"); return; }
    if (!issue.desc.trim()) { toast.error("Describe the issue", { description: "A short description helps the vendor or owner respond faster." }); return; }
    onClose();
    toast.promise(new Promise((res) => setTimeout(res, 1500)), {
      loading: "Submitting request…",
      success: kind === "maintenance"
        ? "Maintenance request sent — the owner and their vendor have been notified. Track progress here."
        : "Challenge raised — the owner and Newcondo support have been notified. You'll get a response within 48h.",
      error: "Could not submit — try again",
    });
  };
  return (
    <Modal wide title={r.property} sub={`${r.flat} · tenancy till ${r.till} · listing agent ${r.agent}`} onClose={onClose}>
      <Tabs value={view} onChange={(v) => setView(v as View)}
        items={[["details", "Details"], ["services", "Services"], ["maintenance", "Maintenance"], ["challenge", "Raise a challenge"]]} />
      {view === "details" && (<>
        <MapPlaceholder h={130} tag="Verified · GPS-marked" />
        <div className="mt-3">
          <KV k="Rent" v={`${ngn(r.rent)}/year`} mono />
          <KV k="Last payment" v={`${ngn(r.paid)} · ${r.paidDate}`} mono />
          <KV k="Owner" v={`${r.owner} · verified ✓`} />
          <KV k="Tenancy agreement" v={<button className="flex items-center gap-1 text-[13px] font-semibold text-green-dark hover:text-ink"><Icon name="download" size={13} />Download PDF</button>} />
        </div>
      </>)}
      {view === "services" && (<>
        <p className="mb-3 mt-0 text-[13px] leading-normal text-text-tertiary">Vendor services covered by your owner&rsquo;s plan. You&rsquo;ll be notified before every visit.</p>
        {r.services.map((s) => (
          <div key={s.service} className="mb-2 flex items-center gap-3 rounded-[14px] border border-border-hair p-3">
            <Thumb size={42} icon={s.icon} />
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold tracking-[-0.01em]">{s.service} · {s.vendor}</div>
              <div className="mt-0.5 text-[12.5px] text-text-tertiary">{s.date} · {s.note}</div>
            </div>
            <StatusBadge s={s.status} />
          </div>
        ))}
        <Banner icon="info">A missed or poor service visit? Use the <b className="font-semibold">Raise a challenge</b> tab — it goes to the owner and Newcondo, not the vendor alone.</Banner>
      </>)}
      {(view === "maintenance" || view === "challenge") && (<>
        <Field label={view === "maintenance" ? "What needs fixing?" : "What is the challenge about?"}>
          <NCSelect value={issue.type} onChange={(v) => setIssue((x) => ({ ...x, type: v }))}
            options={view === "maintenance"
              ? ["Electrical", "Plumbing", "Pest / fumigation", "Waste collection", "Structural / leak", "Other"]
              : ["Service not delivered", "Owner responsiveness", "Property condition vs listing", "Billing / payment", "Other"]} />
        </Field>
        <Field label="Describe it">
          <textarea className={cx(inputCls(), "min-h-[88px] resize-y")}
            placeholder={view === "maintenance" ? "e.g. The distribution board in the kitchen trips every evening…" : "What happened, and when?"}
            value={issue.desc} onChange={(e) => setIssue((x) => ({ ...x, desc: e.target.value }))} />
        </Field>
        <Field label="Photos (optional)"><PhotoGrid n={4} cols={4} h={56} /></Field>
        <div className="mt-1.5 flex justify-end gap-2.5 max-sm:[&>*]:flex-1">
          <DBtn variant="line" onClick={onClose}>Cancel</DBtn>
          <DBtn onClick={() => submit(view)}><Icon name="send" size={14} />{view === "maintenance" ? "Send request" : "Raise challenge"}</DBtn>
        </div>
      </>)}
    </Modal>
  );
}
