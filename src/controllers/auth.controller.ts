import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'
import { signupLinks, loginLinks } from '../utils/helpers/hateoas'
import { UserRepository } from '../repositories/user.repository'
import { AppError } from '../utils/errors/app.errors'
import { env } from '../utils/config/env'

interface SignupRequest {
  nome: string
  email: string
  senha: string
}

interface LoginRequest {
  email: string
  senha: string
}

export class AuthController {
  constructor(private authService: AuthService, private userRepository: UserRepository) {}

  signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nome, email, senha } = req.body as SignupRequest
      const user = await this.authService.signup({ nome, email, senha })
      res.status(201).json({
        data: user,
        _links: signupLinks(),
      })
    } catch (error) {
      next(error)
    }
  }

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, senha } = req.body as LoginRequest
      const { token, user } = await this.authService.login({ email, senha })
      const secureCookie = env.NODE_ENV === 'production'

      res
        .status(200)
        .cookie('token', token, {
          httpOnly: true,
          secure: secureCookie,
          sameSite: 'lax',
          path: '/',
        })
        .json({
          data: user,
          _links: loginLinks(),
        })
    } catch (error) {
      next(error)
    }
  }

  logout = (req: Request, res: Response, next: NextFunction) => {
    try {
      const secureCookie = env.NODE_ENV === 'production'

      res
        .status(200)
        .clearCookie('token', {
          httpOnly: true,
          secure: secureCookie,
          sameSite: 'lax',
          path: '/',
        })
        .json({
          message: 'Logout realizado com sucesso',
          _links: loginLinks(),
        })
    } catch (error) {
      next(error)
    }
  }

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId

      if (!userId) {
        throw new AppError('Não autenticado', 401)
      }

      const user = await this.userRepository.findById(userId)

      if (!user) {
        throw new AppError('Usuário não encontrado', 404)
      }

      res.status(200).json({
        data: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      })
    } catch (error) {
      next(error)
    }
  }
}
