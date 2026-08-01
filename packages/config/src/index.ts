// packages/config/src/index.ts
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  
  API_PORT: z.coerce.number().int().positive().default(3000),
  API_HOST: z.string().default('0.0.0.0'),
  
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(4),
  WORKER_LEASE_MS: z.coerce.number().int().positive().default(30_000),
  WORKER_HEARTBEAT_MS: z.coerce.number().int().positive().default(10_000),
  
  SCHEDULER_INTERVAL_MS: z.coerce.number().int().positive().default(1000),
});

export type Config = z.infer<typeof schema>;

let cached: Config | null = null;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  if (cached) return cached;
  
  const result = schema.safeParse(env);
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  
  cached = result.data;
  return cached;
}