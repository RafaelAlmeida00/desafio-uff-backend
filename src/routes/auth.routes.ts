import { Router } from 'express'
import { validate } from '../middlewares/validate.middleware'
import { signupSchema, loginSchema } from '../utils/schemas/auth.schema'
import { AuthController } from '../controllers/auth.controller'
import { AuthService } from '../services/auth.service'
import { UserRepository } from '../repositories/user.repository'
import { authLimiter } from '../middlewares/rate-limit.middleware'
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware'

const router = Router()

const userRepository = new UserRepository()
const authService = new AuthService(userRepository)
const authController = new AuthController(authService)

router.post(
  '/signup',
  authLimiter,
  idempotencyMiddleware,
  validate(signupSchema),
  authController.signup,
)
router.post(
  '/login',
  authLimiter,
  idempotencyMiddleware,
  validate(loginSchema),
  authController.login,
)

export { router as authRoutes }