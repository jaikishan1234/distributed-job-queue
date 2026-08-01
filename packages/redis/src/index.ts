import Redis, { type RedisOptions } from 'ioredis';
import { loadConfig } from '@queue/config';

// 1. Load the configuration
const config = loadConfig();

// 2. Setup connection options
const redisOptions: RedisOptions = {
  host: new URL(config.REDIS_URL).hostname,
  port: parseInt(new URL(config.REDIS_URL).port, 10),
  maxRetriesPerRequest: null, // Important for Node.js/Redis stability
  enableReadyCheck: true,
};

// 3. Create a singleton client
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? new Redis(redisOptions);

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// 4. The Key Builder
export const QueueKeys = {
  ready: (queue: string) => `q:${queue}:ready`,
  delayed: (queue: string) => `q:${queue}:delayed`,
  active: (queue: string) => `q:${queue}:active`,
  dlq: (queue: string) => `q:${queue}:dlq`,
  priority: (queue: string, priority: number) => `q:${queue}:ready:p${priority}`,
};