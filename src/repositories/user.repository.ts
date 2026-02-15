import { prisma } from '../utils/lib/prisma'
import type { User } from '@prisma/client'

export class UserRepository {
  async create(data: { nome: string; email: string; senha: string }): Promise<User> {
    return prisma.user.create({ data })
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } })
  }
  
  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } })
  }
}