import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// ⚠️ This file must be Edge-compatible
// NO imports from @newcondo/db, bcryptjs, or any Node.js built-ins
const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      return isLoggedIn;
    },
  },
};

export default authConfig;