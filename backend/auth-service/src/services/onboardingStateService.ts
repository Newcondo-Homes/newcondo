// backend/auth-service/src/services/onboardingStateService.ts
// ============================================================
// THE SERVER DECIDES WHERE THE USER IS IN ONBOARDING.
//
// Why this exists: the client used to infer the step from session fields
// (`u.phone ? "plan" : "details"`). That is what made OAuth fragile — the
// moment we register before the OTP, a signed-in-but-unverified user hit that
// same effect and was pushed straight past verification to the plan step.
// Guessing from two or three session fields cannot express the real rule,
// which spans the User row, its linked OAuth accounts, and its subscription.
//
// One resolver, one answer, both paths (email form and Google/Facebook) share
// it. No schema change: every input below already exists —
//   User.emailVerified · User.email · User.phone · User.accounts[] · Subscription
//
// STEP ORDER, and why:
//   1. done     already subscribed → leave onboarding entirely (no double charge)
//   2. details  missing email or phone → collect them
//   3. verify   email present but unproven → OTP it
//   4. plan     everything known and proven → choose and pay
//
// details comes BEFORE verify on purpose: Facebook frequently returns no email
// at all, so there is nothing to send a code to until SocialAccountDetails has
// collected one. Verifying an address we do not yet have is impossible.
// ============================================================
import { prisma } from "@newcondo/db";

/**
 * Facebook may return no email at all. Prisma requires User.email, so the
 * provider writes fb_<id>@placeholder.newcondo to let the row be created; the
 * details step then collects a real address.
 *
 * MUST match PLACEHOLDER_EMAIL_DOMAIN in packages/auth/auth.full.ts. Duplicated
 * rather than imported because that module is Next.js-only (it pulls in
 * next-auth providers) and this Express service cannot load it.
 */
const PLACEHOLDER_EMAIL_DOMAIN = "placeholder.newcondo";
export const isPlaceholderEmail = (email?: string | null): boolean =>
  !!email && email.endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`);

export type OnboardingStep = "details" | "verify" | "plan" | "done";

export interface OnboardingState {
  step: OnboardingStep;
  /** "dashboard" when they are already a customer; the page redirects on this. */
  redirectTo: "dashboard" | null;
  /** True only for accounts whose email address is not yet proven. */
  needsEmailVerification: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  /** Which sign-in methods are linked — lets the client explain itself. */
  authProviders: string[];
  /** Set when a PENDING checkout was abandoned, so we can preselect the plan. */
  pendingPlan: string | null;
  subscriptionStatus: string | null;
  role: string;
  email: string | null;
  name: string | null;
}

/** Statuses that mean "this person is already a customer — stop onboarding them". */
const SETTLED = ["ACTIVE", "FREE_ACTIVE", "TRIAL"] as const;

export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true, phone: true, role: true, emailVerified: true,
      accounts: { select: { provider: true } },
      subscription: { select: { status: true, planType: true } },
    },
  });
  if (!user) throw new Error("User not found");

  const authProviders = user.accounts.map((a) => a.provider);
  // A placeholder is NOT an email. Facebook can decline to return one (the user
  // unticks email on the consent screen, or holds a phone-only account), and
  // because Prisma requires User.email the provider writes
  // fb_<id>@placeholder.newcondo so the row can be created at all.
  //
  // Counting that as a real address broke the Facebook path twice over: the
  // details step never asked for an email (hasEmail was true), and the verify
  // step then tried to mail a verification code to a domain that does not
  // exist. Treating it as absent sends them to `details` first, where they type
  // a real address, and only then to `verify`.
  const hasEmail = !!user.email && !isPlaceholderEmail(user.email);
  const hasPhone = !!user.phone;
  const status = user.subscription?.status ? String(user.subscription.status) : null;

  // EVERY account proves its address with OUR OTP — no provider exemption.
  //
  // Google previously skipped this entirely: its profile() mapping set
  // emailVerified from Google's own email_verified assertion, so
  // needsEmailVerification was false at creation and the user went straight to
  // `plan`. That is why Google signups never received a code. emailVerified now
  // starts null for both providers and is set only by otpController.verifyOTP,
  // when the user enters the code we actually sent.
  const needsEmailVerification = hasEmail && !user.emailVerified;

  const base = {
    needsEmailVerification,
    hasEmail,
    hasPhone,
    authProviders,
    pendingPlan: status === "PENDING" ? (user.subscription?.planType ?? null) : null,
    subscriptionStatus: status,
    role: String(user.role),
    // Never surface the placeholder to the client — the flow prefills the draft
    // from this, and showing fb_1234@placeholder.newcondo in the email field
    // would read as a real address the user is expected to keep.
    email: hasEmail ? user.email : null,
    name: user.name,
  };

  // 1. Already a customer.
  if (status && (SETTLED as readonly string[]).includes(status)) {
    return { ...base, step: "done", redirectTo: "dashboard" };
  }

  // 2. Anything missing that we cannot proceed without.
  if (!hasEmail || !hasPhone) {
    return { ...base, step: "details", redirectTo: null };
  }

  // 3. Prove the address.
  if (needsEmailVerification) {
    return { ...base, step: "verify", redirectTo: null };
  }

  // 4. Choose and pay. A PENDING subscription resumes here rather than jumping
  // back into payment — re-entering the payment phase from a restored state
  // could fire a second charge for someone who merely reopened the tab.
  return { ...base, step: "plan", redirectTo: null };
}

/* ============================================================
   ROUTE — add to backend/combined-backend/src/routes/auth.ts

   GET /api/v1/auth/onboarding-state   (authMiddleware)

     router.get("/onboarding-state", authMiddleware, async (req, res, next) => {
       try {
         res.json({ success: true, data: await getOnboardingState(req.user!.id) });
       } catch (e) { next(e); }
     });

   Note this replaces the client's guesswork, NOT the payment service's
   /payments/subscriptions/onboarding-state (which answers a narrower question
   about the subscription row). If you'd rather have one endpoint, keep this one
   and have the page guard read `redirectTo` from it.
   ============================================================ */
