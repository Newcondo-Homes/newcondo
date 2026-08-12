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
import { toast } from "@newcondo/ui";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
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
        description: (e as Error)?.message ?? "Check your connection and try again.",
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
        {shown.map((p) => (
          <div key={p.key} className="group relative aspect-square overflow-hidden rounded-[14px] bg-surface-sunken">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="h-full w-full object-cover" />
            {p.isCover && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-cream">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={p.onRemove}
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
              ? "JPEG, PNG or WebP · up to 8MB each. The first photo becomes the cover."
              : `${count} of ${max} photos · the first is the cover.`}
      </p>
    </div>
  );
}
