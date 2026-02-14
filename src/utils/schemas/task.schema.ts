import { z } from 'zod'

export const createTaskSchema = z.object({
  titulo: z.string()
    .min(1, 'O campo \'titulo\' é obrigatório')
    .max(200, 'O campo \'titulo\' deve ter no máximo 200 caracteres'),
  descricao: z.string()
    .max(1000, 'O campo \'descricao\' deve ter no máximo 1000 caracteres')
    .nullable()
    .optional(),
})

export const updateTaskSchema = z.object({
  titulo: z.string()
    .min(1, 'O campo \'titulo\' não pode ser vazio')
    .max(200, 'O campo \'titulo\' deve ter no máximo 200 caracteres')
    .optional(),
  descricao: z.string()
    .max(1000, 'O campo \'descricao\' deve ter no máximo 1000 caracteres')
    .nullable()
    .optional(),
  status: z.enum(['pendente', 'concluida'], { message: 'O campo \'status\' deve ser \'pendente\' ou \'concluida\'' }).optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>