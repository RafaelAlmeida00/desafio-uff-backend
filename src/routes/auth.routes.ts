import { Router } from 'express'
import { validate } from '../middlewares/validate.middleware'
import { signupSchema, loginSchema } from '../utils/schemas/auth.schema'
import { AuthController } from '../controllers/auth.controller'
import { AuthService } from '../services/auth.service'
import { UserRepository } from '../repositories/user.repository'
import { authLimiter } from '../middlewares/rate-limit.middleware'
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

const userRepository = new UserRepository()
const authService = new AuthService(userRepository)
const authController = new AuthController(authService, userRepository)

const authMiddlewares =
  process.env.NODE_ENV !== 'test'
    ? [authLimiter, idempotencyMiddleware]
    : []

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
  ...authMiddlewares,
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
  ...authMiddlewares,
  validate(loginSchema),
  (req, res, next) => authController.login(req, res, next),
)

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Encerra a sessão do usuário (limpa o cookie)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 */
router.post(
  '/logout',
  (req, res, next) => authController.logout(req, res, next)
)

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Retorna os dados do usuário autenticado baseado no cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Dados do usuário retornados com sucesso
 *       401:
 *         description: Não autorizado (Cookie ausente ou inválido)
 */
router.get(
  '/me',
  authMiddleware,
  (req, res, next) => authController.me(req, res, next)
)

export { router as authRoutes }