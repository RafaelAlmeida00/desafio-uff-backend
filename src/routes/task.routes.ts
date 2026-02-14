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

router.post('/', authMiddleware, authLimiter,
    idempotencyMiddleware, validate(createTaskSchema), taskController.create)
router.get('/', authMiddleware, authLimiter,
    idempotencyMiddleware, taskController.list)
router.put('/:id', authMiddleware, authLimiter,
    idempotencyMiddleware, validate(updateTaskSchema), taskController.update)
router.delete('/:id', authMiddleware, authLimiter,
    idempotencyMiddleware, taskController.delete)

export { router as taskRoutes }