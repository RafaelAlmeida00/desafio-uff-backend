import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'
import { signupLinks, loginLinks } from '../utils/helpers/hateoas'

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
  constructor(private authService: AuthService) {}

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
      const result = await this.authService.login({ email, senha })
      res.status(200).json({
        data: result,
        _links: loginLinks(),
      })
    } catch (error) {
      next(error)
    }
  }
}