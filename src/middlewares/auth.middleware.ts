import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../utils/config/env'
import { AppError } from '../utils/errors/app.errors'
import { logger } from '../utils/config/logger'

declare module 'express' {
  interface Request {
    userId?: number
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    logger.warn({ req }, 'Tentativa de acesso sem autorização')
    throw new AppError('Não autorizado', 401)
  }

  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    logger.warn({ req }, 'Token de autorização malformado')
    throw new AppError('Token malformado', 401)
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload

    req.userId = Number(payload.sub)
    next()
  } catch (err) {
    logger.warn({ req }, 'Token de autorização inválido')
    throw new AppError('Token inválido ou expirado', 401)
  }

}