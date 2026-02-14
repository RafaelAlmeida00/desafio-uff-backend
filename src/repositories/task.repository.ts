import { prisma } from '../utils/lib/prisma'
import { CreateTaskInput, UpdateTaskInput } from '../utils/schemas/task.schema'

export class TaskRepository {
  async create(userId: number, data: CreateTaskInput) {
    return prisma.task.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        status: 'pendente',
        userId,
      },
    })
  }

  async findAllByUserId(userId: number, status?: string) {
    return prisma.task.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByIdAndUser(taskId: number, userId: number) {
    return prisma.task.findFirst({
      where: { id: taskId, userId },
    })
  }

  async update(taskId: number, data: UpdateTaskInput) {
    return prisma.task.update({
      where: { id: taskId },
      data,
    })
  }

  async delete(taskId: number) {
    return prisma.task.delete({
      where: { id: taskId },
    })
  }
}