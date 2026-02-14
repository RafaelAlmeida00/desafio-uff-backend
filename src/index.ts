import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './utils/config/env'
import { router } from './routes'
import { errorMiddleware } from './middlewares/error.middleware'
import { idempotencyMiddleware } from './middlewares/idempotency.middleware'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './utils/config/swagger'

const app = express()

app.use(express.json())
app.use(idempotencyMiddleware)
app.use(cors())
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

if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log(`Servidor rodando na porta ${env.PORT}`)
  })
}

export { app }