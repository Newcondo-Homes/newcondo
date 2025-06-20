import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getUserByEmail } from "@newcondo/db/src/utils";
import type { NextAuthConfig } from "next-auth";
import { LoginSchema } from "./schemas";
// import { prisma } from "./lib/db";
import { prisma } from "@newcondo/db"
import { Role } from "@newcondo/db"
import bcrypt from "bcryptjs";


import getServerSessions from "next-auth";

export default {
  providers: [
    Google,
    Credentials({
       credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        phone: { label: "Phone", type: "tel" },
        otpCode: { label: "OTP Code", type: "text" },
        loginType: { label: "Login Type", type: "text" } // "email" | "phone" | "otp"
      },
      authorize: async (credentials) => {
        // const validatedFields = LoginSchema.safeParse(credentials);

        // if (validatedFields.success) {
        //   const { email, password } = validatedFields.data;

        //   const user = await getUserByEmail(email);

        //   if (!user) {
        //     throw new Error("Invalid Credentials");
        //   }

        //   if (!user || !user.passwordHash) return null;

        //   const passwordMatch = await bcrypt.compare(
        //     password,
        //     user.passwordHash
        //   );

        //   if (!passwordMatch) throw new Error("Invalid Credentials");

        //   return {
        //     id: user.id,
        //     email: user.email,
        //     name: user.name,
        //     role: user.role,
        //     image: user.image,
        //     emailVerified: user.emailVerified,
        //     verificationStatus: user.verificationStatus,
        //   };
        //   //   const user = await getUserByEmail(email);
        //   //   if (!user || !user.password) return null;

        //   //   const passwordMatch = await bcrypt.compare(password, user.password);

        //   //   if (passwordMatch) return user;
        // }
        if (!credentials) return null;

        try {
          const { email, password, phone, otpCode, loginType } = credentials;

          //OTP login
          if (loginType === "otp" && otpCode){
            const identifier = email || phone;
            if (!identifier) return null;

            // verify OTP
            const otpRecord = await prisma.oTPCode.findFirst({
              where: {
                identifier,
                code: otpCode,
                type: email ? "EMAIL_VERIFICATION" : "PHONE_VERIFICATION",
                verified: false,
                expiresAt: { gt: new Date() }
              }
            })

            if (!otpRecord || otpRecord.attempts >= otpRecord.maxAttempts){
              return null;
            }


            // mark OTP as verified
            await prisma.oTPCode.update({
              where: { id: otpRecord.id },
              data: {verified: true}
            })

            // Find or create user
            const user = await prisma.user.findFirst({
              where: email ? {email} : { phone }
            })

            if (!user ) return null;

            // update verification status
            if (email) {
              await prisma.user.update({
                where: {id: user.id},
                data: { emailVerified: new Date() }
              })
            } else {
              await prisma.user.update({
                where: {id: user.id },
                data: { phoneVerified: new Date()}
              })
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              image: user.image,
              phone: user.phone,
              verificationStatus: user.verificationStatus
            }
          }

          // Email/Password Login
          if (loginType === "email" && email && password) {
            const user = await prisma.user.findUnique({
              where: { email }
            })

            if (!user || !user.passwordHash) return null

            const isValidPassword = await bcrypt.compare(password, user.passwordHash)
            if (!isValidPassword) return null

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              image: user.image,
              phone: user.phone,
              verificationStatus: user.verificationStatus
            }
          }
        } catch (error){
          console.error("Auth error:", error);
          return null;
        }
        return null;
      },
    }),
  ],
  // debug: true,
} satisfies NextAuthConfig;
