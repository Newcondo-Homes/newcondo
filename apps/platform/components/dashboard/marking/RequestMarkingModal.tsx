"use client";

/* Request-marking wizard: self / shared link / ₦20,000 broadcast / ₦25,000
   Newcondo-managed. Paid methods collect a contact person then pay via
   Flutterwave. TODO(backend): POST /api/marking-jobs then Flutterwave inline
   checkout; on webhook success the job broadcasts to agents in proximity. */
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast } from "@newcondo/ui";
import { Modal } from "@/components/dashboard/Modal";
import { DBtn, KV, Banner, CopyField, PhotoGrid } from "@/components/dashboard/primitives";
import { NCSelect, Field, inputCls } from "@/components/dashboard/NCSelect";
import { ngn } from "@/lib/dashboard/format";
import { DUMMY_PROPERTIES, type MarkingMethod } from "@/lib/dashboard/data";

const METHODS: { id: MarkingMethod; icon: string; t: string; p: string; fee: string }[] = [
  { id: "SELF", icon: "map-pin", t: "Mark it myself", p: "You are at the property — tap your building on the map now.", fee: "Free" },
  { id: "KNOWN_PERSON", icon: "share-2", t: "Send someone I know", p: "Get a shareable link. They open it at the property and mark it for you. You confirm afterwards.", fee: "Free" },
  { id: "BROADCAST", icon: "zap", t: "Broadcast to nearby agents", p: "Verified agents near the property join a first-come-first-served queue. Each gets a 3-hour slot.", fee: ngn(20000) },
  { id: "NEWCONDO", icon: "shield-check", t: "Let Newcondo handle it", p: "We assign a vetted Newcondo agent and manage the whole job for you.", fee: ngn(25000) },
];

export function RequestMarkingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ property: "", method: "" as MarkingMethod | "", contactName: "", contactPhone: "", access: "" });
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const needsPay = f.method === "BROADCAST" || f.method === "NEWCONDO";
  const fee = f.method === "BROADCAST" ? 20000 : 25000;
  const steps = needsPay ? ["Method", "Access details", "Pay"] : ["Method", "Next steps"];
  const next = () => {
    if (step === 0 && !f.method) { toast.error("Pick how the property should be marked"); return; }
    if (step === 1 && needsPay && (!f.contactName.trim() || !f.contactPhone.trim())) {
      toast.error("Contact person required", { description: "The marking agent needs someone to call at the property." }); return;
    }
    setStep(step + 1);
  };
  const finish = () => {
    onClose();
    if (f.method === "SELF") { toast.info("Opening the marking map…", { description: "Routes to properties/[id]/mark — the full-screen map experience." }); return; }
    if (f.method === "KNOWN_PERSON") { toast.success("Marking link created", { description: "Share it with your person — you'll be notified the moment they mark." }); return; }
    toast.promise(new Promise((res) => setTimeout(res, 2000)), {
      loading: `Processing ${ngn(fee)} payment — Flutterwave secure checkout…`,
      success: f.method === "BROADCAST" ? "Marking job is live — broadcasting to verified agents near the property." : "Marking job is live — a Newcondo agent will be assigned within 24 hours.",
      error: "Payment failed — you were not charged",
    });
  };
  return (
    <Modal wide title="Request property marking" sub={steps[step]} onClose={onClose}
      footer={<>
        {step > 0 && <DBtn variant="line" onClick={() => setStep(step - 1)}>Back</DBtn>}
        {step < steps.length - 1
          ? <DBtn onClick={next}>Continue<Icon name="arrow-right" size={14} strokeWidth={2.2} /></DBtn>
          : <DBtn onClick={finish}>{needsPay ? `Pay ${ngn(fee)} with Flutterwave` : f.method === "KNOWN_PERSON" ? "Create link" : "Open map"}</DBtn>}
      </>}>
      <div className="mb-[18px] flex items-center gap-1.5">
        {steps.map((s, i) => (
          <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-surface-sunken">
            <i className="block h-full bg-ink transition-[width] duration-300 ease-nc" style={{ width: i <= step ? "100%" : 0 }} />
          </span>
        ))}
      </div>
      {step === 0 && (<>
        <Field label="Property">
          <NCSelect value={f.property} onChange={(v) => set("property", v)} placeholder="Select a property…"
            options={DUMMY_PROPERTIES.filter((p) => !p.marked).map((p) => p.title)} />
        </Field>
        {METHODS.map((m) => (
          <button type="button" key={m.id} onClick={() => set("method", m.id)}
            className={cx("mb-2.5 flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all",
              f.method === m.id ? "border-ink shadow-[0_0_0_1px_var(--ink)]" : "border-nc-border hover:border-ink")}>
            <span className={cx("grid size-10 flex-none place-items-center rounded-xl", f.method === m.id ? "bg-ink text-cream" : "bg-surface-sunken text-ink")}><Icon name={m.icon} size={18} /></span>
            <span className="min-w-0 flex-1">
              <b className="flex items-center justify-between text-[14px] tracking-[-0.01em]">{m.t}<span className="font-mono text-[13px]">{m.fee}</span></b>
              <p className="mb-0 mt-1 text-[12.5px] leading-normal text-text-tertiary">{m.p}</p>
            </span>
          </button>
        ))}
      </>)}
      {step === 1 && needsPay && (<>
        <p className="mb-3.5 mt-0 text-[13px] leading-normal text-text-tertiary">The marking agent uses these details to find and enter the property.</p>
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <Field label="Contact person at property"><input className={inputCls()} placeholder="e.g. Mr. Wachukwu (caretaker)" value={f.contactName} onChange={(e) => set("contactName", e.target.value)} /></Field>
          <Field label="Their phone"><input className={inputCls()} inputMode="tel" placeholder="0803 000 0000" value={f.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} /></Field>
        </div>
        <Field label="Access notes (optional)"><textarea className={cx(inputCls(), "min-h-[80px] resize-y")} placeholder="Gate colour, landmarks, best time to visit…" value={f.access} onChange={(e) => set("access", e.target.value)} /></Field>
        <Field label="Property photos (recommended)" hint="Photos help the agent identify the right building."><PhotoGrid n={4} cols={4} h={62} /></Field>
      </>)}
      {step === 1 && !needsPay && (
        f.method === "SELF"
          ? <Banner icon="map-pin"><b className="font-semibold">You&rsquo;ll be taken to the full-screen map.</b> Your location is pinpointed and zoomed to the last level. Tap the box that is your building — already-marked houses show a red-grey mask and can&rsquo;t be selected.</Banner>
          : (<>
            <div className="mb-3.5"><Banner icon="share-2"><b className="font-semibold">A one-time marking link will be created.</b> Your person opens it at the property; the link walks them through marking and photo capture. You confirm the result before anything is listed.</Banner></div>
            <CopyField value="newcondo.homes/mark-property/LNK-7Q2F (created on finish)" />
          </>)
      )}
      {step === 2 && needsPay && (<>
        <div className="mb-1.5 flex items-center justify-between rounded-[14px] bg-surface-sunken px-4 py-[13px] text-[13.5px]"><span>Marking service fee</span><b className="font-mono text-[15px]">{ngn(fee)}</b></div>
        {f.method === "BROADCAST" && <div className="mb-1.5 flex items-center justify-between rounded-[14px] bg-green-wash px-4 py-[13px] text-[13.5px]"><span>Goes to the marking agent (25%)</span><b className="font-mono text-[15px]">{ngn(5000)}</b></div>}
        <KV k="Contact person" v={`${f.contactName} · ${f.contactPhone}`} />
        <KV k="Owner confirm window" v="72 hours after marking" />
        <KV k="Payment" v="Flutterwave — card, transfer or USSD" />
        <div className="mt-3"><Banner icon="lock">The fee is held by Newcondo and only released to the marker after completion — with the balance released when you confirm.</Banner></div>
      </>)}
    </Modal>
  );
}
