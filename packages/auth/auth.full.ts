// Full auth config with Prisma — Node.js only, never used in middleware
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@newcondo/db";
import bcrypt from "bcryptjs";
import { jwtVerify, createRemoteJWKSet } from "jose";

// Verifies a Google ID token's signature/issuer/audience without pulling in
// the extra google-auth-library dependency — jose fetches + caches Google's
// public keys (JWKS) itself.
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

async function verifyGoogleIdToken(idToken: string) {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: process.env.AUTH_GOOGLE_ID,
  });
  return payload as { email?: string; email_verified?: boolean };
}

const authFullConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      // Referenced by GoogleOneTap.tsx as signIn("googleOneTap", { credential, role, redirect:false }).
      // This provider was MISSING — signIn() targeting a nonexistent provider ID
      // falls back to NextAuth's configured error page (pages.error: "/login"),
      // which is exactly the bug: clicking One Tap navigated to
      // /login?callbackUrl=/onboarding instead of resolving with redirect:false.
      //
      // By design, One Tap only authenticates users who ALREADY exist. A brand-new
      // Google account must return null so signIn() resolves as an error object
      // (no navigation) — GoogleOneTap.tsx just logs it, and the person continues
      // via the explicit "Continue with Google" button (the real Google provider),
      // which creates new accounts.
      id: "googleOneTap",
      name: "Google One Tap",
      credentials: {
        credential: { label: "Credential", type: "text" },
        role: { label: "Role", type: "text" },
      },
      authorize: async (credentials) => {
        const idToken = credentials?.credential as string | undefined;
        if (!idToken) return null;

        let payload: Awaited<ReturnType<typeof verifyGoogleIdToken>>;
        try {
          payload = await verifyGoogleIdToken(idToken);
        } catch (err) {
          console.error("[googleOneTap] ID token verification failed:", err);
          return null;
        }
        if (!payload.email || !payload.email_verified) return null;

        // Existing-users-only — an unrecognised email returns null (no new
        // account created here); the explicit Google button handles sign-up.
        const user = await prisma.user.findUnique({ where: { email: payload.email } });
        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          phone: user.phone,
          verificationStatus: user.verificationStatus,
        };
      },
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        phone: { label: "Phone", type: "tel" },
        otpCode: { label: "OTP Code", type: "text" },
        loginType: { label: "Login Type", type: "text" },
      },
      authorize: async (credentials) => {
        if (!credentials) return null;

        try {
          const email = credentials?.email as string | undefined;
          const phone = credentials?.phone as string | undefined;
          const password = credentials?.password as string | undefined;
          const otpCode = credentials?.otpCode as string | undefined;
          const loginType = credentials?.loginType as string | undefined;

          // OTP login
          if (loginType === "otp" && otpCode) {
            const identifier = email || phone;
            if (!identifier) return null;

            const otpRecord = await prisma.oTPCode.findFirst({
              where: {
                identifier,
                code: otpCode,
                type: email ? "EMAIL_VERIFICATION" : "PHONE_VERIFICATION",
                verified: false,
                expiresAt: { gt: new Date() },
              },
            });

            if (!otpRecord || otpRecord.attempts >= otpRecord.maxAttempts) {
              return null;
            }

            await prisma.oTPCode.update({
              where: { id: otpRecord.id },
              data: { verified: true },
            });

            const user = await prisma.user.findFirst({
              where: email ? { email } : { phone },
            });

            if (!user) return null;

            if (email) {
              await prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: new Date() },
              });
            } else {
              await prisma.user.update({
                where: { id: user.id },
                data: { phoneVerified: new Date() },
              });
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              image: user.image,
              phone: user.phone,
              verificationStatus: user.verificationStatus,
            };
          }

          // Email/Password login
          if (loginType === "email" && email && password) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user || !user.passwordHash) return null;

            const isValidPassword = await bcrypt.compare(
              password,
              user.passwordHash
            );
            if (!isValidPassword) return null;

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              image: user.image,
              phone: user.phone,
              verificationStatus: user.verificationStatus,
            };
          }
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export default authFullConfig;