import { TaskRepository } from '../repositories/task.repository'
import { logger } from '../utils/config/logger'
import { AppError } from '../utils/errors/app.errors'
import { CreateTaskInput, UpdateTaskInput } from '../utils/schemas/task.schema'

export class TaskService {
  constructor(private taskRepository: TaskRepository) {}

  async create(userId: number, data: CreateTaskInput) {
    return this.taskRepository.create(userId, data)
  }

  async listByUser(userId: number, status?: string) {
    return this.taskRepository.findAllByUserId(userId, status)
  }

  async update(userId: number, taskId: number, data: UpdateTaskInput) {
    const task = await this.taskRepository.findByIdAndUser(taskId, userId)
    if (!task) {
      logger.warn({ userId, taskId }, 'Tentativa de atualização de tarefa que não pertence ao usuário')
      throw new AppError('Tarefa não encontrada', 404)
    }
    return this.taskRepository.update(taskId, data)
  }

  async delete(userId: number, taskId: number) {
    const task = await this.taskRepository.findByIdAndUser(taskId, userId)
    if (!task) {
      logger.warn({ userId, taskId }, 'Tentativa de exclusão de tarefa que não pertence ao usuário')
      throw new AppError('Tarefa não encontrada', 404)
    }
    return this.taskRepository.delete(taskId)
  }
}