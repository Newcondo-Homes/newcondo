import type {} from './src/types.d';
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getUserById } from "./src/utils";
import authFullConfig from "./auth.full";
import NextAuth from "next-auth";
import { prisma, Role, UserType, VerificationStatus } from "@newcondo/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  callbacks: {
    async signIn({ account }) {
      if (account?.provider !== "credentials") return true;
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
          token.role = existingUser.role;
          token.phone = existingUser.phone;
          token.verificationStatus = existingUser.verificationStatus;
          token.isAvailableForMarking = existingUser.isAvailableForMarking;
          token.userType = existingUser.userType;
          token.referralCode = existingUser.referralCode;
          token.companyName = existingUser.companyName;
        }
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.email = token.email as string;
        session.user.name = token.name;
        session.user.image = token.picture;

        if (!token.referralCode) {
          const existingUser = await getUserById(session.user.id as string);
          session.user.companyName = existingUser?.companyName;
          session.user.referralCode = existingUser?.referralCode;
          session.user.userType = existingUser?.userType;
          session.user.isAvailableForMarking = existingUser?.isAvailableForMarking;
          session.user.verificationStatus = existingUser?.verificationStatus as VerificationStatus;
          session.user.phone = existingUser?.phone;
          session.user.role = existingUser?.role as Role;
          return session;
        }

        session.user.role = token.role as Role;
        session.user.phone = token.phone as string;
        session.user.verificationStatus = token.verificationStatus as VerificationStatus;
        session.user.isAvailableForMarking = token.isAvailableForMarking as boolean;
        session.user.userType = token.userType as UserType;
        session.user.referralCode = token.referralCode as string;
        session.user.companyName = token.companyName as string;
      }
      return session;
    },
  },
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  jwt: { maxAge: 30 * 24 * 60 * 60 },
  ...authFullConfig,
});

export const getServerSession = auth;