import { Router } from 'express'
import { validate } from '../middlewares/validate.middleware'
import { createTaskSchema, updateTaskSchema } from '../utils/schemas/task.schema'
import { TaskController } from '../controllers/task.controller'
import { TaskService } from '../services/task.service'
import { TaskRepository } from '../repositories/task.repository'

const router = Router()

const taskRepository = new TaskRepository()
const taskService = new TaskService(taskRepository)
const taskController = new TaskController(taskService)

router.post('/', validate(createTaskSchema), taskController.create)
router.get('/', taskController.list)
router.put('/:id', validate(updateTaskSchema), taskController.update)
router.delete('/:id', taskController.delete)

export { router as taskRoutes }