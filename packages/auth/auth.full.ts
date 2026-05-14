// Full auth config with Prisma — Node.js only, never used in middleware
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@newcondo/db";
import bcrypt from "bcryptjs";

const authFullConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
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