// backend/admin-service/src/validators/schemas.ts
// Every body/query is .strict(): unknown keys are rejected.
import { z } from "zod";
import { ALL_ADMIN_SCOPES, INVITABLE_ADMIN_ROLES, ADMIN_LIMITS } from "@newcondo/backend-shared";

const scope = z.enum(ALL_ADMIN_SCOPES as [string, ...string[]]);
const role = z.enum(INVITABLE_ADMIN_ROLES as [string, ...string[]]);
const id = z.string().trim().min(8).max(64).regex(/^[A-Za-z0-9_-]+$/, "Invalid id");
const reason = z.string().trim().min(8, "Give a reason of at least 8 characters").max(300);
const optReason = z.string().trim().max(500).optional();

export const listQuery = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(ADMIN_LIMITS.PAGE_SIZE),
  q: z.string().trim().max(80).optional(),
  filter: z.string().trim().max(40).optional(),
}).strict();

export const inviteSchema = z.object({
  emails: z.array(z.string().trim().toLowerCase().email()).min(1).max(20),
  role, granted: z.array(scope).max(40).default([]), revoked: z.array(scope).max(40).default([]),
}).strict();
export const scopesSchema = z.object({ role, granted: z.array(scope).max(40), revoked: z.array(scope).max(40) }).strict();
export const freezeSchema = z.object({ frozen: z.boolean() }).strict();
export const acceptInviteSchema = z.object({
  token: z.string().min(30).max(100),
  name: z.string().trim().min(2).max(80),
  password: z.string().min(10).max(128).regex(/[A-Z]/, "Add a capital letter").regex(/[a-z]/, "Add a lowercase letter").regex(/\d/, "Add a number"),
}).strict();

export const reasonSchema = z.object({ reason }).strict();
export const suspendSchema = z.object({ suspended: z.boolean(), reason: z.string().trim().max(300).optional() }).strict()
  .refine((v) => !v.suspended || (v.reason && v.reason.length >= 8), { message: "Say why the account is being suspended (min 8 characters) — the user sees it", path: ["reason"] });
export const editUserSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().regex(/^\+?[0-9 ]{7,20}$/, "Enter a valid phone number").optional(),
  city: z.string().trim().max(60).optional(),
  isFieldMarker: z.boolean().optional(),
}).strict().refine((v) => Object.keys(v).length > 0, { message: "Nothing to change" });

export const decisionSchema = z.object({ approve: z.boolean(), reason: optReason, allowRemark: z.boolean().optional() }).strict()
  .refine((v) => v.approve || (v.reason && v.reason.length >= 8), { message: "A reason is required when rejecting (min 8 characters)", path: ["reason"] });

export const visibilitySchema = z.object({ public: z.boolean(), reason: optReason }).strict()
  .refine((v) => v.public || (v.reason && v.reason.length >= 8), { message: "Say why it is being hidden — the owner sees it", path: ["reason"] });
export const assignMarkerSchema = z.object({ markerId: id }).strict();
export const markingDisputeSchema = z.object({ outcome: z.enum(["UPHOLD_MARKER", "REMARK"]), note: optReason }).strict();
export const vendorStatusSchema = z.object({ status: z.enum(["VERIFIED", "SUSPENDED"]), reason: optReason }).strict()
  .refine((v) => v.status !== "SUSPENDED" || (v.reason && v.reason.length >= 8), { message: "Say why the vendor is being suspended", path: ["reason"] });
export const vendorAssignSchema = z.object({ propertyIds: z.array(id).min(1).max(50) }).strict();
export const visitIssueSchema = z.object({ outcome: z.enum(["REBOOK", "CLOSE_VERIFIED"]), note: optReason }).strict();
export const releaseSchema = z.object({ reason, renterConfirmed: z.literal(true, { errorMap: () => ({ message: "Only release early when the renter has confirmed" }) }) }).strict();
export const disputeResolveSchema = z.object({
  outcome: z.enum(["NO_REFUND", "FULL_REFUND", "PROPERTY_FIX_REQUIRED", "REQUEST_EVIDENCE", "DISMISSED"]),
  note: z.string().trim().min(8, "Explain the decision to both parties (min 8 characters)").max(500),
}).strict();
export const referralDecisionSchema = z.object({ action: z.enum(["CLEAR", "VOID"]), reason: optReason }).strict()
  .refine((v) => v.action !== "VOID" || (v.reason && v.reason.length >= 8), { message: "Say why the referral is being voided", path: ["reason"] });
export const ticketReplySchema = z.object({ response: z.string().trim().min(2).max(4000), status: z.enum(["IN_PROGRESS", "RESOLVED", "CLOSED"]) }).strict();
