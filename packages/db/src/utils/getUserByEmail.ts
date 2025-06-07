import { prisma } from "../..";

export const getUserByEmail = async ( email: string) => {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (!existingUser) return null;
    return existingUser;
}