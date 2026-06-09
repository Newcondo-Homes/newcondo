"use client";

import { Building2, Briefcase, ArrowRight, Check, type LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import { UserType } from "@/types/api";

/* ============================================================
   UserTypeSelector

   All three account types are defined here. `display: false` keeps
   AGENT in the system (and selectable programmatically) while hiding
   it from the self-serve onboarding screen — agents join through the
   invite / sub-agent promotion flow. To surface it, flip `display`.
   ============================================================ */
interface RoleOption {
  type: UserType;
  display: boolean;
  icon: LucideIcon;
  title: string;
  blurb: string;
  points: string[];
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    type: UserType.PROPERTY_OWNER,
    display: true,
    icon: Building2,
    title: "I own property",
    blurb: "List and rent out your property with escrow rent, verified tenants, and one dashboard.",
    points: ["Rent collected in escrow", "Identity-verified tenants", "Every agent tracked"],
  },
  {
    type: UserType.AGENT,
    display: true,
    icon: Briefcase,
    title: "I'm an agent",
    blurb: "List and promote properties with unique tracked links, and earn commission on every let you close.",
    points: ["List & promote properties", "Tracked promotion links", "Earn commission per let"],
  },
  // ── RENTER — temporarily disabled. Newcondo is opening to property owners and
  //    agents first. Flip `display` to true (and re-enable the renter plan set in
  //    plan-selector.tsx) when we open the platform to renters. ──
  // {
  //   type: UserType.RENTER,
  //   display: true,
  //   icon: Search,
  //   title: "I'm looking for a home",
  //   blurb: "Browse verified listings only — no fake posts, no double-booking, no agent runaround.",
  //   points: ["Verified, real listings", "Your deposit protected", "Direct, tracked agents"],
  // },
];

export default function UserTypeSelector({
  selectedType,
  onSelect,
  disabled = false,
}: {
  selectedType?: UserType;
  onSelect: (type: UserType) => void;
  disabled?: boolean;
}) {
  const visible = ROLE_OPTIONS.filter((r) => r.display);

  return (
    <div className="grid grid-cols-2 gap-5 max-[680px]:grid-cols-1">
      {visible.map((role) => {
        const RoleIcon = role.icon;
        const active = selectedType === role.type;
        return (
          <button
            key={role.type}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(role.type)}
            className={cx(
              "group relative flex flex-col items-start gap-5 rounded-card border bg-surface p-7 text-left",
              "transition-[transform,box-shadow,border-color] duration-200 ease-nc",
              "hover:-translate-y-1.5 hover:shadow-lift focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none",
              active
                ? "border-ink shadow-lift ring-1 ring-ink"
                : "border-border-hair shadow-card hover:border-border"
            )}
          >
            {/* selected check */}
            <span
              className={cx(
                "absolute right-5 top-5 grid h-7 w-7 place-items-center rounded-full bg-ink text-cream transition-all duration-200 ease-nc",
                active ? "scale-100 opacity-100" : "scale-50 opacity-0"
              )}
            >
              <Check size={16} strokeWidth={2.4} />
            </span>

            <span className="grid h-[58px] w-[58px] place-items-center rounded-[18px] bg-surface-sunken text-ink transition-colors duration-200 ease-nc group-hover:bg-ink group-hover:text-cream">
              <RoleIcon size={27} strokeWidth={1.75} />
            </span>

            <div>
              <h3 className="m-0 text-[23px] font-bold tracking-[-0.03em] text-text-primary">
                {role.title}
              </h3>
              <p className="mt-2 text-[15px] leading-[1.5] text-text-secondary text-balance">
                {role.blurb}
              </p>
            </div>

            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {role.points.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-[14px] font-medium text-text-secondary">
                  <Check size={16} strokeWidth={2.2} className="flex-none text-green-dark" />
                  {p}
                </li>
              ))}
            </ul>

            <span className="mt-1 inline-flex items-center gap-2 text-[14.5px] font-semibold text-ink">
              Continue
              <ArrowRight
                size={17}
                strokeWidth={2}
                className="transition-transform duration-200 ease-nc group-hover:translate-x-1"
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
