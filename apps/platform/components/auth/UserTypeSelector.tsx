"use client";

/* ============================================================
   UserTypeSelector

   Step 1 of onboarding — pick the kind of account. Two roles are
   live: Property Owner and Agent. Clicking a card selects it AND
   advances (the parent's onSelect moves to the details step).

   The selected role drives everything downstream: which plans
   PlanSelector shows, and the userType sent to register().

   ── WHY THE CARDS CARRY PAIN POINTS ──────────────────────────
   This is the first screen of a paid signup, and a one-line blurb
   ("List your properties, collect rent…") describes the product
   without giving anyone a reason to continue. Each card now leads
   with the three things that actually cost that role money today,
   each paired with what Newcondo does instead — so the choice is
   made on recognition ("that is exactly my problem"), not on
   reading a feature list.

   Every claim below must be a service that EXISTS. These sit
   beside a checkout, so an aspirational line here is a promise
   we take money against.
   ============================================================ */

import { Building2, Handshake, Check } from "lucide-react";
// KeyRound is only used by the (currently commented-out) Renter card above.
// import { KeyRound } from "lucide-react";
import { cx } from "@/lib/cx";
import { UserType } from "@/types/api";

type RoleCard = {
  type: UserType;
  title: string;
  blurb: string;
  /** The three biggest money-losing problems for this role, and the fix. */
  points: { pain: string; fix: string }[];
  Icon: typeof Building2;
};

const ROLE_CARDS: RoleCard[] = [
  {
    type: UserType.OWNER,
    title: "Property owner",
    blurb: "List your properties, collect rent in escrow, and manage everything from one dashboard.",
    points: [
      { pain: "Agent collects your rent, then goes quiet", fix: "Rent is held in escrow and released straight to your bank" },
      { pain: "No idea who is actually living in your property", fix: "Every tenant is ID-verified before they can pay" },
      { pain: "Fumigation, waste and paperwork all fall on you", fix: "Scheduled and handled — it's inside your plan" },
    ],
    Icon: Building2,
  },
  // Renter is disabled for now — onboarding only accepts Property owners and
  // Agents. Uncomment this card (and switch the grid back to grid-cols-3) to
  // re-enable renter sign-ups.
  // {
  //   type: UserType.RENTER,
  //   title: "Renter",
  //   blurb: "Find verified homes — no fake listings, no double-booking, no surprise agent fees.",
  //   points: [...],
  //   Icon: KeyRound,
  // },
  {
    type: UserType.AGENT,
    title: "Agent",
    blurb: "List and promote properties, run sub-agents, and earn commissions the platform protects.",
    points: [
      { pain: "You close the deal, then chase your commission", fix: "Your split is calculated and paid out automatically" },
      { pain: "Five agents marketing the same flat", fix: "One listing agent per property, sub-agents tracked by link" },
      { pain: "Slow months with nothing coming in", fix: "Marking jobs and referral income between lets" },
    ],
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
    <div className="mx-auto grid max-w-[760px] grid-cols-2 gap-3.5 max-[720px]:grid-cols-1 max-[720px]:max-w-[460px] max-[720px]:gap-3">
      {ROLE_CARDS.map(({ type, title, blurb, points, Icon }) => {
        const isActive = selectedType === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            disabled={disabled}
            aria-pressed={isActive}
            className={cx(
              "group relative flex flex-col items-start rounded-card border-2 bg-surface p-[clamp(16px,1.8vw,24px)] text-left shadow-card transition-[transform,box-shadow,border-color] duration-200 ease-nc hover:-translate-y-1 hover:shadow-lift disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98]",
              isActive ? "border-ink" : "border-border-hair hover:border-border"
            )}
          >
            <span
              className={cx(
                "grid h-11 w-11 flex-none place-items-center rounded-2xl transition-colors duration-200 ease-nc max-[560px]:h-10 max-[560px]:w-10",
                isActive ? "bg-ink text-cream" : "bg-surface-sunken text-ink"
              )}
            >
              <Icon size={22} strokeWidth={1.85} />
            </span>

            <h3 className="m-0 mt-3.5 text-[17px] font-bold tracking-[-0.02em] text-text-primary max-[560px]:text-[16px]">{title}</h3>
            <p className="m-0 mt-1.5 text-[13.5px] leading-[1.5] text-text-secondary max-[560px]:text-[13px]">{blurb}</p>

            {/* The pain is struck through and the fix sits under it — the
                cancellation IS the argument, and it reads in one glance
                without a paragraph. */}
            <ul className="m-0 mt-4 flex w-full list-none flex-col gap-2.5 border-t border-border-hair p-0 pt-4">
              {points.map(({ pain, fix }) => (
                <li key={pain} className="flex items-start gap-2.5">
                  <Check
                    size={15}
                    strokeWidth={2.6}
                    className={cx(
                      "mt-[3px] flex-none transition-colors duration-200 ease-nc",
                      isActive ? "text-green-dark" : "text-text-tertiary group-hover:text-green-dark"
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block text-[12.5px] leading-[1.35] text-text-tertiary line-through decoration-text-tertiary/50">
                      {pain}
                    </span>
                    <span className="mt-0.5 block text-[13px] font-semibold leading-[1.4] tracking-[-0.01em] text-text-primary">
                      {fix}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

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
