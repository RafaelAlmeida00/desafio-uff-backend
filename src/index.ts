import './utils/config/telemetry' // Deve ser a primeira importação
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './utils/config/env'
import { router } from './routes'
import { errorMiddleware } from './middlewares/error.middleware'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './utils/config/swagger'
import { pinoHttp } from 'pino-http'
import { logger } from './utils/config/logger'

const app = express()

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(pinoHttp({ logger} ))

app.use(express.json())
app.use(helmet())
app.disable('x-powered-by')

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

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

console.log(`[Startup] Iniciando servidor... NODE_ENV=${process.env.NODE_ENV}`)

if (require.main === module || process.env.NODE_ENV !== 'test') {
  const port = env.PORT || 3000
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`)
  })
}

export { app }