export type Brand<T, B extends string> = T & { readonly __brand: B };

export type JobId = Brand<string, 'JobId'>;
export type WorkerId = Brand<string, 'WorkerId'>;
export type TenantId = Brand<string, 'TenantId'>;

export interface JobPayload {
  [key: string]: unknown;
}

export type JobStatus = 'pending' | 'active' | 'completed' | 'failed' | 'dlq' | 'cancelled';

export interface Job {
  id: JobId;
  type: string;
  queue: string;
  payload: JobPayload;
  status: JobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  runAt: Date;
  lockedAt: Date | null;
  lockedBy: WorkerId | null;
  timeoutMs: number;
  idempotencyKey: string | null;
  tenantId: TenantId | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}