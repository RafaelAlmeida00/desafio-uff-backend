import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './utils/config/env'
import { router } from './routes'
import { errorMiddleware } from './middlewares/error.middleware'

const app = express()

app.use(express.json())
app.use(cors())
app.use(helmet())
app.disable('x-powered-by')

app.get('/health', (_req, res) => {
  const healthCheckStatus = {
    status: 'up',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }
  res.status(200).json(healthCheckStatus)
})

app.use(router)

app.use(errorMiddleware)

app.listen(env.PORT, () => {
  console.log(`Servidor rodando na porta ${env.PORT}`)
})