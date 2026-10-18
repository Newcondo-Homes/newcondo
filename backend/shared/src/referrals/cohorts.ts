// backend/shared/src/referrals/cohorts.ts — spec §4.2
import type { CohortId } from "./rule-types";

export const COHORTS: Record<CohortId, { size: number; description: string }> = {
  // D6 — 500 as written; consider 150–200 unless the referrer base is large.
  founding_sprint_owners: { size: 500, description: "First N referrers whose referee activates during the sprint window" },
  founding_100_agents: { size: 100, description: "First 100 verified agents (same cohort as 'founding agent — free Premium for life')" },
};
