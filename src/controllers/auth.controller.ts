import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'
import { signupLinks, loginLinks } from '../utils/helpers/hateoas'
import { User } from '@prisma/client'
import { UserRepository } from '../repositories/user.repository'
import { AppError } from '../utils/errors/app.errors'

interface SignupRequest {
  nome: string
  email: string
  senha: string
}

interface LoginRequest {
  email: string
  senha: string
}

interface AuthenticatedRequest extends Request {
  user?: User
}

export class AuthController {
  constructor(private authService: AuthService, private userRepository: UserRepository) { }

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
      res.status(200).cookie('token', token, { httpOnly: true, path: '/' }).json({
        data: user,
        _links: loginLinks(),
      })
    } catch (error) {
      next(error)
    }
  }

  logout = (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).clearCookie('token', { httpOnly: true, path: '/' }).json({
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

      res.status(200).json({
        data: user,
      })
    } catch (error) {
      next(error)
    }
  }

}