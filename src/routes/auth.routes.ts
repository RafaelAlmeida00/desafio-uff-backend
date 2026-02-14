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

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Cadastra um novo usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, email, senha]
 *             properties:
 *               nome: { type: string }
 *               email: { type: string, format: email }
 *               senha: { type: string, minLength: 8 }
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: E-mail já cadastrado
 */
router.post(
  '/signup',
  authLimiter,
  idempotencyMiddleware,
  validate(signupSchema),
  (req, res, next) => authController.signup(req, res, next),
)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autentica um usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, senha]
 *             properties:
 *               email: { type: string, format: email }
 *               senha: { type: string }
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
router.post(
  '/login',
  authLimiter,
  idempotencyMiddleware,
  validate(loginSchema),
  (req, res, next) => authController.login(req, res, next),
)

export { router as authRoutes }