"use client";

/* ============================================================
   Proof of ownership — picker (wizard) + section (property page)

   WHY IT'S OPTIONAL AT CREATION: almost nobody has their C of O to hand
   at the moment they decide to list. Blocking creation on it loses the
   listing entirely. Instead the document gates the actions that expose
   the property to OTHER people — marking, sharing, tenant invites — so
   an undocumented property simply sits as a private draft.

   Two exports:
     • ProofOfOwnershipPicker — local file choice for the create-listing
       wizard, where the property has no id yet. Handed back to the
       parent, which uploads after creation.
     • ProofOfOwnershipSection — live upload / replace / download /
       delete on an existing property, with verification status.

   Uploads use the same presigned direct-to-S3 route as photos, so a
   15MB scan never passes through Express. Downloads use a short-lived
   signed GET — ownership documents are sensitive and must never sit
   behind a public url.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { toast } from "@newcondo/ui";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { errMsg } from "@/lib/errMsg";
import { DBtn, Banner } from "@/components/dashboard/primitives";
import { Modal } from "@/components/dashboard/Modal";
import { NCSelect, Field } from "@/components/dashboard/NCSelect";
import { OWNERSHIP_PROOF } from "@/lib/constants/business";
import * as api from "@/lib/api/dashboard";

const ACCEPT = OWNERSHIP_PROOF.acceptedMime.join(",");
const MAX_BYTES = OWNERSHIP_PROOF.maxSizeMb * 1024 * 1024;

export interface LocalDoc { file: File; docType: string }

function validateFile(file: File): string | null {
  if (!(OWNERSHIP_PROOF.acceptedMime as readonly string[]).includes(file.type)) {
    return "Upload a PDF or a photo of the document";
  }
  if (file.size > MAX_BYTES) return `That file is larger than ${OWNERSHIP_PROOF.maxSizeMb}MB`;
  return null;
}

const prettySize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)}MB` : `${Math.round(b / 1024)}KB`);

/* ============================================================
   1. Picker — create-listing wizard (no property id yet)
   ============================================================ */
export function ProofOfOwnershipPicker({
  doc,
  onChange,
}: {
  doc: LocalDoc | null;
  onChange: (d: LocalDoc | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Explicit <string>: acceptedDocs is a readonly literal tuple, so inference
  // would narrow this to the FIRST entry's literal type and reject every other
  // option the picker offers.
  const [docType, setDocType] = useState<string>(doc?.docType ?? OWNERSHIP_PROOF.acceptedDocs[0]);

  const pick = (file?: File) => {
    if (!file) return;
    const err = validateFile(file);
    if (err) { toast.error(err); return; }
    onChange({ file, docType });
  };

  return (
    <div>
      <Field label="Document type">
        <NCSelect
          value={docType}
          onChange={(v) => { setDocType(v); if (doc) onChange({ ...doc, docType: v }); }}
          options={[...OWNERSHIP_PROOF.acceptedDocs]}
        />
      </Field>

      {doc ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border-hair bg-surface-sunken px-4 py-3.5">
          <span className="grid size-10 flex-none place-items-center rounded-xl bg-surface text-ink">
            <Icon name={doc.file.type === "application/pdf" ? "file-text" : "image"} size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <b className="block truncate text-[13.5px] font-semibold">{doc.file.name}</b>
            <span className="text-[12px] text-text-tertiary">{doc.docType} · {prettySize(doc.file.size)}</span>
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove document"
            className="grid size-8 flex-none place-items-center rounded-full text-text-tertiary transition-colors hover:cursor-pointer hover:bg-black/5 hover:text-ink"
          >
            <Icon name="x" size={15} strokeWidth={2.2} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-1.5 rounded-2xl border border-dashed border-nc-border bg-surface px-4 py-7 text-text-tertiary transition-colors hover:cursor-pointer hover:border-ink hover:text-ink"
        >
          <Icon name="upload" size={22} />
          <b className="text-[13.5px] font-semibold">Upload document</b>
          <span className="text-[12px]">PDF or photo · up to {OWNERSHIP_PROOF.maxSizeMb}MB · optional for now</span>
        </button>
      )}

      <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}

/* ============================================================
   2. Section — existing property (upload / replace / download / delete)
   ============================================================ */
export function ProofOfOwnershipSection({
  propertyId,
  canEdit = true,
}: {
  propertyId: string;
  /** False for viewers who aren't the owner or listing agent. */
  canEdit?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [doc, setDoc] = useState<api.OwnershipDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [docType, setDocType] = useState<string>(OWNERSHIP_PROOF.acceptedDocs[0]);

  useEffect(() => {
    if (!api.isLiveBackend) { setLoading(false); return; }
    let cancelled = false;
    api.getOwnershipDoc(propertyId)
      .then((d) => { if (!cancelled) { setDoc(d); if (d?.docType) setDocType(d.docType); } })
      .catch(() => { /* no document is a normal state, not an error */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [propertyId]);

  const upload = async (file?: File) => {
    if (!file) return;
    const err = validateFile(file);
    if (err) { toast.error(err); return; }
    setBusy(true);
    try {
      const [slot] = await api.presignOwnershipDoc(propertyId, { name: file.name, type: file.type, size: file.size });
      const put = await fetch(slot.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);
      const next = await api.attachOwnershipDoc(propertyId, { key: slot.key, docType });
      setDoc(next);
      toast.success(doc ? "Document replaced" : "Proof of ownership uploaded", {
        description: "An admin reviews it within 24 hours. Marking and sharing unlock once it's verified.",
      });
    } catch (e) {
      toast.error("Could not upload", { description: errMsg(e, "Please try again.") });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    if (!doc) return;
    setBusy(true);
    try {
      await api.deleteOwnershipDoc(propertyId);
      setDoc(null);
      toast.success("Document removed", { description: "Marking, sharing and tenant invites are locked again." });
    } catch {
      toast.error("Could not remove the document");
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!doc) return;
    try {
      // Signed, short-lived url — ownership papers must not sit on a public
      // link, so we mint one per download instead of storing a permanent url.
      const { url } = await api.getOwnershipDocUrl(propertyId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open the document");
    }
  };

  const status = doc?.status ?? "MISSING";
  const tone: Record<string, { label: string; cls: string; icon: string }> = {
    MISSING: { label: "Not uploaded", cls: "bg-surface-sunken text-text-tertiary", icon: "triangle-alert" },
    PENDING: { label: "Awaiting verification", cls: "bg-warn-wash text-warn-ink", icon: "clock" },
    APPROVED: { label: "Verified", cls: "bg-green-wash text-green-dark", icon: "shield-check" },
    REJECTED: { label: "Rejected", cls: "bg-danger/10 text-danger", icon: "x-circle" },
  };
  const s = tone[status] ?? tone.MISSING;

  return (
    <section className="rounded-card border border-border-hair bg-surface p-5 shadow-card max-sm:p-4">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <h3 className="m-0 text-[15px] font-bold tracking-[-0.02em]">Proof of ownership</h3>
        <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.05em]", s.cls)}>
          <Icon name={s.icon} size={12} strokeWidth={2.4} />{s.label}
        </span>
      </div>

      {loading ? (
        <div className="h-[74px] animate-pulse rounded-2xl bg-surface-sunken" />
      ) : doc ? (
        <>
          <div className="flex items-center gap-3 rounded-2xl border border-border-hair bg-surface-sunken px-4 py-3.5 max-sm:flex-wrap">
            <span className="grid size-10 flex-none place-items-center rounded-xl bg-surface text-ink">
              <Icon name={doc.mime === "application/pdf" ? "file-text" : "image"} size={18} />
            </span>
            <span className="min-w-0 flex-1 max-sm:basis-[60%]">
              <b className="block truncate text-[13.5px] font-semibold">{doc.name}</b>
              <span className="text-[12px] text-text-tertiary">
                {doc.docType}{doc.uploadedAt ? ` · ${new Date(doc.uploadedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}` : ""}
              </span>
            </span>
            <span className="flex flex-none gap-1.5 max-sm:w-full max-sm:justify-end">
              <IconBtn name="download" label="Download" onClick={download} />
              {canEdit && <IconBtn name="repeat" label="Replace" onClick={() => inputRef.current?.click()} disabled={busy} />}
              {canEdit && <IconBtn name="trash-2" label="Delete" danger onClick={remove} disabled={busy} />}
            </span>
          </div>
          {status === "REJECTED" && doc.rejectionReason && (
            <div className="mt-3"><Banner tone="warn" icon="x-circle"><b className="font-semibold">Rejected:</b> {doc.rejectionReason}</Banner></div>
          )}
        </>
      ) : (
        <>
          {canEdit && (
            <div className="mb-3">
              <Field label="Document type">
                <NCSelect value={docType} onChange={setDocType} options={[...OWNERSHIP_PROOF.acceptedDocs]} />
              </Field>
            </div>
          )}
          <button
            type="button"
            onClick={() => canEdit && inputRef.current?.click()}
            disabled={!canEdit || busy}
            className={cx(
              "flex w-full flex-col items-center gap-1.5 rounded-2xl border border-dashed border-nc-border bg-surface px-4 py-7 text-text-tertiary transition-colors",
              canEdit && !busy && "hover:cursor-pointer hover:border-ink hover:text-ink"
            )}
          >
            {busy ? <Icon name="loader" size={22} className="animate-spin" /> : <Icon name="upload" size={22} />}
            <b className="text-[13.5px] font-semibold">{busy ? "Uploading…" : "Upload proof of ownership"}</b>
            <span className="text-[12px]">PDF or photo · up to {OWNERSHIP_PROOF.maxSizeMb}MB</span>
          </button>
          <div className="mt-3">
            <Banner tone="warn" icon="triangle-alert">
              <b className="font-semibold">Marking, sharing and tenant invites are locked.</b>
              <div className="mt-0.5">Upload this document to unlock them — an admin verifies it within 24 hours.</div>
            </Banner>
          </div>
        </>
      )}

      <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={(e) => upload(e.target.files?.[0])} />
    </section>
  );
}

function IconBtn({ name, label, onClick, danger, disabled }: { name: string; label: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cx(
        "grid size-9 place-items-center rounded-full transition-colors disabled:opacity-50",
        danger ? "text-danger hover:bg-danger/10" : "text-text-secondary hover:bg-black/5 hover:text-ink",
        !disabled && "hover:cursor-pointer"
      )}
    >
      <Icon name={name} size={16} strokeWidth={2} />
    </button>
  );
}

/* ============================================================
   3. Gate — one place that decides whether an action is allowed
   ============================================================ */
export function useOwnershipGate(propertyId: string) {
  const [doc, setDoc] = useState<api.OwnershipDoc | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!api.isLiveBackend) { setReady(true); return; }
    let cancelled = false;
    api.getOwnershipDoc(propertyId)
      .then((d) => { if (!cancelled) setDoc(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setReady(true); });
  }, [propertyId]);
  // A REJECTED document is treated as missing — it proves nothing.
  const hasProof = doc?.status === "APPROVED" || doc?.status === "PENDING";
  return { ready, doc, hasProof };
}

/** Blocking modal shown when a gated action is attempted without a document. */
export function OwnershipRequiredModal({
  action,
  onClose,
  onUpload,
}: {
  action: "mark" | "share" | "invite a tenant";
  onClose: () => void;
  onUpload: () => void;
}) {
  return (
    <Modal
      title="Upload proof of ownership first"
      sub={`You can't ${action} until this property is documented`}
      onClose={onClose}
      footer={<>
        <DBtn variant="line" onClick={onClose}>Not now</DBtn>
        <DBtn onClick={onUpload}><Icon name="upload" size={14} strokeWidth={2.2} />Upload document</DBtn>
      </>}
    >
      <div className="flex flex-col items-center py-2 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-warn-wash text-warn-ink">
          <Icon name="shield-alert" size={26} strokeWidth={2} />
        </span>
        <h3 className="mb-0 mt-3.5 text-[17px] font-bold tracking-[-0.02em]">This property isn&rsquo;t documented yet</h3>
        <p className="mb-0 mt-1.5 max-w-[44ch] text-[13px] leading-normal text-text-tertiary">
          Marking, sharing and tenant invites all put this property in front of other people, so Newcondo
          requires proof that it&rsquo;s yours to list. It protects you as much as them.
        </p>
      </div>
      <div className="mt-4">
        <Banner icon="file-text">
          Accepted: {OWNERSHIP_PROOF.acceptedDocs.slice(0, 4).join(" · ")} — PDF or photo, up to {OWNERSHIP_PROOF.maxSizeMb}MB.
          Verification takes up to 24 hours.
        </Banner>
      </div>
    </Modal>
  );
}
