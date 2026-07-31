import { setTimeout as wait } from 'node:timers/promises';
import { exponentialBackoff } from './backoff.js';

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_OPTS: RetryOptions = {
  maxAttempts: 5,
  baseDelayMs: 100,
  maxDelayMs: 5000,
};

export async function withRetry<T>(
  op: () => Promise<T>,
  opts: Partial<RetryOptions> = {}
): Promise<T> {
  const options = { ...DEFAULT_RETRY_OPTS, ...opts };
  let attempt = 0;
  let lastErr: unknown;

  while (attempt < options.maxAttempts) {
    try {
      return await op();
    } catch (err) {
      lastErr = err;
      attempt++;
      
      if (attempt >= options.maxAttempts) {
        break;
      }
      
      const delay = exponentialBackoff(attempt, {
        baseMs: options.baseDelayMs,
        maxMs: options.maxDelayMs,
        jitter: true,
      });
      
      await wait(delay);
    }
  }
  
  throw lastErr;
}