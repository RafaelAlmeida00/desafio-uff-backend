import rateLimit, { type Options } from 'express-rate-limit'
import { AppError } from '../utils/errors/app.errors'
import { type Request, type Response, type NextFunction } from 'express'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (
    _req: Request,
    _res: Response,
    next: NextFunction,
    _options: Options,
  ) => {
    next(
      new AppError(
        'Muitas tentativas de requisição, tente novamente mais tarde.',
        429,
      ),
    )
  },
})
