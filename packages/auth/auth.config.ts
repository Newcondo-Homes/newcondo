import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getUserByEmail } from "@newcondo/db/src/utils";
import type { NextAuthConfig } from "next-auth";
import { LoginSchema } from "./schemas";
import { prisma } from "@newcondo/db"
import { Role } from "@newcondo/db"
import bcrypt from "bcryptjs";
import { AuthService } from "./src/services/authService"


const authService = new AuthService()

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


// // packages/auth/src/providers.ts
// import GoogleProvider from "next-auth/providers/google"
// import FacebookProvider from "next-auth/providers/facebook"
// import CredentialsProvider from "next-auth/providers/credentials"
// import { AuthService } from "./services/authService"

// const authService = new AuthService()

// export const authProviders = [
//   CredentialsProvider({
//     id: "credentials",
//     name: "Email & Password",
//     credentials: {
//       email: { 
//         label: "Email", 
//         type: "email", 
//         placeholder: "Enter your email" 
//       },
//       password: { 
//         label: "Password", 
//         type: "password" 
//       }
//     },
//     async authorize(credentials) {
//       if (!credentials?.email || !credentials?.password) {
//         throw new Error("Email and password are required")
//       }

//       try {
//         const result = await authService.signIn({
//           email: credentials.email,
//           password: credentials.password
//         })

//         if (result.success && result.user) {
//           return {
//             id: result.user.id,
//             email: result.user.email,
//             name: result.user.name,
//             role: result.user.role,
//             emailVerified: result.user.emailVerified,
//             verificationStatus: result.user.verificationStatus,
//             image: result.user.image,
//           }
//         }
        
//         throw new Error(result.error || "Authentication failed")
//       } catch (error) {
//         console.error("Auth error:", error)
//         throw new Error("Invalid credentials")
//       }
//     }
//   }),

//   CredentialsProvider({
//     id: "otp",
//     name: "OTP Verification",
//     credentials: {
//       email: { 
//         label: "Email", 
//         type: "email" 
//       },
//       otp: { 
//         label: "OTP Code", 
//         type: "text" 
//       }
//     },
//     async authorize(credentials) {
//       if (!credentials?.email || !credentials?.otp) {
//         throw new Error("Email and OTP are required")
//       }

//       try {
//         const result = await authService.verifyOTP({
//           email: credentials.email,
//           code: credentials.otp,
//           type: 'LOGIN'
//         })

//         if (result.success && result.user) {
//           return {
//             id: result.user.id,
//             email: result.user.email,
//             name: result.user.name,
//             role: result.user.role,
//             emailVerified: result.user.emailVerified,
//             verificationStatus: result.user.verificationStatus,
//             image: result.user.image,
//           }
//         }
        
//         throw new Error(result.error || "OTP verification failed")
//       } catch (error) {
//         console.error("OTP verification error:", error)
//         throw new Error("Invalid OTP")
//       }
//     }
//   }),

//   // Social providers (optional)
//   ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       authorization: {
//         params: {
//           scope: 'openid email profile'
//         }
//       }
//     })
//   ] : []),

//   ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? [
//     FacebookProvider({
//       clientId: process.env.FACEBOOK_CLIENT_ID,
//       clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
//     })
//   ] : [])
// ]