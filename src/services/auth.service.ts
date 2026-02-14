import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UserRepository } from '../repositories/user.repository'
import { AppError } from '../utils/errors/app.errors'
import { env } from '../utils/config/env'
import { SignupInput, LoginInput } from '../utils/schemas/auth.schema'
import type { User } from '@prisma/client'

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async signup(data: SignupInput): Promise<Omit<User, 'senha'>> {
    const existing = await this.userRepository.findByEmail(data.email)
    if (existing) {
      throw new AppError('E-mail já cadastrado', 409)
    }

    const hashedPassword = await bcrypt.hash(data.senha, 10)
    const user = await this.userRepository.create({
      ...data,
      senha: hashedPassword,
    })

    const { senha, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async login(data: LoginInput): Promise<{ token: string }> {
    const user = await this.userRepository.findByEmail(data.email)

    if (!user) {
      await bcrypt.compare(data.senha, '$2b$10$dummyhashfortimingattackpreven')
      throw new AppError('Credenciais inválidas', 401)
    }

    const validPassword = await bcrypt.compare(data.senha, user.senha)
    if (!validPassword) {
      throw new AppError('Credenciais inválidas', 401)
    }

    const token = jwt.sign(
      { sub: user.id },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    )

    return { token }
  }
}