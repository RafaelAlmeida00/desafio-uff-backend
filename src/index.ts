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
import cookieParser from 'cookie-parser'

const app = express()

const localhostOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/

const isAllowedOrigin = (origin?: string) => {
  if (!origin) {
    return true
  }

  if (env.CORS_ORIGINS.length > 0) {
    return env.CORS_ORIGINS.includes(origin)
  }

  if (env.NODE_ENV === 'production') {
    return false
  }

  return localhostOriginRegex.test(origin)
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Origem não permitida pelo CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  }),
)

app.use(cookieParser())

app.use(pinoHttp({ logger} ))

app.use(express.json())
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

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
