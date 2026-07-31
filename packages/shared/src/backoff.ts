export interface BackoffOptions {
  baseMs: number;
  maxMs: number;
  factor?: number;
  jitter?: boolean;
}

const DEFAULT_OPTS: BackoffOptions = {
  baseMs: 1000,
  maxMs: 300_000,
  factor: 2,
  jitter: true,
};

export function exponentialBackoff(attempt: number, options: Partial<BackoffOptions> = {}): number {
  const opts = { ...DEFAULT_OPTS, ...options };
  const exponential = opts.baseMs * (opts.factor ?? 2) ** attempt;
  const capped = Math.min(opts.maxMs, exponential);
  
  if (opts.jitter) {
    return Math.floor(capped * (0.5 + Math.random()));
  }
  
  return capped;
}