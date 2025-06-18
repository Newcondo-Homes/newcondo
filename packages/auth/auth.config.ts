import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getUserByEmail } from "@newcondo/db/src/utils";
import type { NextAuthConfig } from "next-auth";
import { LoginSchema } from "./schemas";
// import { prisma } from "./lib/db";
import bcrypt from "bcryptjs";

export default {
  providers: [
    Google,
    Credentials({
      authorize: async (credentials) => {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await getUserByEmail(email);

          if (!user) {
            throw new Error("Invalid Credentials");
          }

          if (!user || !user.passwordHash) return null;

          const passwordMatch = await bcrypt.compare(
            password,
            user.passwordHash
          );

          if (!passwordMatch) throw new Error("Invalid Credentials");

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            emailVerified: user.emailVerified,
            verificationStatus: user.verificationStatus,
          };
          //   const user = await getUserByEmail(email);
          //   if (!user || !user.password) return null;

          //   const passwordMatch = await bcrypt.compare(password, user.password);

          //   if (passwordMatch) return user;
        }
        return null;
      },
    }),
  ],
  // debug: true,
} satisfies NextAuthConfig;
