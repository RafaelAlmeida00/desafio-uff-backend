import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/app.errors'

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
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