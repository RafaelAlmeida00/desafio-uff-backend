import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors/app.errors'

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction  
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    })
    return
  }

  console.error(err)
  res.status(500).json({ message: 'Erro interno do servidor' })
}