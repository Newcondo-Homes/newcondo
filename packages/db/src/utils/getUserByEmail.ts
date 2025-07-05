import { prisma } from "../..";
import { User } from "@prisma/client";

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (!existingUser) return null;
  return existingUser;
};
