import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { AppError } from '../utils/errors/app.errors'
import { logger } from '../utils/config/logger'

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = result.error.issues.map(e => e.message)
      logger.warn(
        { method: req.method, path: req.originalUrl, ip: req.ip, errorCount: errors.length },
        'Validação de dados falhou',
      )
      throw new AppError('Dados inválidos', 400, errors)
    }
    req.body = result.data
    next()
  }
}
