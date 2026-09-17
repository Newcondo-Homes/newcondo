"use client";

/* Profile & Settings — identity, verification, plan, legal documents.
   TODO(backend): PATCH /api/user/profile · POST /api/verification/upload
   (UploadThing) · GET /api/legal-documents · subscription via Flutterwave.

   PLAN TAB: prices, caps and commission rates are read from the shared single
   source of truth (subscriptionPlans.ts) via planByCode — NOT typed into the
   markup. The plan code itself should come from the user's subscription
   (Subscription.planType); until that field is on the session/profile payload,
   DEFAULT_PLAN_BY_ROLE stands in. */
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast } from "@newcondo/ui";
import { useRole } from "@/components/providers/role-provider";
import { ROLE_LABEL } from "@/components/dashboard/Sidebar";
import { PageHead, DBtn, StatusBadge, Card, CardH, Row, Thumb, Tabs, KV, Banner } from "@/components/dashboard/primitives";
import { ConfirmDialog } from "@/components/dashboard/Modal";
import { NCSelect, Field, inputCls } from "@/components/dashboard/NCSelect";
import { usePersistedTab } from "@/hooks/dashboard/usePersistedTab";
import { YourDetailsCard } from "@/components/dashboard/profile/YourDetailsCard";
import {
  planByCode,
  formatNaira,
  formatRate,
  totalForProperties,
  MAX_PLOTS_SELF_SERVE,
  MARKING,
  VERIFICATION,
  type SubscriptionPlanCode,
} from "@/lib/constants/business";

const LEGAL_DOCS = [
  ["Personal undertaking", "Signed 12 Feb 2026", "VERIFIED"],
  ["Proof of ownership — New Owerri", "Verified by admin 14 Feb 2026", "VERIFIED"],
  ["Marking service terms", "Accepted 2 Jul 2026", "CONFIRMED"],
  ["Tenancy agreement — Trans Amadi Flat 1", "Auto-generated 3 Mar 2026", "CONFIRMED"],
] as const;

/** Fallback while the per-property lines aren't on the profile payload. */
const DEFAULT_PLAN_BY_ROLE: Record<string, SubscriptionPlanCode> = {
  OWNER: "OWNER_PLUS",
  AGENT: "AGENT_PREMIUM",
  RENTER: "RENTER_PREMIUM_PLUS",
};

/* An owner's tier is per PROPERTY, so the plan tab is a list of lines with a
   total — not one plan. Placeholder shape until
   GET /payments/subscriptions/me returns `lines`. */
const DEMO_OWNER_LINES: { propertyId: string; label: string; planCode: SubscriptionPlanCode }[] = [
  { propertyId: "p1", label: "Trans Amadi — 2 flats", planCode: "OWNER_PREMIUM" },
  { propertyId: "p2", label: "New Owerri — bungalow", planCode: "OWNER_ESSENTIAL" },
];

const per = (cycle: string) => (cycle === "ANNUAL" ? "year" : "month");
const times = (n: number) => `${n}× per year`;
const serviceLine = (p: { fumigationsPerYear: number; inspectionsPerYear: number }) =>
  `${times(p.fumigationsPerYear)} fumigation · ${p.inspectionsPerYear > 0 ? `${times(p.inspectionsPerYear)} inspection` : "no inspection"} · monthly waste`;

export default function ProfilePage() {
  const { role, user } = useRole();
  const [tab, setTab] = usePersistedTab("nc-profile-tab", "profile");
  const [doc, setDoc] = useState("NIN");
  const [cancel, setCancel] = useState(false);

  /* TODO(backend): GET /payments/subscriptions/me → planType, currentPeriodEnd.
     `user.planCode` is read first so wiring it is a one-line change. */
  const planCode =
    ((user as { planCode?: SubscriptionPlanCode }).planCode ??
      DEFAULT_PLAN_BY_ROLE[role] ??
      "OWNER_ESSENTIAL") as SubscriptionPlanCode;
  const plan = planByCode(planCode);
  /* TODO(backend): lines come from the subscription's PropertySubscription
     rows. The total is the sum — never a single tier price. */
  const ownerLines = DEMO_OWNER_LINES;
  const ownerTotal = totalForProperties(ownerLines.map((l) => ({ planCode: l.planCode })));

  return (
    <>
      <PageHead title="Profile & Settings" sub="Identity, verification, plan and legal documents." />
      <Tabs value={tab} onChange={setTab} items={[["profile", "Profile"], ["verify", "Verification"], ["plan", "Plan"], ["legal", "Legal documents"]]} />
      {tab === "profile" && (
        <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
          {/* Reads GET /auth/profile — the session's JWT claims go stale, so a
             settings page driven by them can show a name the user changed
             minutes ago on another device. Name saves in place; email and phone
             go through password + OTP (they're password-reset channels). */}
          <YourDetailsCard role={role} fallback={{ name: user.name, email: user.email }} />
          <Card>
            <CardH title="Notifications" />
            <p className="mb-3 mt-0 text-[13px] text-text-tertiary">Where should we reach you? Critical alerts (escrow, marking confirmations) always go to all channels.</p>
            <NotifToggle label="In-app" initial />
            <NotifToggle label="Email" initial />
            {/* SMS has no provider wired yet — shown disabled rather than
               hidden, so the channel is discoverable and the state is honest.
               A toggle that flips but does nothing is worse than one that says
               it isn't ready. */}
            <NotifToggle label="SMS" initial={false} comingSoon />
          </Card>
        </div>
      )}
      {tab === "verify" && (
        <Card className="max-w-[640px]">
          <CardH title="Identity verification" right={<StatusBadge s={user.verificationStatus} />} />
          {user.verificationStatus === "VERIFIED" ? (
            <Banner icon="shield-check"><b className="font-semibold">You&rsquo;re verified.</b> NIN verified on 12 Feb 2026. Your verified badge shows on all your listings and marking jobs.</Banner>
          ) : (<>
            <p className="mb-3.5 mt-0 text-[13.5px] leading-relaxed text-text-secondary">Upload one government-issued ID. Verification unlocks payments{role !== "RENTER" ? ", listing and marking" : ""} and usually completes within {VERIFICATION.reviewHours} hours.</p>
            <Field label="Document type"><NCSelect value={doc} onChange={setDoc} options={[...VERIFICATION.acceptedIds]} /></Field>
            <button onClick={() => toast.info("File picker opens", { description: "TODO(backend): UploadThing → /api/verification/upload" })}
              className="grid h-[110px] w-full place-items-center rounded-[14px] border-[1.5px] border-dashed border-border-strong bg-surface text-text-tertiary">
              <span className="text-center"><Icon name="camera" size={20} className="mx-auto" /><span className="mt-1.5 block text-[12.5px]">Upload ID + a selfie</span></span>
            </button>
            <div className="mt-3.5">
              <DBtn onClick={() => toast.promise(new Promise((res) => setTimeout(res, 1400)), { loading: "Submitting documents…", success: `Verification submitted — an admin reviews within ${VERIFICATION.reviewHours} hours.`, error: "Upload failed" })}>Submit for verification</DBtn>
            </div>
          </>)}
        </Card>
      )}
      {tab === "plan" && (
        <Card className="max-w-[640px]">
          <CardH
            title={role === "OWNER" ? "Your properties & plans" : "Your plan"}
            right={role === "OWNER"
              ? <StatusBadge s="RENTED">{`${formatNaira(ownerTotal)}/mo`}</StatusBadge>
              : <StatusBadge s="RENTED">{plan.name}</StatusBadge>}
          />
          {role === "OWNER" && (<>
            {/* One line per property — each on its own tier. The total is the
                sum, which is what the card is charged each cycle. */}
            <p className="mb-3 mt-0 text-[13px] text-text-tertiary">
              Each property has its own service tier. Your monthly total is the sum.
            </p>
            {ownerLines.map((line) => {
              const p = planByCode(line.planCode);
              return (
                <div key={line.propertyId} className="border-b border-border-hair py-3 last:border-b-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{line.label}</div>
                      <div className="mt-1 text-[12.5px] text-text-tertiary">
                        {p.name} · {serviceLine(p)} · {formatRate(p.commissionRate)} commission
                      </div>
                    </div>
                    <div className="flex flex-none items-center gap-3">
                      <span className="text-[14px] font-semibold">{formatNaira(p.amountNaira)}</span>
                      <button
                        className="text-[13px] font-semibold text-green-dark hover:text-ink"
                        onClick={() => toast.info(`Change tier — ${line.label}`, { description: "Tier is set per property; the change applies from your next billing cycle." })}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="mt-3 flex items-baseline justify-between border-t border-border-strong pt-3">
              <span className="text-[14px] font-semibold">Monthly total</span>
              <span className="text-[18px] font-bold tracking-[-0.02em]">{formatNaira(ownerTotal)}</span>
            </div>
            <KV k="Next billing" v="1 Aug 2026 · card ending 4242" />
            <p className="mt-2 text-[12.5px] leading-[1.5] text-text-tertiary">
              Properties larger than {MAX_PLOTS_SELF_SERVE} plots are quoted individually — once quoted, they appear here and
              bill like any other property.
            </p>
          </>)}
          {role === "AGENT" && (<>
            <KV k="Plan" v={`${plan.name} — ${formatNaira(plan.amountNaira)}/${per(plan.cycle)}`} />
            <KV k="Marking queue" v={plan.canAccessMarkingJobs ? `Included — ${formatNaira(MARKING.markerPayout)} per job` : "Not included on this plan"} />
            <KV k="Listings" v={plan.propertyListingCap === null ? "Unlimited · priority placement" : `Up to ${plan.propertyListingCap}`} />
            <KV k="Next billing" v="1 Aug 2026 · card ending 4242" />
          </>)}
          {role === "RENTER" && (<>
            <KV k="Plan" v={plan.amountNaira === 0 ? "Free" : `${plan.name} — ${formatNaira(plan.amountNaira)}/${per(plan.cycle)}`} />
            <div className="mt-3">
              <Banner icon="zap" action={<DBtn sm onClick={() => toast.info("Premium checkout", { description: "Flutterwave subscription flow — see onboarding plan selector." })}>Upgrade</DBtn>}>
                <b className="font-semibold">Premium unlocks marking-job income and your wallet.</b> One marking job ({formatNaira(MARKING.markerPayout)}) covers more than a month.
              </Banner>
            </div>
          </>)}
          <div className="mt-4 flex flex-wrap gap-2.5">
            <DBtn variant="line" sm onClick={() => toast.info("Billing history", { description: "Opens payments filtered to subscription charges." })}>Billing history</DBtn>
            {role !== "RENTER" && <DBtn variant="ghost" sm className="!text-danger" onClick={() => setCancel(true)}>{role === "OWNER" ? "Cancel a property's plan" : "Cancel subscription"}</DBtn>}
          </div>
        </Card>
      )}
      {tab === "legal" && (
        <Card tight className="max-w-[720px]">
          <CardH pad title="Legal documents" />
          {LEGAL_DOCS.map(([t, s, st]) => (
            <Row key={t}>
              <Thumb icon="file-text" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{t}</div>
                <div className="mt-1 text-[12.5px] text-text-tertiary">{s}</div>
              </div>
              <div className="flex flex-none items-center gap-2.5">
                <StatusBadge s={st} />
                <button className="flex items-center gap-1 text-[13px] font-semibold text-green-dark hover:text-ink"><Icon name="download" size={13} />PDF</button>
              </div>
            </Row>
          ))}
        </Card>
      )}
      <AnimatePresence>
        {cancel && (
          <ConfirmDialog danger title="Cancel your subscription?" confirmLabel="Cancel plan"
            body="Your listings stay visible until the end of the paid period, then they're archived. Documents, agreements and payment history remain in your account."
            onConfirm={() => toast.info("Subscription set to cancel", { description: "Active until 1 Aug 2026. You can resume anytime before then." })}
            onClose={() => setCancel(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function NotifToggle({ label, initial, comingSoon }: { label: string; initial: boolean; comingSoon?: boolean }) {
  const [on, setOn] = useState(initial);
  if (comingSoon) {
    return (
      <div className="flex items-center justify-between border-b border-border-hair py-[9px] text-[13.5px] last:border-b-0">
        <span className="flex items-center gap-2">
          <span className="font-semibold text-text-tertiary">{label}</span>
          <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-text-tertiary">
            Coming soon
          </span>
        </span>
        {/* Non-interactive on purpose: aria-disabled + no handler, so it can't
            be toggled by keyboard either. The blur is the visual cue; the
            missing handler is the actual guarantee. */}
        <span
          role="switch"
          aria-checked={false}
          aria-disabled
          title="SMS notifications aren't available yet"
          className="relative h-6 w-[42px] cursor-not-allowed rounded-full bg-nc-border opacity-45 blur-[1.2px]"
        >
          <span className="absolute left-[3px] top-[3px] size-[18px] rounded-full bg-white shadow" />
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between border-b border-border-hair py-[9px] text-[13.5px] last:border-b-0">
      <span className="font-semibold">{label}</span>
      <button onClick={() => { setOn(!on); toast.success(`${label} notifications ${on ? "off" : "on"}`); }}
        className={cx("relative h-6 w-[42px] rounded-full transition-colors", on ? "bg-green" : "bg-nc-border")}>
        <span className={cx("absolute top-[3px] size-[18px] rounded-full bg-white shadow transition-[left] duration-200 ease-nc", on ? "left-[21px]" : "left-[3px]")} />
      </button>
    </div>
  );
}
