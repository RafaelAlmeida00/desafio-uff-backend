import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors/app.errors'
import { logger } from '../utils/config/logger'

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction  
): void {
  if (err instanceof AppError) {
    logger.warn({ err, statusCode: err.statusCode }, `Erro operacional: ${err.message}`)
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    })
    return
  }

  logger.error({ err }, 'Erro interno do servidor não tratado')
  res.status(500).json({ message: 'Erro interno do servidor' })
}