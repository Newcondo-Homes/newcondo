"use client";

/* ============================================================
   BrowseGrid — the public property browse experience.

   WHO SEES IT: owners, agents and renters all browse the same grid.
   The only role difference is the Promote button, which appears for
   AGENT accounts only (see BrowsePropertyCard).

   WHAT'S IN IT: only PUBLISHED + boundaryVerified + admin-APPROVED
   properties. That rule is enforced server-side in
   publicBrowseService.browseProperties() — the client never filters for
   it, so an unmarked property can't leak into the grid through a
   crafted request. "Only marked properties can be listed" is therefore
   a data invariant here, not a UI concern.

   DATA: useBrowse(filters) → GET /api/v1/properties/browse (Redis-cached
   60s per filter combo), falling back to dummy data when the backend
   isn't wired yet.
   ============================================================ */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@newcondo/ui";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { useRole } from "@/components/providers/role-provider";
import { useBrowse, useCacheUpdate } from "@/hooks/dashboard/useDashboardData";
import { EmptyState, SkeletonRows } from "@/components/dashboard/primitives";
import { NCSelect, inputCls } from "@/components/dashboard/NCSelect";
import { BrowsePropertyCard, type BrowseItem } from "./BrowsePropertyCard";
import * as api from "@/lib/api/dashboard";
import type { BrowseFilters } from "@/lib/dashboard/data";

const STATES = ["Imo", "Rivers", "Enugu", "Abia", "Anambra", "Lagos"];
const TYPES = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "House" },
  { value: "DUPLEX", label: "Duplex" },
  { value: "SELF_CONTAIN", label: "Self contain" },
  { value: "SHOP", label: "Shop / office" },
];
const PRICE_BANDS = [
  { value: "", label: "Any price" },
  { value: "0-300000", label: "Under ₦300k" },
  { value: "300000-600000", label: "₦300k – ₦600k" },
  { value: "600000-1200000", label: "₦600k – ₦1.2m" },
  { value: "1200000-", label: "₦1.2m+" },
];

export function BrowseGrid() {
  const router = useRouter();
  const { role } = useRole();
  const cache = useCacheUpdate();

  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [type, setType] = useState("");
  const [band, setBand] = useState("");
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [promotedIds, setPromotedIds] = useState<Set<string>>(new Set());

  const [minPrice, maxPrice] = (() => {
    if (!band) return [undefined, undefined] as const;
    const [lo, hi] = band.split("-");
    return [lo ? Number(lo) : undefined, hi ? Number(hi) : undefined] as const;
  })();

  const filters: BrowseFilters = {
    ...(q ? { q } : {}),
    ...(state ? { state } : {}),
    ...(type ? { type } : {}),
    ...(minPrice != null ? { minPrice } : {}),
    ...(maxPrice != null ? { maxPrice } : {}),
  };

  const { data, isLoading } = useBrowse(filters);
  const items = (data?.items ?? []) as BrowseItem[];
  const hasFilters = !!(q || state || type || band);

  const clear = () => { setQ(""); setState(""); setType(""); setBand(""); };

  /* Agent adds this listing to their promotions. The listing agent's own
     promotion mode (PUBLIC / by-approval / restricted) is enforced
     server-side — a restricted property returns 403 and we surface that
     rather than pretending it worked. */
  const promote = async (p: BrowseItem) => {
    setPromotingId(p.id);
    try {
      if (api.isLiveBackend) {
        await api.promoteProperty(p.id);
      } else {
        await new Promise((r) => setTimeout(r, 700));
      }
      setPromotedIds((s) => new Set(s).add(p.id));
      cache.invalidate(["agent", "promotions"]);
      toast.success("Added to your promotions", {
        description: "Copy your promo link from My Listings → Promoting as sub-agent.",
      });
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? "";
      toast.error("Couldn't promote this property", {
        description: /403|permission|restricted/i.test(msg)
          ? "The listing agent has restricted promotion, or needs to approve you first."
          : msg || "Please try again.",
      });
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <div className="min-w-0">
      {/* ---- filters ---- */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5 max-sm:gap-2">
        <div className="relative min-w-0 flex-1 basis-[240px]">
          <Icon name="search" size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title or area…"
            className={cx(inputCls(), "pl-11")}
          />
        </div>
        <div className="w-[150px] max-sm:flex-1 max-sm:basis-[45%]">
          <NCSelect value={state} onChange={setState} placeholder="All states" options={STATES} />
        </div>
        <div className="w-[165px] max-sm:flex-1 max-sm:basis-[45%]">
          <NCSelect value={type} onChange={setType} placeholder="Any type" options={TYPES} />
        </div>
        <div className="w-[165px] max-sm:flex-1 max-sm:basis-[45%]">
          <NCSelect value={band} onChange={setBand} placeholder="Any price" options={PRICE_BANDS} />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex flex-none items-center gap-1.5 rounded-full border border-nc-border bg-surface px-4 py-2.5 text-[13px] font-semibold text-text-secondary transition-colors duration-200 ease-nc hover:cursor-pointer hover:text-ink max-sm:w-full max-sm:justify-center"
          >
            <Icon name="x" size={14} />Clear
          </button>
        )}
      </div>

      {/* ---- result count ---- */}
      {!isLoading && (
        <p className="m-0 mb-4 text-[13px] text-text-tertiary">
          {data?.total ?? items.length} verified propert{(data?.total ?? items.length) === 1 ? "y" : "ies"}
          {role === "AGENT" && items.length > 0 && " · tap Promote to earn on any of them"}
        </p>
      )}

      {/* ---- grid ---- */}
      {isLoading && items.length === 0 ? (
        <SkeletonRows n={6} h={280} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="building-2"
          title="No properties match that"
          sub={hasFilters ? "Try widening your filters — we launch area by area." : "New verified listings appear here as they go live."}
        />
      ) : (
        <div className="grid grid-cols-4 gap-4 max-[1280px]:grid-cols-3 max-[900px]:grid-cols-2 max-sm:gap-3">
          {items.map((p) => (
            <BrowsePropertyCard
              key={p.id}
              p={p}
              canPromote={role === "AGENT"}
              promoting={promotingId === p.id}
              promoted={promotedIds.has(p.id)}
              onPromote={() => promote(p)}
              onOpen={() => router.push(`/property/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
