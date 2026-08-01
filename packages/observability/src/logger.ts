import pino, { LoggerOptions } from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const baseOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'job-queue' },
  timestamp: pino.stdTimeFunctions.isoTime,
};

if (!isProduction) {
  // Only add the pretty transport in development
  baseOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    },
  };
}

export const logger = pino(baseOptions);

export function childLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}