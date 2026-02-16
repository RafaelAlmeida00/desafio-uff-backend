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
  const token = req.cookies?.token

  if (!token) {
    logger.warn(
      { method: req.method, path: req.originalUrl, ip: req.ip },
      'Tentativa de acesso sem cookie de autorização',
    )
    throw new AppError('Não autorizado', 401)
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload

    req.userId = Number(payload.sub)
    next()
  } catch {
    logger.warn(
      { method: req.method, path: req.originalUrl, ip: req.ip },
      'Token de cookie inválido ou expirado',
    )
    throw new AppError('Token inválido ou expirado', 401)
  }
}
