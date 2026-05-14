// Edge-compatible — only imports from auth.config.ts (no Prisma)
import NextAuth from "next-auth";
import authConfig from "./auth.config";

export const { auth } = NextAuth(authConfig);