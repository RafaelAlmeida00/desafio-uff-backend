import build from 'pino-abstract-transport';
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

interface PinoLog {
  level: number;
  msg?: string;
  [key: string]: unknown;
}

export default function () {
  return build(async (source) => {
    const safeSource = source as AsyncIterable<unknown>;

    for await (const obj of safeSource) {
      const logEntry = obj as PinoLog;
      
      const { level, msg, ...metadata } = logEntry;
      const levelStr = pinoLevelToString(level);

      await prisma.log.create({
        data: {
          level: levelStr,
          message: msg || '',
          metadata: metadata  as Prisma.InputJsonValue
        },
      });
    }
  });
}

function pinoLevelToString(level: number): string {
  if (level === 10) return 'trace';
  if (level === 20) return 'debug';
  if (level === 30) return 'info';
  if (level === 40) return 'warn';
  if (level === 50) return 'error';
  if (level === 60) return 'fatal';
  return 'user';
}