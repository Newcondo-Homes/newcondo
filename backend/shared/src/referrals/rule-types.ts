// backend/shared/src/referrals/rule-types.ts — spec §4.1
// Adding a TriggerType / MarginSource / RewardForm is a CODE change: extend
// the union here, handle it in margin.ts + evaluate.ts + ledger.ts, add tests.

export type TriggerType =
  | "subscription_payment_cleared"
  | "rent_commission_distributed"
  | "marking_job_completed" // emitter optional; no rule uses it yet
  | "referral_milestone_reached";

export type MarginSource =
  | "owner_fulfillment_margin"
  | "agent_subscription_margin"
  | "platform_commission_margin"
  | "fixed_service_cost";

export type RewardForm = "subscription_credit" | "service_credit" | "commission_override";
export type Role = "owner" | "agent" | "renter";
export type ServiceCreditType = "fumigation" | "waste_management" | "inspection" | "emergency_maintenance";
export type CohortId = "founding_sprint_owners" | "founding_100_agents";

export interface ReleaseSchedule {
  type: "immediate" | "installments" | "recurring_capped";
  /** installments: number of qualifying source events rewarded per referral */
  installments?: number;
  /** recurring_capped: counted in rent-payment EVENTS, never months */
  capRentPaymentCycles?: number;
  /** recurring_capped: max distinct referred users per referrer */
  capReferredCount?: number;
}

export interface ReferralRule {
  id: string;
  active: boolean;
  description: string;
  marketing?: { title: string; blurb: string };

  referrerRole: Role | "any";
  refereeRole: Role;

  trigger: TriggerType;
  marginSource: MarginSource;

  poolPercentage: number;
  splitReferrer: number;
  splitReferee: number;

  rewardForm: RewardForm;
  payout?: "credit" | "virtual_account";
  serviceCreditType?: ServiceCreditType;
  milestone?: { referredActiveCount: number };

  release: ReleaseSchedule;

  eligibility: {
    qualification: "paying_subscriber" | "settled_transaction" | "cohort_member";
    minReferrerTenureDays?: number;
    cohortOnly?: CohortId | null;
    cohortCapturesOnFirstUse?: CohortId;
  };

  exclusiveGroup?: string;
  priority?: number;

  capPerEventKobo?: number;
  capPerReferredUserKobo?: number;
  capPerReferrerPerYearKobo?: number;
  capReferredEntitiesPerReferrer?: number;

  creditExpiryDays: number;
  activeWindow?: { start: string; end: string };
}

/** The normalised, SETTLED event every emitter produces — spec §8.1. */
export interface BusinessEvent {
  type: TriggerType;
  sourceType: "SUBSCRIPTION_PAYMENT" | "RENT_COMMISSION" | "MILESTONE";
  /** payment / invoice / distribution id — the idempotency anchor */
  sourceId: string;
  occurredAt: string;
  subjectUserId: string;
  subjectOwnerId?: string;
  cashCollectedKobo?: number;
  breakdown?: { grossCommissionKobo: number; listingAgentShareKobo: number; subAgentShareKobo: number; newcondoNetKobo: number };
  /** owner subscription charges: one line per property billed */
  items?: Array<{ propertyId: string | null; planCode: string; amountKobo: number }>;
  /** milestone events: the referrer's new active-referee count */
  milestoneCount?: number;
}
