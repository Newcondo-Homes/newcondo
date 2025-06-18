import { prisma } from '@newcondo/db'
import { Role } from '@newcondo/db'
import bcrypt from 'bcryptjs'

export class AuthService {
  async createUser(userData: {
    email: string
    password: string
    name?: string
    role?: Role
    phone?: string
  }) {
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(userData.password, saltRounds)

    return await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        name: userData.name || null,
        phone: userData.phone || null,
        role: userData.role || Role.RENTER,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        verificationStatus: true,
        createdAt: true,
      }
    })
  }

  async validateUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        emailVerified: true,
        verificationStatus: true,
      }
    })

    if (!user || !user.passwordHash) {
      return null
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    
    if (!isPasswordValid) {
      return null
    }

    const { passwordHash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async updatePassword(userId: string, newPassword: string) {
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(newPassword, saltRounds)

    return await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    })
  }
}