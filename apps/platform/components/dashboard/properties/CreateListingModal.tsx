"use client";

/* Create-listing wizard — details → structured address → legal → review.
   Agents provide the owner's identity + bank (creates the property's
/* Create-listing wizard.
   AGENT rule: agents may ONLY list for property owners who invited them
   (agent-invite link → OwnerAgentLink). The owner picker is compulsory and
   fed by GET /agent-invites/owners; with no linked owner the wizard is
   replaced by an explainer with instructions to get invited.
   Live: POST /api/properties (S3 images) — creates DRAFT then routes to marking. */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast } from "@newcondo/ui";
import { Modal } from "@/components/dashboard/Modal";
import { DBtn, KV, Banner, MapPlaceholder } from "@/components/dashboard/primitives";
import { PropertyPhotos, type LocalPhoto } from "./PropertyPhotos";
import { NCSelect, Field, inputCls } from "@/components/dashboard/NCSelect";
import { ngn } from "@/lib/dashboard/format";
import { useCacheUpdate } from "@/hooks/dashboard/useDashboardData";
import { DUMMY_GEO, AMENITIES } from "@/lib/dashboard/data";
import * as api from "@/lib/api/dashboard";

/* Owners this agent is linked to (accepted agent-invite links). */
export function useLinkedOwners(enabled: boolean) {
  return useQuery<{ ownerId: string; ownerName: string }[]>({
    queryKey: ["agent", "linked-owners"],
    enabled,
    queryFn: async () => {
      if (!api.isLiveBackend) return [{ ownerId: "u_own_01", ownerName: "Adaeze Okafor" }, { ownerId: "u_own_02", ownerName: "Chinedu Okafor" }];
      try { return await api.getLinkedOwners(); } catch { return []; }
    },
  });
}

interface F { title: string; type: string; price: string; flats: string; desc: string; state: string; lga: string; area: string; amenities: string[]; ownerName: string; ownerBank: string; ownerAcct: string; undertaking: boolean; consent: boolean; }

export function CreateListingModal({ agent, onClose }: { agent?: boolean; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const owners = useLinkedOwners(!!agent);
  const [f, setF] = useState<F>({ title: "", type: "Flat", price: "", flats: "1", desc: "", state: "", lga: "", area: "", amenities: [], ownerName: "", ownerBank: "", ownerAcct: "", undertaking: false, consent: false });
  const [errs, setErrs] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  // Photos picked before the property exists — uploaded once we have an id.
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const cache = useCacheUpdate();
  const set = <K extends keyof F>(k: K, v: F[K]) => { setF((x) => ({ ...x, [k]: v })); setErrs((e) => ({ ...e, [k]: null })); };
  const steps = agent ? ["Details", "Address", "Owner & legal", "Review"] : ["Details", "Address", "Legal", "Review"];
  // Gate: an agent with NO linked owner can't list — explain how invites work.
  if (agent && !owners.isLoading && (owners.data ?? []).length === 0) {
    return (
      <Modal title="You need an owner's invitation to list" sub="Listings are always tied to a registered property owner — rent settles to their account, your commission split is automatic." onClose={onClose}
        footer={<DBtn onClick={onClose}>Got it</DBtn>}>
        <div className="flex flex-col gap-2.5">
          {[["1", "The property owner creates a Newcondo owner account and picks a plan."], ["2", "From their dashboard they tap “Invite agent” and send you the invite link."], ["3", "You accept the link with your agent account — the owner then appears in this form and you can list their properties."]].map(([n, t]) => (
            <div key={n} className="flex items-start gap-3 rounded-2xl border border-border-hair px-4 py-3">
              <span className="grid size-7 flex-none place-items-center rounded-full bg-ink text-[12px] font-bold text-cream">{n}</span>
              <span className="text-[13.5px] leading-relaxed text-text-secondary">{t}</span>
            </div>
          ))}
        </div>
        <div className="mt-3.5"><Banner icon="info">Share this with your owner: they can invite you in under a minute from <b>My Properties → Invite agent</b>.</Banner></div>
      </Modal>
    );
  }
  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0) { if (!f.title.trim()) e.title = "Give the listing a title"; if (!f.price || +f.price <= 0) e.price = "Enter the yearly rent"; }
    if (step === 1) { if (!f.state) e.state = "Pick a state"; if (!f.lga) e.lga = "Pick an LGA"; if (!f.area) e.area = "Pick an area"; }
    if (step === 2) {
      if (agent) { if (!f.ownerName) e.ownerName = "Choose the property owner — you can only list for owners who invited you"; if (!f.consent) e.consent = "Required"; }
      if (!f.undertaking) e.undertaking = "Required";
    }
    setErrs(e);
    if (Object.keys(e).length) toast.error("Some fields need attention", { description: "Fix the highlighted fields to continue." });
    return !Object.keys(e).length;
  };
  const next = () => { if (validate() && step < steps.length - 1) setStep(step + 1); };

  /* Real create. The listing is born DRAFT + unmarked server-side, so the
     success copy routes the user straight to marking — that's the step that
     actually makes it listable. Invalidating ["properties","mine"] and
     ["properties","unmarked"] makes it appear in My Properties AND in the
     Request-marking Property dropdown without a refresh. */
  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const toastId = toast.loading("Creating listing…");
    try {
      if (api.isLiveBackend) {
        const created = await api.createPropertyApi({
          title: f.title.trim(),
          propertyType: f.type,
          price: Number(f.price),
          unitCount: Math.max(1, Number(f.flats) || 1),
          description: f.desc.trim() || undefined,
          amenities: f.amenities,
          state: f.state,
          lga: f.lga,
          area: f.area,
          undertaking: f.undertaking,
          ...(agent
            ? {
                ownerId: (owners.data ?? []).find((o) => o.ownerName === f.ownerName)?.ownerId,
                ownerConsent: f.consent,
              }
            : {}),
        });

        // Photos were picked before the property existed, so upload them now
        // that we have an id. A photo failure must NOT fail the listing —
        // the property is already created and they can add photos later.
        if (photos.length && created?.id) {
          try {
            toast.loading(`Uploading ${photos.length} photo${photos.length === 1 ? "" : "s"}…`, { id: toastId });
            const slots = await api.presignPropertyPhotos(
              created.id,
              photos.map((p) => ({ name: p.file.name, type: p.file.type, size: p.file.size }))
            );
            await Promise.all(
              slots.map((s, i) =>
                fetch(s.uploadUrl, { method: "PUT", body: photos[i].file, headers: { "Content-Type": photos[i].file.type } })
              )
            );
            await api.attachPropertyPhotos(created.id, slots.map((s) => s.key));
          } catch {
            toast.error("Listing created, but the photos didn't upload", {
              description: "Add them from the property's Photos tab.",
            });
          }
        }
      } else {
        await new Promise((r) => setTimeout(r, 1200));
      }
      cache.invalidate(["properties", "mine"]);
      cache.invalidate(["properties", "unmarked"]);
      toast.success("Listing created as a draft", {
        id: toastId,
        description: "Next: GPS-mark the property so it can go live.",
      });
      onClose();
      setTimeout(() => router.push("/marking"), 200);
    } catch (e) {
      toast.error("Could not create the listing", {
        id: toastId,
        description: (e as { message?: string })?.message ?? "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };
  const lgas = f.state ? Object.keys(DUMMY_GEO[f.state] ?? {}) : [];
  const areas = f.state && f.lga ? DUMMY_GEO[f.state]?.[f.lga] ?? [] : [];
  return (
    <Modal wide title={agent ? "List a property for an owner" : "List your property"} sub={`Step ${step + 1} of ${steps.length} — ${steps[step]}`} onClose={onClose}
      footer={<>
        {step > 0 && <DBtn variant="line" onClick={() => setStep(step - 1)}>Back</DBtn>}
        {step < steps.length - 1
          ? <DBtn onClick={next}>Continue<Icon name="arrow-right" size={14} strokeWidth={2.2} /></DBtn>
          : <DBtn onClick={submit} disabled={submitting}>
              {submitting
                ? <><Icon name="loader" size={14} className="animate-spin" />Creating…</>
                : <><Icon name="check" size={14} strokeWidth={2.2} />Create listing</>}
            </DBtn>}
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
        {/* Optional at creation — photos can also be added later from the
           property's Photos tab. Held locally here because the property
           has no id yet; they're uploaded to S3 right after it's created. */}
        <Field label="Photos (optional)" hint="You can also add these later from the property page.">
          <PropertyPhotos files={photos} onFilesChange={setPhotos} cols={4} max={10} />
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
          <p className="mb-3.5 mt-0 text-[13px] leading-normal text-text-tertiary">Pick the registered owner this listing belongs to. Rent settles to <b>their</b> Newcondo account; your commission split is enforced automatically.</p>
          <Field label="Property owner (compulsory)" error={errs.ownerName} hint="Only owners who invited you appear here. Missing one? Ask them to send you an agent-invite link.">
            <NCSelect error={!!errs.ownerName} value={f.ownerName} onChange={(v) => set("ownerName", v)} placeholder="Choose the property owner…"
              options={(owners.data ?? []).map((o) => o.ownerName)} />
          </Field>
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
        {agent && <KV k="Owner" v={f.ownerName || "—"} />}
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
