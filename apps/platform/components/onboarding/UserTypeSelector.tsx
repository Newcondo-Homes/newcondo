"use client";

/* ============================================================
   UserTypeSelector

   Step 1 of onboarding — pick the kind of account. Three roles:
   Property Owner, Renter, Agent. Clicking a card selects it AND
   advances (the parent's onSelect moves to the details step).

   The selected role drives everything downstream: which plans
   PlanSelector shows, and the userType sent to register().
   ============================================================ */

import { Building2, KeyRound, Handshake, Check } from "lucide-react";
import { cx } from "@/lib/cx";
import { UserType } from "@/types/api";

type RoleCard = {
  type: UserType;
  title: string;
  blurb: string;
  Icon: typeof Building2;
};

const ROLE_CARDS: RoleCard[] = [
  {
    type: UserType.PROPERTY_OWNER,
    title: "Property owner",
    blurb: "List your properties, collect rent in escrow, and manage everything from one dashboard.",
    Icon: Building2,
  },
  {
    type: UserType.RENTER,
    title: "Renter",
    blurb: "Find verified homes — no fake listings, no double-booking, no surprise agent fees.",
    Icon: KeyRound,
  },
  {
    type: UserType.AGENT,
    title: "Agent",
    blurb: "List and promote properties, run sub-agents, and earn commissions the platform protects.",
    Icon: Handshake,
  },
];

export default function UserTypeSelector({
  selectedType,
  onSelect,
  disabled = false,
}: {
  selectedType: UserType;
  onSelect: (type: UserType) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-3.5 max-[720px]:grid-cols-1">
      {ROLE_CARDS.map(({ type, title, blurb, Icon }) => {
        const isActive = selectedType === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            disabled={disabled}
            aria-pressed={isActive}
            className={cx(
              "group relative flex flex-col items-start rounded-card border bg-surface p-[clamp(18px,1.8vw,24px)] text-left shadow-card transition-[transform,box-shadow,border-color] duration-200 ease-nc hover:-translate-y-1 hover:shadow-lift disabled:pointer-events-none disabled:opacity-60",
              isActive ? "border-ink ring-1 ring-ink" : "border-border-hair hover:border-border"
            )}
          >
            <span
              className={cx(
                "grid h-12 w-12 flex-none place-items-center rounded-2xl transition-colors duration-200 ease-nc",
                isActive ? "bg-ink text-cream" : "bg-surface-sunken text-ink"
              )}
            >
              <Icon size={24} strokeWidth={1.85} />
            </span>

            <h3 className="m-0 mt-4 text-[18px] font-bold tracking-[-0.02em] text-text-primary">{title}</h3>
            <p className="m-0 mt-1.5 text-[13.5px] leading-[1.5] text-text-secondary">{blurb}</p>

            <span
              className={cx(
                "mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors duration-200 ease-nc",
                isActive ? "text-green-dark" : "text-text-tertiary group-hover:text-ink"
              )}
            >
              {isActive ? (
                <>
                  <Check size={15} strokeWidth={2.4} /> Selected
                </>
              ) : (
                "Choose this"
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
