import pino from 'pino';
import { env } from './env';
import { context, trace } from '@opentelemetry/api';
import path from 'path';

const ext = __filename.endsWith('.ts') ? 'ts' : 'js'; 

const targets: pino.TransportTargetOptions[] = [
  {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
      ignore: 'pid,hostname',
    },
    level: 'info',
  },
];

if (env.NODE_ENV !== 'test') {
  targets.push({
    target: path.resolve(__dirname, `../lib/pino.prisma.transport.${ext}`),
    options: {},
    level: 'info',
  });
} else {
  targets.push({
    target: 'pino/file',
    options: { destination: './test.log' },
    level: 'info',
  });
}

const transport = pino.transport({ targets });

export const logger = pino(
  {
    mixin() {
      const span = trace.getSpan(context.active());
      if (!span) return {};
      const { traceId, spanId } = span.spanContext();
      return { traceId, spanId };
    },
  },
  transport
);