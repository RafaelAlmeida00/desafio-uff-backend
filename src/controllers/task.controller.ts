import { Request, Response, NextFunction } from 'express'
import { TaskService } from '../services/task.service'
import { AppError } from '../utils/errors/app.errors'
import { taskLinks, taskItemLinks, taskListLinks } from '../utils/helpers/hateoas'

export class TaskController {
  constructor(private taskService: TaskService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as { titulo?: string; descricao?: string }
      const { titulo, descricao } = body
      if (!titulo || typeof titulo !== 'string') {
        throw new AppError('Título é obrigatório e deve ser um texto!', 400)
      }
      const descricaoTyped = typeof descricao === 'string' ? descricao : undefined
      const task = await this.taskService.create(req.userId!, { titulo, descricao: descricaoTyped })
      res.status(201).json({
        data: task,
        _links: taskLinks(task.id),
      })
    } catch (error) {
      next(error)
    }
  }

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string | undefined
      const tasks = await this.taskService.listByUser(req.userId!, status)

      const tasksWithLinks = tasks.map(task => ({
        ...task,
        _links: taskItemLinks(task.id),
      }))

      res.status(200).json({
        data: tasksWithLinks,
        _links: taskListLinks(),
      })
    } catch (error) {
      next(error)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taskId = Number(req.params.id)
      if (isNaN(taskId)) {
        throw new AppError('ID inválido', 400)
      }

      const body = req.body as { titulo?: string; descricao?: string; status?: 'pendente' | 'concluida' }
      const task = await this.taskService.update(req.userId!, taskId, body)
      res.status(200).json({
        data: task,
        _links: taskLinks(task.id),
      })
    } catch (error) {
      next(error)
    }
  }

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taskId = Number(req.params.id)
      if (isNaN(taskId)) {
        throw new AppError('ID inválido', 400)
      }

      await this.taskService.delete(req.userId!, taskId)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}