// apps/admin/lib/scopes.ts
// Client door onto backend-shared constants/adminScopes.ts, through the
// `@newcondo/backend-shared/constants` subpath (constants/frontend.ts) — the
// same door apps/platform and apps/vendors use. NEVER the package barrel: it
// drags ioredis / pg / sharp into the browser bundle.
// Nav and every <Can> read from here, so adding a scope in adminScopes.ts is
// all it takes for the permission editor to show it.
// (After changing backend/shared: pnpm --filter @newcondo/backend-shared build)
export { ADMIN_ROLES, ALL_ADMIN_SCOPES, ADMIN_LIMITS, resolveAdminScopes, hasAdminScope } from "@newcondo/backend-shared/constants";
export type { AdminScope, AdminRole } from "@newcondo/backend-shared/constants";
import { ADMIN_MODULES as MODULES, INVITABLE_ADMIN_ROLES as INVITABLE } from "@newcondo/backend-shared/constants";
import type { AdminScope, AdminRole } from "@newcondo/backend-shared/constants";

/** Widened, explicitly typed views of the `as const` data — so every .map((m) => …) / .map((k) => …)
 *  in the app gets a real parameter type instead of a 15-member tuple union. */
export interface AdminScopeDef { key: AdminScope; label: string; desc: string; risk: "low" | "medium" | "high" }
export interface AdminModuleDef { id: string; label: string; desc: string; scopes: readonly AdminScopeDef[] }
export const ADMIN_MODULES: readonly AdminModuleDef[] = MODULES;
export const INVITABLE_ADMIN_ROLES: readonly AdminRole[] = INVITABLE;
import { Home, ShieldCheck, MapPin, AlertTriangle, Users, Briefcase, Building2, Wallet, Gift, Lock, FileText, LifeBuoy, type LucideIcon } from "lucide-react";

/** `count` = keys of /admin/overview `queues` summed into the sidebar badge. */
export interface NavItem { href: string; label: string; icon: LucideIcon; scope?: AdminScope; any?: AdminScope[]; count?: string[] }
/** Add a page → add one line here with the scope that guards it. */
export const ADMIN_NAV: { group: string; items: NavItem[] }[] = [
  { group: "Operate", items: [
    { href: "/overview", label: "Overview", icon: Home },
    { href: "/approvals", label: "Approvals", icon: ShieldCheck, any: ["verification.review", "listings.review", "marking.verify"], count: ["identity", "listings"] },
    { href: "/marking", label: "Marking", icon: MapPin, scope: "marking.read", count: ["newMarking", "markingDisputes"] },
    { href: "/disputes", label: "Disputes", icon: AlertTriangle, any: ["disputes.manage", "support.tickets"], count: ["openDisputes", "visitIssues"] },
    { href: "/support", label: "Support tickets", icon: LifeBuoy, scope: "support.tickets", count: ["openTickets"] },
  ]},
  { group: "Accounts", items: [
    { href: "/users", label: "Users", icon: Users, scope: "users.read" },
    { href: "/vendors", label: "Vendors", icon: Briefcase, scope: "vendors.read", count: ["pendingVendors"] },
    { href: "/properties", label: "Properties", icon: Building2, scope: "listings.read" },
  ]},
  { group: "Money", items: [
    { href: "/payments", label: "Payments", icon: Wallet, scope: "payments.read", count: ["failedTransfers"] },
    { href: "/referrals", label: "Referrals", icon: Gift, scope: "referrals.read", count: ["referralHolds"] },
  ]},
  { group: "Team", items: [
    { href: "/staff", label: "Staff & access", icon: Lock, scope: "staff.manage" },
    { href: "/audit", label: "Audit log", icon: FileText, scope: "audit.read" },
  ]},
];
