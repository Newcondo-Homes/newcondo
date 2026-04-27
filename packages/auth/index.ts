import { PrismaAdapter } from "@auth/prisma-adapter";
import { getUserById } from "./src/utils";
import authConfig from "./auth.config";
import NextAuth from "next-auth";
import { prisma, Role, User, UserType, VerificationStatus } from "@newcondo/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  callbacks: {
    async signIn({ account }) {
      if (account?.provider !== "credentials") return true;
      // const existingUser = await prisma.user.findUnique({ where: { email: user.email as string } });

      //   const existingUser = await getUserById(user.id as string);

      //   if (!existingUser?.emailVerified) return false;
      // you can filter users who login/signup with google here

      // If using credentials provider, you might want to check email verification here
      // if (account?.provider === "credentials" && user?.id) {
      //   const existingUser = await getUserById(user.id);
      //   if (!existingUser?.emailVerified) {
      //     return false; // Prevent sign-in if email is not verified
      //   }
      // }
      return true;
    },
    async jwt({ token, user, account, profile, trigger, session }) {
      if (user || account) {
        token.id = user.id;
        token.sub = user.id;

        const existingUser = await getUserById(user.id as string);

        if (existingUser) {
          token.email = existingUser.email;
          token.name = existingUser.name;
          token.picture = existingUser.image; // Use 'picture' for image URL in JWT
          token.role = existingUser.role;
          token.phone = existingUser.phone;
          token.verificationStatus = existingUser.verificationStatus;
          token.isAvailableForMarking = existingUser.isAvailableForMarking;
          token.userType = existingUser.userType;
          token.referralCode = existingUser.referralCode;
          token.companyName = existingUser.companyName;
        }
      }

      // Be careful: only merge what you expect to be updated client-side.
      // For security, crucial fields like `role` or `verificationStatus` should ideally
      // be updated via server-side actions, not directly from client-sent session updates.
      // However, if you explicitly want to allow updating certain fields (e.g., name, image)
      // via `session.update()`, you can merge them.
      // Example: If you update `name` or `image` client-side
      // if (session.user?.name) token.name = session.user.name;
      // if (session.user?.image) token.picture = session.user.image; // Update picture in JWT

      // Handle session update
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;

        session.user.id = token.sub; // The user's ID
        session.user.email = token.email as string;
        session.user.name = token.name;
        session.user.image = token.picture; // Map 'picture' from JWT to 'image' in Session.user

        // Populate comprehensive user data from the JWT
        if (!token.referralCode) {
          const existingUser = await getUserById(session.user.id as string);
          session.user.companyName = existingUser?.companyName;
          session.user.referralCode = existingUser?.referralCode;
          session.user.userType = existingUser?.userType;
          session.user.isAvailableForMarking =
            existingUser?.isAvailableForMarking;
          session.user.verificationStatus =
            existingUser?.verificationStatus as VerificationStatus;
          session.user.phone = existingUser?.phone;
          session.user.role = existingUser?.role as Role;

          return session;
        }

        session.user.role = token.role as Role;
        session.user.phone = token.phone as string;
        session.user.verificationStatus =
          token.verificationStatus as VerificationStatus;
        session.user.isAvailableForMarking =
          token.isAvailableForMarking as boolean;
        session.user.userType = token.userType as UserType;
        session.user.referralCode = token.referralCode as string;
        session.user.companyName = token.companyName as string;
        console.log("INside session ✅", session);
      }

      return session;
    },
  },
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  //   pages: {
  //   signIn: "/login",
  //   signUp: "/register",
  //   error: "/login",
  // },
  // events:{
  // async signIn({ user, account, isNewUser }) {

  //   // Log sign-in event
  //   if (user.id){
  //     await prisma.eventLog.create({
  //       data: {
  //         userId: user.id,
  //         type: "LOGIN",
  //         metadata: {
  //           provider: account?.provider || "credentials",
  //           isNewUser
  //         }
  //       }
  //     })
  //   }
  // },

  // async signOut({ session }) {
  //   // Log sign-out event
  //   if ( session?.user?.id) {
  //     await prisma.eventLog.create({
  //       data: {
  //         userId: session.user.id,
  //         type: "LOGOUT",
  //         metadata: {}
  //       }
  //     })
  //   }
  // }
  // },
  ...authConfig,
});

export const getServerSession = auth;