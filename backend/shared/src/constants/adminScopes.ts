// backend/shared/src/constants/adminScopes.ts
// ============================================================
// ADMIN SCOPES — single source of truth for staff permissions.
// Imported by admin-service (requireScope middleware) AND apps/admin
// (<Can>, nav filtering, the invite/permission editor UI).
//
// To add a new capability later:
//   1. add a scope to the right module below (or add a new module)
//   2. guard the route with requireScope("<key>")
//   3. wrap the UI with <Can scope="<key>"> — the permission editor
//      renders it automatically from this file. No other edits.
// ============================================================

export const ADMIN_MODULES = [
  { id: "users", label: "Users", desc: "Owners, agents and renters", scopes: [
    { key: "users.read", label: "View accounts", desc: "Profiles, sessions, devices, usage and history", risk: "low" },
    { key: "users.write", label: "Edit accounts", desc: "Change profile details, plans and flags", risk: "medium" },
    { key: "users.suspend", label: "Suspend & restore", desc: "Lock an account and end its sessions", risk: "high" },
    { key: "users.impersonate", label: "Act as user", desc: "Open a time-boxed session as the user; every action is logged", risk: "high" },
  ]},
  { id: "verification", label: "Verification", desc: "Identity and ownership checks", scopes: [
    { key: "verification.review", label: "Review identity", desc: "Approve or reject NIN, BVN, passport and selfie checks", risk: "medium" },
    { key: "verification.revoke", label: "Revoke verification", desc: "Remove a verified badge after the fact", risk: "high" },
  ]},
  { id: "listings", label: "Properties", desc: "Listings, visibility and proof of ownership", scopes: [
    { key: "listings.read", label: "View properties", desc: "All properties, public and hidden", risk: "low" },
    { key: "listings.review", label: "Approve listings", desc: "Approve or reject listings and proof of ownership", risk: "medium" },
    { key: "listings.write", label: "Edit & hide listings", desc: "Change details, unpublish or hide a property", risk: "medium" },
  ]},
  { id: "marking", label: "Marking", desc: "Marking requests, queue and masks", scopes: [
    { key: "marking.read", label: "View marking", desc: "Requests, queue positions and submitted masks", risk: "low" },
    { key: "marking.manage", label: "Run marking jobs", desc: "Assign, reassign, take NewCondo-handled jobs", risk: "medium" },
    { key: "marking.verify", label: "Verify masks", desc: "Approve marked boundaries and allow re-marking", risk: "medium" },
  ]},
  { id: "vendors", label: "Vendors", desc: "Service providers and their visits", scopes: [
    { key: "vendors.read", label: "View vendors", desc: "Vendor accounts, assigned properties, visits", risk: "low" },
    { key: "vendors.write", label: "Manage vendors", desc: "Approve, suspend, assign or remove properties, reschedule", risk: "medium" },
  ]},
  { id: "money", label: "Money", desc: "Rent, commissions, subscriptions and payouts", scopes: [
    { key: "payments.read", label: "View payments", desc: "Rent, subscriptions, marking fees, splits", risk: "low" },
    { key: "payments.refund", label: "Refunds", desc: "Refund a rent payment inside or after escrow", risk: "high" },
    { key: "payouts.release", label: "Release payouts", desc: "Release held funds, retry failed transfers", risk: "high" },
  ]},
  { id: "referrals", label: "Referrals", desc: "Referral programs and fraud review", scopes: [
    { key: "referrals.read", label: "View referrals", desc: "Referrers, referees, ledger and exposure", risk: "low" },
    { key: "referrals.manage", label: "Fraud review", desc: "Clear holds and void referral rewards", risk: "medium" },
  ]},
  { id: "support", label: "Support", desc: "Disputes and tickets", scopes: [
    { key: "disputes.manage", label: "Resolve disputes", desc: "Rent, boundary and vendor disputes", risk: "medium" },
    { key: "support.tickets", label: "Support tickets", desc: "Reply to and close user tickets", risk: "low" },
  ]},
  { id: "staff", label: "Staff", desc: "Admin team and audit", scopes: [
    { key: "audit.read", label: "View audit log", desc: "Every admin action, with who and when", risk: "low" },
    { key: "staff.manage", label: "Manage staff", desc: "Invite, freeze and change permissions of staff", risk: "high" },
  ]},
] as const;

export type AdminScope = (typeof ADMIN_MODULES)[number]["scopes"][number]["key"];
export const ALL_ADMIN_SCOPES = ADMIN_MODULES.flatMap((m) => m.scopes.map((s) => s.key)) as AdminScope[];

/** Role presets. SUPER_ADMIN is implicit-all and cannot be edited or assigned by invite. */
export const ADMIN_ROLES = {
  SUPER_ADMIN: { label: "Super admin", desc: "Everything, including staff and permissions", scopes: ALL_ADMIN_SCOPES },
  OPERATIONS: { label: "Operations", desc: "Listings, marking and vendors", scopes: ["users.read", "listings.read", "listings.review", "listings.write", "marking.read", "marking.manage", "marking.verify", "vendors.read", "vendors.write", "disputes.manage"] },
  VERIFICATION: { label: "Verification", desc: "Identity and ownership checks", scopes: ["users.read", "verification.review", "listings.read", "listings.review", "marking.read", "marking.verify"] },
  FINANCE: { label: "Finance", desc: "Payments, payouts, referrals", scopes: ["users.read", "payments.read", "payments.refund", "payouts.release", "referrals.read", "referrals.manage", "vendors.read"] },
  SUPPORT: { label: "Support", desc: "Basic support — read-mostly", scopes: ["users.read", "listings.read", "marking.read", "vendors.read", "payments.read", "support.tickets"] },
} as const satisfies Record<string, { label: string; desc: string; scopes: readonly AdminScope[] }>;

export type AdminRole = keyof typeof ADMIN_ROLES;
export const INVITABLE_ADMIN_ROLES = (Object.keys(ADMIN_ROLES) as AdminRole[]).filter((r) => r !== "SUPER_ADMIN");

/** Effective scopes = role preset + granted − revoked. */
export function resolveAdminScopes(role: AdminRole, granted: readonly string[] = [], revoked: readonly string[] = []): AdminScope[] {
  if (role === "SUPER_ADMIN") return [...ALL_ADMIN_SCOPES];
  const set = new Set<string>(ADMIN_ROLES[role].scopes);
  granted.forEach((s) => set.add(s));
  revoked.forEach((s) => set.delete(s));
  return ALL_ADMIN_SCOPES.filter((s) => set.has(s));
}
export const hasAdminScope = (scopes: readonly string[], need: AdminScope | AdminScope[]) =>
  (Array.isArray(need) ? need : [need]).every((n) => scopes.includes(n));

export const ADMIN_LIMITS = {
  INVITE_TTL_HOURS: 72,
  IMPERSONATION_MINUTES: 30,
  STAFF_SESSION_HOURS: 12,
  PAGE_SIZE: 10,
} as const;
