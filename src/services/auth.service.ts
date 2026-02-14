import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UserRepository } from '../repositories/user.repository'
import { AppError } from '../utils/errors/app.errors'
import { env } from '../utils/config/env'
import { SignupInput, LoginInput } from '../utils/schemas/auth.schema'
import type { User } from '@prisma/client'
import { SignOptions } from 'jsonwebtoken'
import { logger } from '../utils/config/logger'

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async signup(data: SignupInput): Promise<Omit<User, 'senha'>> {
    const existing = await this.userRepository.findByEmail(data.email)
    if (existing) {
      logger.warn({ email: data.email }, 'Tentativa de cadastro com email já existente')
      throw new AppError('Usuário já cadastrado, faça login.', 409)
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
      logger.warn({ email: data.email }, 'Tentativa de login com email não cadastrado')
      await bcrypt.compare(data.senha, '$2b$10$dummyhashfortimingattackpreven')
      throw new AppError('Credenciais inválidas', 401)
    }

    const validPassword = await bcrypt.compare(data.senha, user.senha)
    if (!validPassword) {
      logger.warn({ email: data.email }, 'Tentativa de login com senha inválida')
      throw new AppError('Credenciais inválidas', 401)
    }

    const options: SignOptions = {
      algorithm: 'HS256',
      expiresIn: env.JWT_EXPIRES_IN,
    }

    const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, options)

    return { token }
  }
}