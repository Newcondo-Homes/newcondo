"use client";

/* ============================================================
   PropertyPhotos — real S3 photo upload + gallery.

   Replaces the PhotoGrid placeholder wherever photos are actually
   stored. Two modes:

     • With `propertyId` — live mode. Loads existing photos, uploads
       new ones straight to S3 (presigned PUT), deletes.
     • Without `propertyId` — DEFERRED mode for the Create-listing
       wizard, where the property doesn't exist yet. Files are held in
       local state with object-URL previews and handed back through
       `onFilesChange`; the wizard uploads them after the property is
       created and it finally has an id.

   The upload itself is a direct browser → S3 PUT, so a slow phone
   connection never holds an Express socket open and there's no
   body-size limit to tune. We upload files in parallel but surface a
   single progress count, because per-file bars on 10 photos is noise.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@newcondo/ui";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { errMsg } from "@/lib/errMsg";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import * as api from "@/lib/api/dashboard";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic";

export interface LocalPhoto { file: File; url: string }

export function PropertyPhotos({
  propertyId,
  files,
  onFilesChange,
  max = 20,
  cols = 4,
  className,
}: {
  /** Live mode when set; deferred mode when omitted. */
  propertyId?: string;
  /** Deferred mode only — the files held by the parent. */
  files?: LocalPhoto[];
  onFilesChange?: (next: LocalPhoto[]) => void;
  max?: number;
  cols?: number;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [remote, setRemote] = useState<api.PropertyPhoto[]>([]);
  const [loading, setLoading] = useState(!!propertyId);
  const [busy, setBusy] = useState(0); // count of in-flight uploads
  // Index of the photo shown full-screen, or null. Lightbox lives here (not
  // in the card) so arrow-key paging can see the whole list.
  const [viewing, setViewing] = useState<number | null>(null);

  /* ---- live mode: load existing photos ---- */
  useEffect(() => {
    if (!propertyId || !api.isLiveBackend) { setLoading(false); return; }
    let cancelled = false;
    api.getPropertyPhotos(propertyId)
      .then((p) => { if (!cancelled) setRemote(p); })
      .catch(() => { /* empty gallery is a valid state — no toast on load */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [propertyId]);

  // Object URLs must be revoked or the blobs leak for the page's lifetime.
  useEffect(() => {
    return () => { (files ?? []).forEach((f) => URL.revokeObjectURL(f.url)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const count = propertyId ? remote.length : (files?.length ?? 0);

  const validate = (list: File[]) => {
    const ok: File[] = [];
    for (const f of list) {
      if (!ACCEPT.includes(f.type)) { toast.error(`${f.name}: only JPEG, PNG, WebP or HEIC`); continue; }
      if (f.size > MAX_BYTES) { toast.error(`${f.name} is larger than 8MB`); continue; }
      ok.push(f);
    }
    if (count + ok.length > max) {
      toast.error(`Up to ${max} photos per property`);
      return ok.slice(0, Math.max(0, max - count));
    }
    return ok;
  };

  const pick = useCallback(async (list: FileList | null) => {
    const chosen = validate(Array.from(list ?? []));
    if (!chosen.length) return;

    /* ---- deferred: keep locally, upload after the property exists ---- */
    if (!propertyId) {
      onFilesChange?.([...(files ?? []), ...chosen.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
      return;
    }

    /* ---- live: presign → PUT to S3 → attach keys ---- */
    setBusy(chosen.length);
    try {
      const slots = await api.presignPropertyPhotos(
        propertyId,
        chosen.map((f) => ({ name: f.name, type: f.type, size: f.size }))
      );
      await Promise.all(
        slots.map((slot, i) =>
          fetch(slot.uploadUrl, {
            method: "PUT",
            body: chosen[i],
            headers: { "Content-Type": chosen[i].type },
          }).then((r) => {
            // A failed PUT is usually missing bucket CORS — say so, because
            // the browser's own error is opaque.
            if (!r.ok) throw new Error(`Upload failed (${r.status})`);
          })
        )
      );
      const { photos } = (await api.attachPropertyPhotos(propertyId, slots.map((s) => s.key))) ?? { photos: [] };
      setRemote(photos ?? []);
      toast.success(chosen.length === 1 ? "Photo added" : `${chosen.length} photos added`);
    } catch (e) {
      toast.error("Could not upload", {
        description: errMsg(e, "Check your connection and try again."),
      });
    } finally {
      setBusy(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [propertyId, files, onFilesChange, count, max]);

  const removeLocal = (i: number) => {
    const next = [...(files ?? [])];
    URL.revokeObjectURL(next[i].url);
    next.splice(i, 1);
    onFilesChange?.(next);
  };

  const removeRemote = async (photo: api.PropertyPhoto) => {
    if (!propertyId) return;
    const prev = remote;
    setRemote((r) => r.filter((p) => p.id !== photo.id)); // optimistic
    try {
      const { photos } = (await api.deletePropertyPhoto(propertyId, photo.id)) ?? { photos: [] };
      setRemote(photos ?? []);
    } catch {
      setRemote(prev);
      toast.error("Could not remove that photo");
    }
  };

  const shown: { key: string; url: string; isCover?: boolean; onRemove: () => void }[] = propertyId
    ? remote.map((p) => ({ key: p.id, url: p.url, isCover: p.isCover, onRemove: () => removeRemote(p) }))
    : (files ?? []).map((f, i) => ({ key: f.url, url: f.url, isCover: i === 0, onRemove: () => removeLocal(i) }));

  return (
    <div className={className}>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols},minmax(0,1fr))` }}>
        {shown.map((p, i) => (
          <div key={p.key} className="group relative aspect-square overflow-hidden rounded-[14px] bg-surface-sunken">
            {/* The tile itself opens the lightbox; the X stops propagation so
                removing never also opens the viewer. */}
            <button type="button" onClick={() => setViewing(i)} aria-label="View photo" className="block size-full cursor-zoom-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-full w-full object-cover transition-transform duration-[600ms] ease-nc group-hover:scale-[1.04]" />
            </button>
            {p.isCover && (
              <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-cream">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); p.onRemove(); }}
              aria-label="Remove photo"
              className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-ink/80 text-cream opacity-0 transition-opacity duration-200 ease-nc hover:bg-ink focus-visible:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
            >
              <Icon name="x" size={13} strokeWidth={2.4} />
            </button>
          </div>
        ))}

        {/* add tile */}
        {count < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy > 0}
            className={cx(
              "grid aspect-square place-items-center rounded-[14px] border border-dashed border-nc-border bg-surface text-text-tertiary transition-colors duration-200 ease-nc",
              busy > 0 ? "cursor-wait" : "hover:cursor-pointer hover:border-ink hover:text-ink"
            )}
          >
            {busy > 0 ? (
              <Icon name="loader" size={20} className="animate-spin" />
            ) : (
              <span className="flex flex-col items-center gap-1">
                <Icon name="image-plus" size={20} />
                <span className="text-[11px] font-semibold">Add</span>
              </span>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => pick(e.target.files)}
      />

      <p className="m-0 mt-2 text-[12px] text-text-tertiary">
        {loading
          ? "Loading photos…"
          : busy > 0
            ? `Uploading ${busy} photo${busy === 1 ? "" : "s"}…`
            : count === 0
              ? `JPEG, PNG or WebP · up to 8MB each · max ${max}. The first photo becomes the cover.`
              : `${count} of ${max} photos · the first is the cover.`}
      </p>

      <PhotoLightbox
        photos={shown}
        index={viewing}
        onClose={() => setViewing(null)}
        onIndex={setViewing}
        onDelete={async (i) => {
          await shown[i].onRemove();
          // Step back so we land on a photo that still exists; close when the
          // gallery is now empty.
          setViewing(shown.length <= 1 ? null : Math.max(0, i - 1));
        }}
      />
    </div>
  );
}

/* ============================================================
   PhotoLightbox — full-screen viewer with permanent delete.

   Portaled to <body> so it escapes any transformed/overflow-hidden
   ancestor (a property page inside a card would otherwise clip it), and
   scroll-locked with the same hook the modals use.

   Delete here is PERMANENT: it removes the S3 object as well as the row,
   so the confirm step is not ceremony — there is no undo.
   ============================================================ */
function PhotoLightbox({
  photos,
  index,
  onClose,
  onIndex,
  onDelete,
}: {
  photos: { key: string; url: string; isCover?: boolean }[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
  onDelete: (i: number) => Promise<void> | void;
}) {
  const open = index != null && !!photos[index];
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useBodyScrollLock(open);

  useEffect(() => { setConfirming(false); }, [index]);

  useEffect(() => {
    if (!open || index == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < photos.length - 1) onIndex(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, photos.length, onClose, onIndex]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && index != null && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col bg-ink/92 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog" aria-modal="true" aria-label="Photo viewer"
        >
          {/* top bar */}
          <div className="flex flex-none items-center justify-between gap-3 px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-3">
            <span className="text-[13px] font-semibold text-cream/80">{index + 1} / {photos.length}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirming(true)}
                disabled={deleting}
                aria-label="Delete photo"
                className="grid size-10 place-items-center rounded-full bg-cream/10 text-cream transition-colors hover:cursor-pointer hover:bg-danger disabled:opacity-50"
              >
                {deleting ? <Icon name="loader" size={17} className="animate-spin" /> : <Icon name="trash-2" size={17} strokeWidth={2} />}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-10 place-items-center rounded-full bg-cream/10 text-cream transition-colors hover:cursor-pointer hover:bg-cream/20"
              >
                <Icon name="x" size={18} strokeWidth={2.2} />
              </button>
            </div>
          </div>

          {/* image */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={photos[index].key}
              src={photos[index].url}
              alt=""
              className="max-h-full max-w-full rounded-2xl object-contain"
            />

            {index > 0 && (
              <button
                type="button" onClick={() => onIndex(index - 1)} aria-label="Previous photo"
                className="absolute left-3 grid size-11 place-items-center rounded-full bg-ink/60 text-cream transition-colors hover:cursor-pointer hover:bg-ink"
              ><Icon name="chevron-left" size={20} strokeWidth={2.2} /></button>
            )}
            {index < photos.length - 1 && (
              <button
                type="button" onClick={() => onIndex(index + 1)} aria-label="Next photo"
                className="absolute right-3 grid size-11 place-items-center rounded-full bg-ink/60 text-cream transition-colors hover:cursor-pointer hover:bg-ink"
              ><Icon name="chevron-right" size={20} strokeWidth={2.2} /></button>
            )}
          </div>

          {/* delete confirm — permanent, so it asks once */}
          <AnimatePresence>
            {confirming && (
              <motion.div
                className="absolute inset-0 z-10 grid place-items-center bg-ink/70 px-5"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <div className="w-full max-w-[380px] rounded-3xl bg-surface p-6 text-center shadow-pop">
                  <span className="mx-auto grid size-12 place-items-center rounded-full bg-danger/10 text-danger">
                    <Icon name="trash-2" size={22} strokeWidth={2} />
                  </span>
                  <h3 className="mb-0 mt-3.5 text-[17px] font-bold tracking-[-0.02em]">Delete this photo?</h3>
                  <p className="mb-0 mt-1.5 text-[13px] leading-normal text-text-tertiary">
                    It will be removed from storage permanently. This can&rsquo;t be undone.
                  </p>
                  <div className="mt-5 flex gap-2.5">
                    <button
                      type="button" onClick={() => setConfirming(false)}
                      className="flex-1 rounded-full border border-border-strong py-3 text-[14px] font-semibold text-ink transition-colors hover:cursor-pointer hover:bg-surface-sunken"
                    >Cancel</button>
                    <button
                      type="button"
                      onClick={async () => {
                        setDeleting(true);
                        try { await onDelete(index); } finally { setDeleting(false); setConfirming(false); }
                      }}
                      className="flex-1 rounded-full bg-danger py-3 text-[14px] font-semibold text-cream transition-colors hover:cursor-pointer hover:brightness-110"
                    >Delete</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
