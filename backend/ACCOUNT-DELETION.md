# Account deletion — implementation map

Newcondo Ltd · owner: Founder/CEO (acting DPO) · v1.0

In-app account deletion, as required by (a) Meta for apps using Facebook Login,
and (b) our own Privacy Policy §13, which already promises it. This document is
the map from each published promise to the code that keeps it.

---

## 1. The model: three states, never a hard delete

**Why 21 days — and why 21 is the ceiling.** The NDPA requires a data subject
request to be answered within 30 days (GDPR Art. 12(3) is the same shape: one
month). That is a **maximum**, and neither law sets a minimum waiting period, so
acting sooner is always compliant.

The grace window has to fit **inside** those 30 days, not sit alongside them: a
regulator reading "asked on the 1st, erased on the 30th" sees a 30-day response,
whatever we call the delay internally. So the real ceiling is 30 minus
operational margin — and 21 is that ceiling. It leaves 9 days of margin (ample
for a cron that alerts at a 3-day lag) and gives someone three weeks plus three
reminder emails to change their mind. Going to 30 would buy nine more days of
reversibility and spend **all** the margin: two failed runs and the promise in
/privacy §13 is breached.

Note which lever actually matters: window length is weak, **being told is
strong**. Regret surfaces either in the first 72 hours (an angry or accidental
click) or months later, when they need the service again — and no grace window
covers the second case. Hence three reminders at 14, 7 and 1 day, not a longer
silence.

(NDPC context for the registration task: the NDPC's General Application and
Implementation Directive — GAID 2025 — has been effective since September 2025
and is the operative compliance instrument alongside the Act.)

| State | When | What it means |
|---|---|---|
| **Deactivated** `user.deletedAt` | Day 0, on request | Signed out everywhere, locked out, listings hidden, subscription set not to renew. **Fully reversible.** |
| **Anonymized** `user.anonymizedAt` | Day 21 | Identity erased in place: name, email, phone, image, BVN, dateOfBirth, address nulled/tombstoned; `Document` rows + S3 objects destroyed; `Account` rows (Facebook/Google) severed. **Irreversible.** NDPA erasure satisfied here. |
| **Purged** `user.purgedAt` | +18 months | Residual anonymous shell destroyed. Rows with no financial history deleted outright; the rest stripped to a bare key so tax/AML records stay referentially intact. |

Total horizon: **~18.5 months** from request to final purge. Statutory records
(tax, AML) outlive even that in isolated archive storage — 6 years.

Why not a hard delete: a rental, a payment, a commission split and a marking
payout are records **about someone else too** — the landlord's tenancy history,
the agent's earnings, Flutterwave's settlement trail. Deleting the `User` row
orphans all of them and breaks the retention carve-out we already publish.

---

## 2. Files

| File | Role |
|---|---|
| `schema.prisma` | The canonical schema — copy-paste ready. Account-deletion fields + `AccountDeletionRequest` + explicit `onDelete` on every `User` relation are folded in, marked `// ++ DELETION`. |
| `shared/src/constants/business.deletion-addition.ts` | Every number the dialog, emails, cron and policy pages quote. |
| `auth-service/src/services/accountDeletion.service.ts` | Preview, request (re-auth + blockers), cancel, public status. |
| `auth-service/src/services/accountAnonymization.service.ts` | The erasure itself, **per role**, plus the final purge. |
| `auth-service/src/jobs/processAccountDeletions.ts` | Daily cron: remind → erase → purge. |
| `combined-backend/src/routes/auth.account-deletion.ts` | Authenticated routes + Meta callback + public status JSON. |
| `shared/src/utils/emailTemplates.accountDeletion.ts` | Scheduled · reminder · completed · cancelled. |
| `apps/platform/lib/api/account-deletion.ts` | Frontend client. |
| `components/dashboard/profile/DeleteAccountCard.tsx` / `DeleteAccountModal.tsx` | Settings entry + 4-step dialog. |
| `components/auth/AccountScheduledForDeletion.tsx` | Restore path after a correct sign-in. |
| `app/data-deletion/[code]/page.tsx` | Public status page — the URL handed to Meta. |

---

## 3. The three roles delete differently

**Owner** — holds the most, and most of it is someone else's too.

- *Blocked by:* active tenancies, marking jobs in progress they paid for.
- *At erasure:* properties with **no** payment/marking/rental history are deleted
  outright (rows + S3 photos + ownership docs). Properties with history are
  **closed and de-identified** — photos destroyed, ownership documents destroyed,
  boundary mask and GPS coarsened to a ~1 km grid, street address generalized to
  `City, State`, description replaced. Rent and marking history survive
  attached to an anonymous shell.

**Agent** — holds other people's listings.

- *Blocked by:* marking jobs assigned to them, tenanted listings they manage,
  commission payouts still due, promo commissions not yet paid.
- *At erasure:* detached from every listing (identical effect to
  `resignAsListingAgent` — owner keeps the property, can invite another agent),
  share/promo links deleted, promo referral rows deactivated and their codes
  rotated, queue slots released, un-started marking jobs
  returned to the pool. **Completed** marking jobs, paid commissions and the
  promo conversion ledger survive as anonymous financial records.

**Renter** — holds the least of their own, the most of someone else's.

- *Blocked by:* active tenancy, a payment inside its 48-hour refund window.
- *At erasure:* unused invites deleted, invite contact fields nulled, tenancy and
  receipts survive as the landlord's record with the renter de-identified.

**All roles blocked by:** open dispute, payment still settling, wallet balance > 0,
and **referral earnings owed in cash** (see below).
A refused request is still **recorded** (`status: BLOCKED`) — the person exercised
an NDPA right and we must be able to show the date and the reason we gave.

---

## 3a. Referral commissions — money and ledger

Two separate concerns, handled differently, because conflating them either
steals from the user or destroys someone else's records.

**Money we owe → blocks the request.**

| Thing | Test | Why |
|---|---|---|
| Cash / commission reward | `ReferralReward` `status: APPROVED`, `rewardType: CASH_REWARD \| COMMISSION_CREDIT`, `isPaidOut: false` | An approved payout that hasn't landed is a debt. Closing the account would quietly cancel it. |
| Sub-agent split | `Payment` `subAgentId`, `status: SUCCESS \| HELD`, `commissionSettledAt: null` | The escrow split hasn't run. |
| Promo commission | `AgentReferralConversion` `isPaid: false` | **A second, independent check.** `commissionSettledAt` is the split's idempotency flag; the conversion row has its own `isPaid`. If the split ran but the transfer didn't, the first test passes and the agent is *still owed money*. Both must be clear. |

**Perks we don't owe → forfeited, and the dialog says so.** Service credits,
subscription discounts, rent credits and maintenance vouchers are
non-transferable. The preview counts only these in `referralCredits`, so the
"credits are lost" warning is never shown for money that is actually owed.

**The ledger survives erasure.** `AgentReferral` is not deleted — it is
`isActive: false` with its `referralCode` and `referralLink` rotated out of
circulation. Deleting the parent would cascade `AgentReferralConversion` and
`ReferralConversion`, which carry `amount` and `commission` per payment: that is
simultaneously the agent's earnings record, the owner's side of the transaction,
and Newcondo's own revenue reconciliation and tax evidence. Clicks are
de-identified (IP, user agent, referrer URL nulled), not destroyed — they are
third-party analytics.

**An owner's deletion cannot destroy an agent's commissions.** The
"delete the listing outright" branch now also requires zero
`AgentReferralConversion` rows for that property. A promo commission earned by
someone else is not the owner's data to erase.

**The referrer keeps their reward when the referred user leaves.** `Referral` is
Restrict on both sides and is untouched at erasure; it is only cleared at the
18-month purge, and only for an account that touched nothing else.

---

## 4. Promise → code

| Published promise | Where | Kept by |
|---|---|---|
| "In the app — open your account settings and choose to delete your account." | `/privacy` §13 | `DeleteAccountCard` → `DeleteAccountModal` → `POST /auth/account/deletion` |
| "We verify the request came from you." | `/privacy` §13 | Password re-auth, or emailed OTP for social-only accounts, **plus** typed confirm phrase |
| "We delete or de-identify your personal data within 30 days — in most cases within 21 — including any data received through social login." | `/privacy` §13 | `graceDays: 21` → `anonymizeUser()` nulls identity and deletes `Account` rows (Facebook/Google). `policyMaxDays: 30` is the outer commitment; the 9-day gap is the safety margin |
| "We confirm completion by email." | `/privacy` §13 | `accountDeletionCompletedEmail`, sent to the address held in memory after the row is tombstoned |
| "Some records must be retained where law, tax, AML or fraud-prevention require it." | `/privacy` §13 | The pseudonymous shell; `retentionMonths: 18`, `statutoryYears: 6` |
| "Property location — 12 months, generalized to a 1 km grid." | `/privacy` §12 | `coarsenGps()` — 2 decimal places ≈ 1.1 km |
| "Activity logs — summarized into de-identified statistical data." | `/privacy` §12 | `eventLog.deleteMany`, `paymentAttemptLog` IP/UA/email/phone nulled |
| "Deletion must be available in-app (Meta requires a working data-deletion route)." | `DATA-HANDLING.md` §7 | In-app route **and** `POST /facebook/data-deletion` with signed-request verification |
| "Erasure after a 21-day recovery window, and in every case within 30 days." | `DATA-HANDLING.md` §7 | `processAccountDeletions` daily cron |
| "Account deletion to evade a dispute → permanent ban." | `/refund` §06 | `OPEN_DISPUTE` blocker; request recorded as `BLOCKED` |
| Subscription fees non-refundable once the period starts | `/refund` §03 | `cancelAtPeriodEnd` only; the dialog says so before confirming |

---

## 5. Meta callback

`POST /facebook/data-deletion` verifies the `signed_request` HMAC against
`FACEBOOK_APP_SECRET` before doing anything — without that check it is an
unauthenticated "delete this user" endpoint. It then creates a **normal**
deletion request (same 21-day path, no fast lane) and returns
`{ url, confirmation_code }`. The URL resolves to `/data-deletion/[code]`, which
shows status and dates and **no personal data**, because that URL travels to Meta.

Set in the Meta app dashboard → Settings → Basic:
- Data Deletion Request Callback URL: `https://api.newcondo.homes/facebook/data-deletion`
- (Alternatively a Data Deletion Instructions URL: `https://newcondo.homes/privacy#deletion`)

---

## 6. Operational checklist before this goes live

1. Replace `packages/db/prisma/schema.prisma` with `newcondo-backend/schema.prisma`, then
   `npx prisma migrate dev --name account_deletion`. One breaking change to know
   about: `SubscriptionInvoice.userId` becomes nullable (it was `String` with
   `onDelete: Cascade` — a tax record that deleted itself with the user).
2. Append the constants and email templates to their existing files; re-export
   from the `shared` barrels.
3. Mount `accountDeletionRouter` inside the auth router and
   `metaDataDeletionRouter` at the app root.
4. Add the two login guards documented at the bottom of
   `auth.account-deletion.ts` (anonymized → refuse; deactivated → restricted
   session that can only reach the restore screen).
5. Schedule the cron at 03:40 daily. **Run once with `{ dryRun: true }` and read
   the log** before letting it erase anything.
6. Alert if `failed > 0` on two consecutive runs, or if any `PENDING` request has
   `anonymizeAfter` more than 3 days in the past. Erasure is due on day 21 against
   a 30-day published promise, so that is an early warning with ~6 days of
   margin — escalate hard at 6 days, where the NDPA exposure becomes real.
7. Add the deletion route to the Meta app dashboard and re-test with a real
   Facebook test user before submitting for review.

---

## 8. Schema audit — what the first draft got wrong

The services were re-verified field-by-field against `schema.merged.prisma`.
These were all real defects, each of which would have thrown at runtime or,
worse, silently done nothing:

| Assumed | Actually |
|---|---|
| `Dispute.userId` | `Dispute.renterId` — an owner or agent is a party only via `rental.property`, so the lookup is now role-shaped |
| `DisputeStatus.OPEN` / `ESCALATED` | `PENDING · UNDER_REVIEW · INVESTIGATING · RESOLVED · REJECTED · CANCELLED` |
| `PaymentStatus.PROCESSING` | `PENDING · SUCCESS · FAILED · CANCELLED · REFUNDED · HELD · RELEASED` |
| `Payment.payoutStatus` | No such column — settlement is `isReleased` / `releasedAt` / `commissionSettledAt` |
| `PropertyMarkingJob.requestedById` | `requestedBy` |
| `MarkingJobStatus.SUBMITTED` / `PENDING_CONFIRMATION` / `PENDING` | `QUEUED · ASSIGNED · IN_PROGRESS · COMPLETED · CANCELLED · EXPIRED · AWAITING_CONFIRMATION · DISPUTED` — an unstarted job returns to **QUEUED** |
| `MarkingQueueEntry.claimedAt` | `slotStartedAt` / `completedAt` / `abandonedAt` |
| `ShareLink.isActive` | No such column — links can only be **deleted**, so they now survive deactivation (reversible) and are deleted at erasure |
| `Subscription.cancelAtPeriodEnd` | `autoRenew` |
| `TenantInvite.email` / `.phone` | Neither exists — the identity **is** `renterId`, so unused rows are deleted |
| `SupportTicket.email` / `.phone` | Neither exists — personal data is in the free-text `title` / `description`, now redacted |
| `RewardStatus.CREDITED` | `PENDING · APPROVED · REJECTED · EXPIRED` — a live credit is `APPROVED` + `isRedeemed: false` |
| `PromotionRequest.requesterId` | `agentId` |
| `AgentInvite.email` / `.acceptedAt` | `agentEmail` / `agentId` / `usedAt` — and the agent side is `agentId`, not `ownerId` |
| `boundaryCoordinates: undefined` | `Json?` must be cleared with **`Prisma.DbNull`** — `undefined` means "don't touch" and silently no-ops. Same for the request `snapshot`. |
| — | `FeatureFlag`, `ServiceSubscription`, `AgentReferral` and `PropertyUnitImage` also hang off `User`/`Property` and were not being swept at all |
| `eventLog.deleteMany` | `userId` is nullable → **SetNull** + null the IP/UA, which keeps the analytics and matches what /privacy §12 actually promises |

Two structural fixes came out of the same pass:

1. **The purge's delete test was too narrow.** It counted payments, rentals,
   invoices and properties. Every `Restrict` relation makes `user.delete()`
   throw — so one stale support ticket or dispute comment would have made the
   purge fail every night, forever. It now counts **all 22** relations, and the
   `_count` block is documented as having to stay in sync with
   `schema-additions.on-delete.prisma`.
2. **Owner service visits are now a blocker.** A vendor scheduled to attend a
   property whose owner has left is an operational and safety problem, not a
   data one — `SERVICE_JOB_OPEN`.

---

## 9. Still outstanding (not fixed by this change)

These are claims in the published policies that this feature does **not** make
true. Each is a representation that can be held against the company — either
implement it or soften the wording:

- **AES-256 at rest / TLS 1.3 in transit** — true only if RDS + S3 encryption
  and a TLS 1.3-min policy are actually configured and evidenced. Verify per
  provider, or say "encryption in transit and at rest" without naming versions.
- **NDPC notification within 48 hours** — needs a written, rehearsed breach
  runbook with a named decision-maker, or the number should say "without undue
  delay, and within the period required by the NDPA".
- **30-day backup scrubbing** — this implementation deletes from the live
  database and S3. Backup rotation must actually expire deleted data within 30
  days, or the policy should describe backups as retained on a fixed cycle and
  isolated from active systems.
- **e-GIS validation / EFCC staff vetting** — remove unless there is a contract
  or a record of each check performed.
- **NDPC registration** as a data controller of significant importance, plus the
  annual audit filing. Non-registration is an independent penalty.
- **DPAs with every sub-processor** in `SUBPROCESSOR_ROWS`, and the §3 onboarding
  rule added to the checklist.
