import rateLimit from 'express-rate-limit'
import { AppError } from '../utils/errors/app.errors'
import { type Request, type Response, type NextFunction, type RequestHandler } from 'express'
import { logger } from '../utils/config/logger'

export const authLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (
    _req: Request,
    _res: Response,
    next: NextFunction,
    _options: unknown,
  ) => {
    logger.warn({ req: _req},'Muitas tentativas de requisição, bloqueando acesso temporariamente')
    next(
      new AppError(
        'Muitas tentativas de requisição, tente novamente mais tarde.',
        429,
      ),
    )
  },
}) as RequestHandler
