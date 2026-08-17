"use client";

/* ============================================================
   DeletePropertyModal — the destructive exit, with the right one offered.

   A property has two people attached to it, so "delete" means three
   different things and this modal picks the correct one:

     OWNER, nothing blocking  → permanent delete, behind a typed confirmation.
     OWNER, tenants/payments  → delete refused; Take down offered instead.
                                (Records survive; the listing stops being
                                visible. This is what most people actually
                                mean when they say delete.)
     AGENT                    → they cannot delete the owner's asset. They get
                                "Remove me as listing agent" — the listing
                                survives and reverts to the owner.

   The server enforces all of this in deletePropertyService; the preview call
   just lets us say WHY up front rather than after they've committed.
   ============================================================ */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@newcondo/ui";
import { errMsg } from "@/lib/errMsg";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/dashboard/Modal";
import { DBtn, Banner, KV } from "@/components/dashboard/primitives";
import { inputCls } from "@/components/dashboard/NCSelect";
import { useCacheUpdate } from "@/hooks/dashboard/useDashboardData";
import * as api from "@/lib/api/dashboard";

export function DeletePropertyModal({
  propertyId,
  title,
  isAgent,
  onClose,
}: {
  propertyId: string;
  title: string;
  /** True when the viewer is the listing agent rather than the owner. */
  isAgent: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const cache = useCacheUpdate();
  const [preview, setPreview] = useState<api.DeletePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!api.isLiveBackend) {
      setPreview({ canDelete: !isAgent, isOwner: !isAgent, reason: isAgent ? "Only the property owner can delete this listing." : null, photos: 0, units: 1 });
      setLoading(false);
      return;
    }
    let cancelled = false;
    api.getDeletePreview(propertyId)
      .then((d) => { if (!cancelled) setPreview(d); })
      .catch(() => { if (!cancelled) setPreview(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [propertyId, isAgent]);

  const done = (msg: string, description: string, to: string) => {
    cache.invalidate(["properties", "mine"]);
    cache.invalidate(["properties", "unmarked"]);
    cache.invalidate(["agent", "listings"]);
    toast.success(msg, { description });
    onClose();
    setTimeout(() => router.push(to), 150);
  };

  const run = async (fn: () => Promise<unknown>, msg: string, description: string, to: string) => {
    setBusy(true);
    try {
      if (api.isLiveBackend) await fn();
      else await new Promise((r) => setTimeout(r, 800));
      done(msg, description, to);
    } catch (e) {
      // The service throws human-readable messages (active tenancy, payment
      // history) — show them verbatim rather than a generic failure.
      toast.error("Couldn't complete that", {
        description: errMsg(e, "Please try again."),
      });
      setBusy(false);
    }
  };

  const doDelete = () => run(
    () => api.deletePropertyApi(propertyId),
    "Property deleted",
    `“${title}” and its photos have been removed permanently.`,
    "/properties"
  );

  const doTakeDown = () => run(
    () => api.takeDownPropertyApi(propertyId),
    "Listing taken down",
    `“${title}” is hidden from renters. Every record is intact and you can re-publish anytime.`,
    isAgent ? "/listings" : "/properties"
  );

  const doResign = () => run(
    () => api.resignAsListingAgentApi(propertyId),
    "You're no longer the listing agent",
    `“${title}” has reverted to its owner. It's been removed from your listings.`,
    "/listings"
  );

  /* ---------- AGENT: resign, never delete ---------- */
  if (isAgent) {
    return (
      <Modal
        title="Remove yourself from this listing?"
        sub={title}
        onClose={onClose}
        footer={<>
          <DBtn variant="line" onClick={onClose}>Cancel</DBtn>
          <DBtn variant="danger" onClick={doResign} disabled={busy}>
            {busy ? <><Icon name="loader" size={14} className="animate-spin" />Removing…</> : <><Icon name="user-minus" size={14} />Remove me as agent</>}
          </DBtn>
        </>}
      >
        <div className="mb-4 flex flex-col items-center py-1 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-warn-wash text-warn-ink">
            <Icon name="user-minus" size={26} strokeWidth={2} />
          </span>
          <h3 className="mb-0 mt-3.5 text-[17px] font-bold tracking-[-0.02em]">This property belongs to its owner</h3>
          <p className="mb-0 mt-1.5 max-w-[44ch] text-[13px] leading-normal text-text-tertiary">
            You can step down as listing agent, but only the owner can delete the property itself — its
            marking, tenants and payment history are theirs.
          </p>
        </div>
        <Banner icon="info">
          The listing, its photos and its GPS marking all stay. It reverts to the owner, who can invite
          another agent. Your promo links for it stop working.
        </Banner>
      </Modal>
    );
  }

  const blocked = !loading && preview && !preview.canDelete;
  const confirmed = typed.trim().toLowerCase() === "delete";

  return (
    <Modal
      title={blocked ? "This property can't be deleted" : "Delete this property?"}
      sub={title}
      onClose={onClose}
      footer={<>
        <DBtn variant="line" onClick={onClose}>Cancel</DBtn>
        {blocked ? (
          <DBtn variant="danger" onClick={doTakeDown} disabled={busy}>
            {busy ? <><Icon name="loader" size={14} className="animate-spin" />Taking down…</> : <><Icon name="eye-off" size={14} />Take listing down</>}
          </DBtn>
        ) : (
          <DBtn variant="danger" onClick={doDelete} disabled={busy || loading || !confirmed}>
            {busy ? <><Icon name="loader" size={14} className="animate-spin" />Deleting…</> : <><Icon name="trash-2" size={14} />Delete permanently</>}
          </DBtn>
        )}
      </>}
    >
      {loading ? (
        <div className="h-[120px] animate-pulse rounded-2xl bg-surface-sunken" />
      ) : blocked ? (
        <>
          <div className="mb-4 flex flex-col items-center py-1 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-warn-wash text-warn-ink">
              <Icon name="shield-alert" size={26} strokeWidth={2} />
            </span>
            <h3 className="mb-0 mt-3.5 text-[17px] font-bold tracking-[-0.02em]">There are records to protect</h3>
            <p className="mb-0 mt-1.5 max-w-[44ch] text-[13px] leading-normal text-text-tertiary">{preview?.reason}</p>
          </div>
          <Banner icon="eye-off">
            <b className="font-semibold">Take the listing down instead.</b>
            <div className="mt-0.5">
              It stops appearing to renters and all promo links pause — but the tenancy, payments and GPS
              marking stay exactly as they are. You can re-publish it at any time.
            </div>
          </Banner>
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-col items-center py-1 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-danger/10 text-danger">
              <Icon name="trash-2" size={26} strokeWidth={2} />
            </span>
            <h3 className="mb-0 mt-3.5 text-[17px] font-bold tracking-[-0.02em]">This can&rsquo;t be undone</h3>
            <p className="mb-0 mt-1.5 max-w-[44ch] text-[13px] leading-normal text-text-tertiary">
              The property and everything attached to it is removed permanently — including the photos
              stored in the cloud.
            </p>
          </div>

          <KV k="Photos deleted" v={preview?.photos ?? 0} />
          <KV k="Flats removed" v={preview?.units ?? 0} />
          <KV k="GPS marking" v="Erased — the building can be marked again" />

          <div className="mt-4">
            <label className="mb-1.5 block text-[13px] font-semibold text-text-primary">
              Type <b className="font-mono">delete</b> to confirm
            </label>
            <input
              className={inputCls()}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="delete"
              autoComplete="off"
            />
          </div>

          <div className="mt-3">
            <Banner icon="info">
              Prefer to keep the records? <b className="font-semibold">Take it down</b> from the property page
              instead — same result for renters, nothing lost.
            </Banner>
          </div>
        </>
      )}
    </Modal>
  );
}
