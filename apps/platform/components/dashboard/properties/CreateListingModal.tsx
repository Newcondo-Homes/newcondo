"use client";

/* Create-listing wizard — details → address → legal → ownership proof → review.
   AGENT rule: agents may ONLY list for property owners who invited them
   (agent-invite link → OwnerAgentLink). The owner picker is compulsory and
   fed by GET /agent-invites/owners; with no linked owner the wizard is
   replaced by an explainer with instructions to get invited.

   Live: POST /api/v1/properties → DRAFT + boundaryVerified:false. Photos and
   the ownership document are uploaded straight after, once the property has
   an id.

   AFTER CREATING we route to the list the user just changed — My Properties
   for owners, My Listings for agents — NOT to Marking Jobs. Landing on
   Marking hid the thing they had just made and read as "nothing happened". */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { errMsg } from "@/lib/errMsg";
import { toast } from "@newcondo/ui";
import { Modal } from "@/components/dashboard/Modal";
import { DBtn, KV, Banner, MapPlaceholder } from "@/components/dashboard/primitives";
import { PropertyPhotos, type LocalPhoto } from "./PropertyPhotos";
import { ProofOfOwnershipPicker, type LocalDoc } from "./ProofOfOwnership";
import { NCSelect, Field, inputCls } from "@/components/dashboard/NCSelect";
import { ngn } from "@/lib/dashboard/format";
import { useCacheUpdate } from "@/hooks/dashboard/useDashboardData";
// Geography + document rules come from backend-shared, so opening a new state
// is a one-file edit there rather than a code change here.
import { GEO_STATES, lgasIn, areasIn, OWNERSHIP_PROOF, AMENITIES } from "@/lib/constants/business";
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

interface F { title: string; type: string; price: string; flats: string; desc: string; state: string; lga: string; area: string; street: string; amenities: string[]; ownerName: string; ownerBank: string; ownerAcct: string; undertaking: boolean; consent: boolean; }

export function CreateListingModal({ agent, onClose }: { agent?: boolean; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const owners = useLinkedOwners(!!agent);
  const [f, setF] = useState<F>({ title: "", type: "Flat", price: "", flats: "1", desc: "", state: "", lga: "", area: "", street: "", amenities: [], ownerName: "", ownerBank: "", ownerAcct: "", undertaking: false, consent: false });
  const [errs, setErrs] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  // Photos picked before the property exists — uploaded once we have an id.
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  // Proof of ownership is OPTIONAL here: most people don't have the C of O to
  // hand when they're listing. It's enforced later, at the point the property
  // would become visible to other people (mark / share / invite tenant).
  const [proof, setProof] = useState<LocalDoc | null>(null);
  const cache = useCacheUpdate();
  const set = <K extends keyof F>(k: K, v: F[K]) => { setF((x) => ({ ...x, [k]: v })); setErrs((e) => ({ ...e, [k]: null })); };
  const steps = agent
    ? ["Details", "Address", "Owner & legal", "Ownership proof", "Review"]
    : ["Details", "Address", "Legal", "Ownership proof", "Review"];

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
    // step 3 (ownership proof) is intentionally skippable — no validation.
    setErrs(e);
    if (Object.keys(e).length) toast.error("Some fields need attention", { description: "Fix the highlighted fields to continue." });
    return !Object.keys(e).length;
  };
  const next = () => { if (validate() && step < steps.length - 1) setStep(step + 1); };

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
          address: f.street.trim() || undefined,
          undertaking: f.undertaking,
          ...(agent
            ? {
                ownerId: (owners.data ?? []).find((o) => o.ownerName === f.ownerName)?.ownerId,
                ownerConsent: f.consent,
              }
            : {}),
        });

        // Photos and the ownership document were picked before the property
        // existed, so upload them now that we have an id. Neither may fail the
        // listing — the property is created and both can be added later.
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
              description: "Add them from the property's Photos section.",
            });
          }
        }

        if (proof && created?.id) {
          try {
            toast.loading("Uploading ownership document…", { id: toastId });
            const [slot] = await api.presignOwnershipDoc(created.id, {
              name: proof.file.name, type: proof.file.type, size: proof.file.size,
            });
            await fetch(slot.uploadUrl, { method: "PUT", body: proof.file, headers: { "Content-Type": proof.file.type } });
            await api.attachOwnershipDoc(created.id, { key: slot.key, docType: proof.docType });
          } catch {
            toast.error("Listing created, but the ownership document didn't upload", {
              description: "Add it from the property page — marking stays locked until then.",
            });
          }
        }
      } else {
        await new Promise((r) => setTimeout(r, 1200));
      }

      cache.invalidate(["properties", "mine"]);
      cache.invalidate(["properties", "unmarked"]);
      cache.invalidate(["agent", "listings"]);
      toast.success("Listing created", {
        id: toastId,
        description: proof
          ? "It's saved as a draft. Next: GPS-mark the property so it can go live."
          : "It's saved as a draft. Upload proof of ownership to unlock marking, sharing and tenant invites.",
      });
      onClose();
      // Land on the list they just changed, not on Marking Jobs.
      setTimeout(() => router.push(agent ? "/listings" : "/properties"), 200);
    } catch (e) {
      toast.error("Could not create the listing", {
        id: toastId,
        description: errMsg(e, "Please try again."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const lgas = f.state ? lgasIn(f.state) : [];
  const areas = f.state && f.lga ? areasIn(f.state, f.lga) : [];

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
           property's Photos section. Held locally here because the property
           has no id yet; they're uploaded to S3 right after it's created. */}
        <Field label="Photos (optional)" hint="You can also add these later from the property page.">
          <PropertyPhotos files={photos} onFilesChange={setPhotos} cols={4} max={10} />
        </Field>
      </>)}

      {step === 1 && (<>
        <p className="mb-3.5 mt-0 text-[13px] leading-normal text-text-tertiary">Pick the structured address — state, LGA, then area. This powers marking-agent broadcasts and search. Newcondo accepts listings in <b>Imo</b> and <b>Rivers</b> for now; more states open area by area.</p>
        <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
          <Field label="State" error={errs.state}><NCSelect error={!!errs.state} value={f.state} onChange={(v) => { set("state", v); set("lga", ""); set("area", ""); }} options={GEO_STATES} placeholder="Select state…" /></Field>
          <Field label="LGA" error={errs.lga}><NCSelect error={!!errs.lga} value={f.lga} disabled={!f.state} onChange={(v) => { set("lga", v); set("area", ""); }} options={lgas} /></Field>
          <Field label="Area" error={errs.area}><NCSelect error={!!errs.area} value={f.area} disabled={!f.lga} onChange={(v) => set("area", v)} options={areas} /></Field>
        </div>
        <Field label="Street address"><input className={inputCls()} placeholder="12 Chukwuma Nwoha Close" value={f.street} onChange={(e) => set("street", e.target.value)} /></Field>
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
          {/* Caution, not a blocker: they can finish the wizard without the
             document, but nothing that exposes the property to other people
             works until it's uploaded. Saying so here prevents the "why is
             Mark greyed out?" support ticket later. */}
          <Banner tone="warn" icon="triangle-alert">
            <b className="font-semibold">Proof of ownership is required before this property can go live.</b>
            <div className="mt-0.5">
              You can finish this listing without it, but until the document is uploaded and verified you
              won&rsquo;t be able to <b>mark</b>, <b>share</b>, or <b>invite a tenant</b> to this property.
            </div>
          </Banner>
        </div>
      </>)}

      {step === 3 && (<>
        {/* Optional on purpose — few people have the C of O to hand at the
           moment they list. Skipping keeps the listing as a draft they can
           complete later from the property page. */}
        <p className="mb-3.5 mt-0 text-[13px] leading-normal text-text-tertiary">
          Upload the document that proves {agent ? "the owner’s" : "your"} ownership. An admin verifies it before the
          listing goes live. <b className="text-text-primary">You can skip this and add it later</b> from the property page.
        </p>
        <ProofOfOwnershipPicker doc={proof} onChange={setProof} />
        <div className="mt-3.5">
          <Banner icon="file-text">
            Accepted: {OWNERSHIP_PROOF.acceptedDocs.slice(0, 4).join(" · ")} — PDF or photo, up to {OWNERSHIP_PROOF.maxSizeMb}MB.
          </Banner>
        </div>
      </>)}

      {step === 4 && (<>
        <KV k="Title" v={f.title || "—"} />
        <KV k="Type · flats" v={`${f.type} · ${f.flats}`} />
        <KV k="Rent" v={f.price ? `${ngn(+f.price)}/year` : "—"} mono />
        <KV k="Address" v={[f.street, f.area, f.lga, f.state].filter(Boolean).join(", ") || "—"} />
        {agent && <KV k="Owner" v={f.ownerName || "—"} />}
        <KV k="Photos" v={photos.length ? `${photos.length} selected` : "None yet"} />
        <KV k="Ownership proof" v={proof ? proof.file.name : "Not uploaded yet"} />
        <div className="mt-3.5">
          {proof ? (
            <Banner icon="map-pin"><b className="font-semibold">Next: GPS marking.</b> The listing stays a draft until the property is marked on the map — that&rsquo;s what makes it impossible to double-list.</Banner>
          ) : (
            <Banner tone="warn" icon="triangle-alert">
              <b className="font-semibold">No ownership document yet.</b>
              <div className="mt-0.5">The listing will be saved, but marking, sharing and tenant invites stay locked until you upload it from the property page.</div>
            </Banner>
          )}
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
