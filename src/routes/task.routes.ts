import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate.middleware'
import { createTaskSchema, updateTaskSchema } from '../utils/schemas/task.schema'
import { TaskController } from '../controllers/task.controller'
import { TaskService } from '../services/task.service'
import { TaskRepository } from '../repositories/task.repository'
import { authLimiter } from '../middlewares/rate-limit.middleware'
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware'

const router = Router()

const taskRepository = new TaskRepository()
const taskService = new TaskService(taskRepository)
const taskController = new TaskController(taskService)

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Gerenciamento de tarefas
 */

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Cria uma nova tarefa
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo]
 *             properties:
 *               titulo: { type: string }
 *               descricao: { type: string }
 *     responses:
 *       201: { description: Tarefa criada }
 *       400: { description: Dados inválidos }
 *       401: { description: Não autorizado }
 */
router.post('/', authMiddleware,
    idempotencyMiddleware, validate(createTaskSchema), (req, res, next) => taskController.create(req, res, next))

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Lista tarefas do usuário
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pendente, concluida] }
 *     responses:
 *       200: { description: Lista de tarefas }
 *       401: { description: Não autorizado }
 */
router.get('/', authMiddleware, (req, res, next) => taskController.list(req, res, next))

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Atualiza uma tarefa
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo: { type: string }
 *               descricao: { type: string }
 *               status: { type: string, enum: [pendente, concluida] }
 *     responses:
 *       200: { description: Tarefa atualizada }
 *       404: { description: Tarefa não encontrada }
 */
router.put('/:id', authMiddleware, validate(updateTaskSchema), (req, res, next) => taskController.update(req, res, next))

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Remove uma tarefa
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Tarefa removida }
 *       404: { description: Tarefa não encontrada }
 */
router.delete('/:id', authMiddleware,
    idempotencyMiddleware, (req, res, next) => taskController.delete(req, res, next))

export { router as taskRoutes }