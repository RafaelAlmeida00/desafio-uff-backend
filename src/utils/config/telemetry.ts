import * as Uptrace from '@uptrace/node'
import { env } from './env'

if (process.env.UPTRACE_DSN && env.NODE_ENV !== 'test') {
  Uptrace.configureOpentelemetry({
    dsn: process.env.UPTRACE_DSN,

    serviceName: 'todo-backend',
    serviceVersion: '1.0.0',

    deploymentEnvironment: env.NODE_ENV,
  })

}

export const telemetry = {}