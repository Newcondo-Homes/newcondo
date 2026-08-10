"use client";

/* ============================================================
   BrowsePropertyCard

   One property in the public browse grid. Every card here is
   PUBLISHED + boundaryVerified + admin-APPROVED (enforced server-side
   in publicBrowseService), so the "Marked" badge is always true — it's
   shown because verified geolocation is the platform's core trust
   signal, not decoration.

   PROMOTE (agents only): adds the property to the agent's sub-agent
   promotions. A renter paying through their link splits 50% of the 20%
   platform commission with the listing agent, automatically.
   ============================================================ */

import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { ngn } from "@/lib/dashboard/format";

export interface BrowseItem {
  id: string;
  title: string;
  area: string;
  state: string;
  price: number;
  propertyType: string;
  coverUrl: string | null;
  isMarked: boolean;
  listingAgent: { name: string | null } | null;
  flats: { label: string; status: string }[];
  vacantFlats: number;
}

export function BrowsePropertyCard({
  p,
  canPromote,
  promoting,
  promoted,
  onPromote,
  onOpen,
}: {
  p: BrowseItem;
  /** True only for AGENT accounts. */
  canPromote: boolean;
  promoting: boolean;
  promoted: boolean;
  onPromote: () => void;
  onOpen: () => void;
}) {
  return (
    <article
      onClick={onOpen}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-card border border-border-hair bg-surface shadow-card transition-[transform,box-shadow] duration-[380ms] ease-nc hover:-translate-y-1.5 hover:shadow-lift"
    >
      {/* cover */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-sunken">
        {p.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.coverUrl}
            alt={p.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[600ms] ease-nc group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-text-tertiary">
            <Icon name="building-2" size={30} />
          </div>
        )}

        {/* Verified geolocation — the platform's core trust signal. */}
        {p.isMarked && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-green-dark backdrop-blur-sm">
            <Icon name="map-pin" size={11} strokeWidth={2.4} />
            Marked
          </span>
        )}

        {p.vacantFlats > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-cream backdrop-blur-sm">
            {p.vacantFlats} vacant
          </span>
        )}
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-4 max-sm:p-3.5">
        <h3 className="m-0 truncate text-[15px] font-bold tracking-[-0.02em] text-text-primary">{p.title}</h3>
        <p className="m-0 mt-1 flex items-center gap-1.5 truncate text-[12.5px] text-text-tertiary">
          <Icon name="map-pin" size={12} className="flex-none" />
          {p.area}, {p.state}
        </p>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-mono text-[17px] font-bold tracking-[-0.02em] text-text-primary">{ngn(p.price)}</span>
          <span className="text-[12px] text-text-tertiary">/year</span>
        </div>

        {p.listingAgent?.name && (
          <p className="m-0 mt-1.5 truncate text-[12px] text-text-tertiary">
            Listed by {p.listingAgent.name}
          </p>
        )}

        {/* Agents get the promote affordance; everyone else just opens it. */}
        {canPromote && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!promoted) onPromote();
            }}
            disabled={promoting || promoted}
            className={cx(
              "mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-[13.5px] font-semibold transition-[background,transform,box-shadow] duration-200 ease-nc active:scale-[0.97] disabled:cursor-default",
              promoted
                ? "bg-green-wash text-green-dark"
                : "bg-ink text-cream hover:cursor-pointer hover:bg-black hover:shadow-card"
            )}
          >
            {promoting ? (
              <><Icon name="loader" size={14} className="animate-spin" />Adding…</>
            ) : promoted ? (
              <><Icon name="check" size={14} strokeWidth={2.4} />Promoting</>
            ) : (
              <><Icon name="share-2" size={14} strokeWidth={2.2} />Promote</>
            )}
          </button>
        )}
      </div>
    </article>
  );
}
