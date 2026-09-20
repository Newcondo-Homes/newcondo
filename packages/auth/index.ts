// packages/auth/index.ts — FULL REPLACEMENT
// ============================================================
// Two changes from your current version, both discussed:
//
// 1. SPREAD ORDER. `...authFullConfig` was spread LAST, after `callbacks`.
//    Object spread replaces whole keys — it does not deep-merge — so the day
//    anyone adds a `callbacks` key to auth.full.ts, every callback below is
//    silently dropped: accessToken minting stops (every apiClient call 401s),
//    the isPremium refresh stops (the dashboard/onboarding redirect loop comes
//    back), and the Facebook guard disappears. It works today only because
//    auth.full.ts happens to have no callbacks key. Now the config is
//    destructured and merged explicitly, so it is order-proof.
//
// 2. THE FACEBOOK NO-EMAIL DEAD END. Returning "/login?error=NoEmailFromFacebook"
//    stranded the user: they did nothing wrong and had no way forward. Prisma's
//    User.email is required so we cannot create the row without one — but the
//    fix is to send them somewhere with a real instruction, not to bounce them
//    to a page whose only message is "please sign in". See the comment on the
//    signIn callback for the upgrade path (placeholder email + details step).
// ============================================================
import type { } from './src/types.d';
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getUserById } from "./src/utils";
import authFullConfig from "./auth.full";
import NextAuth from "next-auth";
import jwt from "jsonwebtoken";
import { prisma, Role, UserType, VerificationStatus } from "@newcondo/db";

// Pull callbacks out so ours can be merged rather than overwritten (see 1).
const { callbacks: fullCallbacks, ...fullRest } = authFullConfig;

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,

  // Spread FIRST — everything below deliberately wins.
  ...fullRest,

  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  jwt: { maxAge: 30 * 24 * 60 * 60 },

  callbacks: {
    // Anything auth.full.ts defines (e.g. `authorized` for middleware) is kept;
    // the three below take precedence.
    ...fullCallbacks,

    async signIn({ account, profile }) {
      // Facebook may return no email — that is NOT a failure, and refusing it
      // stranded the user on /login with nothing they could do. auth.full.ts's
      // profile() substitutes `fb_<id>@placeholder.newcondo`, getOnboardingState
      // reports hasEmail: false for that address, and the onboarding details
      // step collects the real one (which the verify step then OTPs).
      // Every provider is allowed through; nothing is gated here any more.
      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      if (user || account) {
        token.id = user.id;
        token.sub = user.id;

        const existingUser = await getUserById(user.id as string);
        if (existingUser) {
          token.email = existingUser.email;
          token.name = existingUser.name;
          token.picture = existingUser.image;
          token.role = existingUser?.role as Role;
          token.phone = existingUser.phone;
          token.verificationStatus = existingUser.verificationStatus;
          token.isAvailableForMarking = existingUser.isAvailableForMarking;
          token.userType = existingUser.userType;
          token.referralCode = existingUser.referralCode;
          token.companyName = existingUser.companyName;
          token.isPremium = existingUser.isPremium;
          // Register-first onboarding needs this in the session: the flow shows
          // the verify step while it is null, and the backend resolver reads the
          // same field.
          token.emailVerified = existingUser.emailVerified;

          // ── Mint the Express-compatible access token ──────────────────────
          // Signed with JWT_SECRET — the same secret Express authMiddleware
          // uses — and shaped to what it reads: decoded.userId/email/role.
          // Without this, session.accessToken is undefined and every backend
          // call through apiClient gets a 401.
          token.accessToken = jwt.sign(
            {
              userId: existingUser.id,
              email: existingUser.email,
              role: existingUser.role,
            },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
          );
        }
      }

      if (trigger === "update") {
        const fresh = await prisma.user.findUnique({ where: { id: token.id as string } });

        // The user row is GONE — deleted by an admin, or swept by the stub
        // cleanup job — but this JWT is valid for 30 days, so the browser keeps
        // presenting a session for an account that no longer exists. Every
        // write then fails with Prisma P2025 ("no record found for an update"),
        // which surfaced as an unexplained 500 on PATCH /api/user/profile.
        //
        // Returning null invalidates the token, so the user is signed out and
        // can register or log in cleanly. Do NOT let a stale token survive:
        // the alternative is an account that can browse but never write.
        if (!fresh) return null;

        token.role = fresh.role;
        token.phone = fresh.phone;
        token.isPremium = fresh.isPremium;
        // Both change mid-onboarding: email via the change-email correction,
        // emailVerified the moment the OTP is accepted. Without refreshing
        // them here, update() leaves the session showing the old address and
        // the flow keeps rendering the verify step after a successful verify.
        token.email = fresh.email;
        token.emailVerified = fresh.emailVerified;

        // Re-mint so the Bearer token carries the fresh role — otherwise a
        // role patch is invisible to Express until the next sign-in, which is
        // what caused "Plan OWNER_ESSENTIAL is not available for RENTER".
        token.accessToken = jwt.sign(
          { userId: fresh.id, email: fresh.email, role: fresh.role },
          process.env.JWT_SECRET!,
          { expiresIn: "7d" }
        );

        // Caller-supplied values last, so update({ userType }) still wins.
        if (session) token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.email = token.email as string;
        session.user.name = token.name;
        session.user.image = token.picture;

        // ── Expose accessToken so apiClient can read it ───────────────────
        // apiClient does: if (session?.accessToken) → Authorization: Bearer
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
        }

        if (!token.referralCode) {
          const existingUser = await getUserById(session.user.id as string);
          session.user.companyName = existingUser?.companyName;
          session.user.referralCode = existingUser?.referralCode;
          session.user.userType = existingUser?.userType;
          session.user.isAvailableForMarking = existingUser?.isAvailableForMarking;
          session.user.verificationStatus = existingUser?.verificationStatus as VerificationStatus;
          session.user.phone = existingUser?.phone;
          session.user.role = existingUser?.role as Role;
          session.user.isPremium = !!existingUser?.isPremium;
          session.user.emailVerified = existingUser?.emailVerified ?? null;
          return session;
        }

        session.user.role = token.role as Role;
        session.user.phone = token.phone as string;
        session.user.verificationStatus = token.verificationStatus as VerificationStatus;
        session.user.isAvailableForMarking = token.isAvailableForMarking as boolean;
        session.user.userType = token.userType as UserType;
        session.user.referralCode = token.referralCode as string;
        session.user.companyName = token.companyName as string;
        session.user.isPremium = !!token.isPremium;
        session.user.emailVerified = (token.emailVerified as Date | null) ?? null;
      }
      return session;
    },
  },
});

export const getServerSession = auth;