import { z } from 'zod'

export const signupSchema = z.object({
  nome: z.string()
    .min(2, 'O campo \'nome\' deve ter no mínimo 2 caracteres')
    .max(100, 'O campo \'nome\' deve ter no máximo 100 caracteres'),
  email: z.string()
    .email('O campo \'email\' deve ser um endereço de e-mail válido')
    .transform(val => val.toLowerCase()),
  senha: z.string()
    .min(8, 'O campo \'senha\' deve ter no mínimo 8 caracteres'),
})

export const loginSchema = z.object({
  email: z.string()
    .email('O campo \'email\' deve ser um endereço de e-mail válido')
    .transform(val => val.toLowerCase()),
  senha: z.string()
    .min(1, 'O campo \'senha\' é obrigatório'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>