// apps/admin/lib/scopes.ts
// Client door onto backend-shared constants/adminScopes.ts (subpath export —
// never the barrel). Nav and every <Can> read from here, so adding a scope in
// adminScopes.ts is all it takes for the permission editor to show it.
export { ADMIN_MODULES, ADMIN_ROLES, ALL_ADMIN_SCOPES, INVITABLE_ADMIN_ROLES, ADMIN_LIMITS, resolveAdminScopes, hasAdminScope } from "@newcondo/backend-shared/admin-scopes";
export type { AdminScope, AdminRole } from "@newcondo/backend-shared/admin-scopes";
import type { AdminScope } from "@newcondo/backend-shared/admin-scopes";
import { Home, ShieldCheck, MapPin, AlertTriangle, Users, Briefcase, Building2, Wallet, Gift, Lock, FileText, LifeBuoy, type LucideIcon } from "lucide-react";

export interface NavItem { href: string; label: string; icon: LucideIcon; scope?: AdminScope; any?: AdminScope[]; count?: string }
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
