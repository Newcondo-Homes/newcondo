import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export * from "@prisma/client";

export type Decimal = Prisma.Decimal;
export type JsonValue = Prisma.JsonValue;

// 2. FIXED: Export Decimal as an absolute runtime value constructor, not a type alias
export const DecimalClass = Prisma.Decimal;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" 
      ? ["query", "info", "warn", "error"] 
      : ["warn", "error"],
  });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();


if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };
export type { Role, User, Property, Prisma } from '@prisma/client'
export type { PropertyMarkingJob } from "@prisma/client"
  