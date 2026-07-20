"use client";

/* Create-listing wizard — details → structured address → legal → review.
   Agents provide the owner's identity + bank (creates the property's
   virtual account) and confirm signed owner consent.
   TODO(backend): POST /api/properties (multipart via UploadThing) — creates
   DRAFT then routes to marking. Agent-listed: POST /api/virtual-accounts. */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast } from "@newcondo/ui";
import { Modal } from "@/components/dashboard/Modal";
import { DBtn, KV, Banner, MapPlaceholder, PhotoGrid } from "@/components/dashboard/primitives";
import { NCSelect, Field, inputCls } from "@/components/dashboard/NCSelect";
import { ngn } from "@/lib/dashboard/format";
import { DUMMY_GEO, AMENITIES } from "@/lib/dashboard/data";

interface F { title: string; type: string; price: string; flats: string; desc: string; state: string; lga: string; area: string; amenities: string[]; ownerName: string; ownerBank: string; ownerAcct: string; undertaking: boolean; consent: boolean; }

export function CreateListingModal({ agent, onClose }: { agent?: boolean; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<F>({ title: "", type: "Flat", price: "", flats: "1", desc: "", state: "", lga: "", area: "", amenities: [], ownerName: "", ownerBank: "", ownerAcct: "", undertaking: false, consent: false });
  const [errs, setErrs] = useState<Record<string, string | null>>({});
  const set = <K extends keyof F>(k: K, v: F[K]) => { setF((x) => ({ ...x, [k]: v })); setErrs((e) => ({ ...e, [k]: null })); };
  const steps = agent ? ["Details", "Address", "Owner & legal", "Review"] : ["Details", "Address", "Legal", "Review"];
  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0) { if (!f.title.trim()) e.title = "Give the listing a title"; if (!f.price || +f.price <= 0) e.price = "Enter the yearly rent"; }
    if (step === 1) { if (!f.state) e.state = "Pick a state"; if (!f.lga) e.lga = "Pick an LGA"; if (!f.area) e.area = "Pick an area"; }
    if (step === 2) {
      if (agent) { if (!f.ownerName.trim()) e.ownerName = "Owner's full name is required"; if (!f.ownerAcct.trim()) e.ownerAcct = "Owner's account number — their virtual account is built from this"; if (!f.consent) e.consent = "Required"; }
      if (!f.undertaking) e.undertaking = "Required";
    }
    setErrs(e);
    if (Object.keys(e).length) toast.error("Some fields need attention", { description: "Fix the highlighted fields to continue." });
    return !Object.keys(e).length;
  };
  const next = () => { if (validate() && step < steps.length - 1) setStep(step + 1); };
  const submit = () => {
    onClose();
    /* TODO(backend): mutation — on success invalidate ["properties","mine"] */
    toast.promise(new Promise((res) => setTimeout(res, 1500)), {
      loading: "Creating listing…",
      success: () => { setTimeout(() => router.push("/marking"), 200); return "Listing created as draft — next: GPS-mark the property so it can go live."; },
      error: "Could not create the listing",
    });
  };
  const lgas = f.state ? Object.keys(DUMMY_GEO[f.state] ?? {}) : [];
  const areas = f.state && f.lga ? DUMMY_GEO[f.state]?.[f.lga] ?? [] : [];
  return (
    <Modal wide title={agent ? "List a property for an owner" : "List your property"} sub={`Step ${step + 1} of ${steps.length} — ${steps[step]}`} onClose={onClose}
      footer={<>
        {step > 0 && <DBtn variant="line" onClick={() => setStep(step - 1)}>Back</DBtn>}
        {step < steps.length - 1
          ? <DBtn onClick={next}>Continue<Icon name="arrow-right" size={14} strokeWidth={2.2} /></DBtn>
          : <DBtn onClick={submit}><Icon name="check" size={14} strokeWidth={2.2} />Create listing</DBtn>}
      </>}>
      <div className="mb-[18px] flex items-center gap-1.5">
        {steps.map((s, i) => (
          <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-surface-sunken">
            <i className="block h-full bg-ink transition-[width] duration-300 ease-nc" style={{ width: i <= step ? "100%" : 0 }} />
          </span>
        ))}
      </div>
      {step === 0 && (<>
        <Field label="Listing title" error={errs.title}><input className={inputCls(!!errs.title)} placeholder="e.g. 3-bedroom flat, New Owerri" value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
        <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
          <Field label="Type"><NCSelect value={f.type} onChange={(v) => set("type", v)} options={["Flat", "Self-contain", "Bungalow", "Duplex", "Mini flat", "Shop / office"]} /></Field>
          <Field label="Rent (₦ / year)" error={errs.price}><input className={inputCls(!!errs.price)} type="number" placeholder="1200000" value={f.price} onChange={(e) => set("price", e.target.value)} /></Field>
          <Field label="Number of flats" hint="Payments are tracked per flat"><input className={inputCls()} type="number" min={1} value={f.flats} onChange={(e) => set("flats", e.target.value)} /></Field>
        </div>
        <Field label="Description"><textarea className={cx(inputCls(), "min-h-[88px] resize-y")} placeholder="What should renters know?" value={f.desc} onChange={(e) => set("desc", e.target.value)} /></Field>
        <Field label="Amenities">
          <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
            {AMENITIES.slice(0, 8).map((a) => (
              <Check key={a} on={f.amenities.includes(a)} onToggle={() => set("amenities", f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a])}>{a}</Check>
            ))}
          </div>
        </Field>
      </>)}
      {step === 1 && (<>
        <p className="mb-3.5 mt-0 text-[13px] leading-normal text-text-tertiary">Pick the structured address — state, LGA, then area. This powers marking-agent broadcasts and search. {/* TODO(backend): full Nigerian geography from @newcondo/db */}</p>
        <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
          <Field label="State" error={errs.state}><NCSelect error={!!errs.state} value={f.state} onChange={(v) => { set("state", v); set("lga", ""); set("area", ""); }} options={Object.keys(DUMMY_GEO)} /></Field>
          <Field label="LGA" error={errs.lga}><NCSelect error={!!errs.lga} value={f.lga} disabled={!f.state} onChange={(v) => { set("lga", v); set("area", ""); }} options={lgas} /></Field>
          <Field label="Area" error={errs.area}><NCSelect error={!!errs.area} value={f.area} disabled={!f.lga} onChange={(v) => set("area", v)} options={areas} /></Field>
        </div>
        <Field label="Street address"><input className={inputCls()} placeholder="12 Chukwuma Nwoha Close" /></Field>
        <MapPlaceholder h={140} tag="Exact boundary is set during marking" />
      </>)}
      {step === 2 && (<>
        {agent && (<>
          <p className="mb-3.5 mt-0 text-[13px] leading-normal text-text-tertiary">You&rsquo;re listing on behalf of the owner. Their bank details create the property&rsquo;s virtual account — rent goes to them, your commission split is automatic.</p>
          <Field label="Owner's full name" error={errs.ownerName}><input className={inputCls(!!errs.ownerName)} placeholder="As on their bank account" value={f.ownerName} onChange={(e) => set("ownerName", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <Field label="Owner's bank"><NCSelect value={f.ownerBank} onChange={(v) => set("ownerBank", v)} options={["GTBank", "Access", "Zenith", "UBA", "First Bank", "Opay"]} /></Field>
            <Field label="Account number" error={errs.ownerAcct}><input className={inputCls(!!errs.ownerAcct)} inputMode="numeric" maxLength={10} placeholder="0123456789" value={f.ownerAcct} onChange={(e) => set("ownerAcct", e.target.value.replace(/\D/g, ""))} /></Field>
          </div>
          <div className="mb-2.5"><Check on={f.consent} onToggle={() => set("consent", !f.consent)}>
            I have <b className="text-text-primary">signed permission from the owner</b> to list this property, and will upload the consent document.{errs.consent && <span className="ml-1 text-danger"> Required</span>}
          </Check></div>
        </>)}
        <Check on={f.undertaking} onToggle={() => set("undertaking", !f.undertaking)}>
          I accept the <b className="text-text-primary">personal legal undertaking</b>: this listing is genuine, I am authorised to list it, and false claims carry legal consequences.{errs.undertaking && <span className="ml-1 text-danger"> Required</span>}
        </Check>
        <div className="mt-3.5">
          <Banner icon="file-text">Proof of ownership {agent ? "and owner consent are" : "is"} uploaded after this step — an admin verifies documents before the listing goes live. {/* TODO(backend): /api/legal-documents/upload */}</Banner>
        </div>
      </>)}
      {step === 3 && (<>
        <KV k="Title" v={f.title || "—"} />
        <KV k="Type · flats" v={`${f.type} · ${f.flats}`} />
        <KV k="Rent" v={f.price ? `${ngn(+f.price)}/year` : "—"} mono />
        <KV k="Address" v={[f.area, f.lga, f.state].filter(Boolean).join(", ") || "—"} />
        {agent && <KV k="Owner" v={`${f.ownerName} · ${f.ownerBank} ••${f.ownerAcct.slice(-4)}`} />}
        <div className="mt-3.5">
          <Banner icon="map-pin"><b className="font-semibold">Next: GPS marking.</b> The listing stays a draft until the property is marked on the map — that&rsquo;s what makes it impossible to double-list.</Banner>
        </div>
      </>)}
    </Modal>
  );
}

function Check({ on, onToggle, children }: { on: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onToggle} className="flex items-start gap-2.5 text-left text-[13px] leading-relaxed text-text-secondary">
      <span className={cx("mt-0.5 grid size-[19px] flex-none place-items-center rounded-md border-[1.5px] transition-colors", on ? "border-ink bg-ink text-cream" : "border-border-strong bg-surface")}>
        {on && <Icon name="check" size={12} strokeWidth={3} />}
      </span>
      <span>{children}</span>
    </button>
  );
}
