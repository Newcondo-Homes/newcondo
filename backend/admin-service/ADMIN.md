# Admin — apps/admin + backend/admin-service

Separate Next.js app (`apps/admin`, port 3003) for the Newcondo team, backed by `admin-service` at `/api/v1/admin`. Design preview: `Admin Dashboard.html`.

## Permissions (one source of truth)
`backend/shared/src/constants/adminScopes.ts` → modules → scopes; roles are presets (`SUPER_ADMIN` = all). Per person: `grantedScopes` / `revokedScopes` (only real deltas are stored). Resolved from the DB on **every request** (`requireStaff`), so a freeze or permission change applies immediately.

**Add a capability:** add the scope → guard the route with `need("x.y")` → wrap the UI in `<Can scope="x.y">` (+ one nav line in `apps/admin/lib/scopes.ts` if it's a page). The invite flow and permission editor render it automatically.

**Escalation guards:** super admin can't be invited/edited/frozen via API · nobody edits themselves · a non-super `staff.manage` holder can only grant scopes they hold, never `staff.manage`, and can't edit another staff manager · optional `ADMIN_EMAIL_DOMAINS`.

## Account enforcement — `accountGuard` (mounted first in combined-backend)
- Suspended / deleted → 403/401 on **every** service, not just admin.
- "Sign out everywhere", suspend and freeze set `User.sessionsRevokedAt`; tokens issued earlier are rejected. `@newcondo/auth` also ends the NextAuth session on `update()`, so it can't re-mint around a revocation.
- Device & usage tracking (`UserDevice`, ≤1 write / device / 5 min). Support sessions are never counted as the user's own activity.
- Support sessions (`imp` claim, 30 min, reason-bound, one per staff member): blocked from withdrawals, payments, card charges, refunds, bank, email/password, deletion, referral code and `/admin`; every write is logged as `IMPERSONATED_ACTION`. The user is emailed.

## Business rules the admin can't bypass
- **Identity:** a person is verified only when a government ID and a selfie are both approved (one card per person, one transaction).
- **Listing approval:** owner verified · ownership document · owner-consent document for agent listings · boundary marked **and confirmed**. Rejecting returns it to DRAFT, and can optionally clear the mask for re-marking.
- **Visibility:** staff hide or show a listing with `adminHiddenAt`. `status` is never changed, so a RENTED house stays RENTED. Browse and share links also exclude suspended owners.
- **Marking:** NEWCONDO jobs (₦25,000, no marker payout) go only to `isFieldMarker` staff-agents. Agents never see them in the broadcast queue (previously they did paid work for ₦0). Disputes: *uphold* → `confirmMarking()` pays the marker; *re-mark* → the ₦1,000 hold is reversed to escrow and the job re-opens, blocked if any tranche already reached the marker's wallet. `ownedSlot` no longer lets any agent submit on an unassigned job. `disputeMarking` only works while awaiting confirmation.
- **Rent:** escrow = `Payment.status HELD`. Release and split run only through `releaseEscrowAndSplit` (plan commission rate; the split is read from the ledger). Early release requires a reason and confirmation that the renter agreed in writing. **There is no stand-alone refund:** the only refund is upholding a rent dispute (`refundHeldRent`, which voids referral rewards).
- **Failed transfers:** read-only. Withdrawals are already reversed to the wallet and vendor batches re-queue themselves; a manual retry could pay twice.
- **Vendors:** approval needs a verified bank account, a service area and at least one service. Assign/remove/suspend go through vendor-service (`adminAssignVendor`, `adminRemoveVendor`, `endVendorAssignments`), which keeps the `activeKey` uniqueness, capacity locks and plan-covered services. A removed vendor is never auto-matched back. Visits are **rebooked by the scheduler** (funded dates only), never hand-dated. A visit issue can be closed as done only if the on-site code was verified.
- **Referrals:** clear the hold → events replay; void needs a reason.
- **Compliance:** explicit `select` everywhere. No BVN/NIN/document numbers (masked to the last 4), no password hashes, no full bank numbers. Document previews use 5-minute presigned URLs. Staff-typed text is HTML-escaped in emails. Every mutation writes an `AdminAction` in the same transaction.

## Setup checklist
1. `packages/db/prisma/schema.prisma` already contains the admin additions (verified against production migrations) → `npx prisma migrate dev --name admin_staff`.
2. Add `@newcondo/admin-service` to combined-backend deps (`routes/admin.ts` + `router.use(accountGuard)` are wired).
3. Env: `ADMIN_APP_URL`, `PLATFORM_URL`, `VENDORS_APP_URL`, `IP_HASH_SALT`, optional `ADMIN_EMAIL_DOMAINS`.
4. apps/platform + apps/vendors: add a `/support-session` page that reads `#t=` into memory only, uses it as the Bearer token, and shows a persistent "Newcondo support session" bar.
5. First super admin: `scripts/create-super-admin.ts <email> <name>` prints a one-use link.
6. Flag the field team: Users → agent → Edit → "NewCondo field marker".
