import 'dotenv/config'

if (!process.env.DATABASE_URL) {
  throw new Error('Variável de ambiente DATABASE_URL é obrigatória')
}
if (!process.env.JWT_SECRET) {
  throw new Error('Variável de ambiente JWT_SECRET é obrigatória')
}

export const env = {
  PORT: Number(process.env.PORT),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: Number(process.env.JWT_EXPIRES_IN) || 604800,
  NODE_ENV: process.env.NODE_ENV,
}