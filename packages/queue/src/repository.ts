// packages/queue/src/repository.ts
import { PrismaClient } from '@queue/db';

export interface CreateJobInput {
  id: string;
  type: string;
  queue: string;
  payload: unknown;
  priority?: number;
  maxAttempts?: number;
  runAt?: Date;
  timeoutMs?: number;
  idempotencyKey?: string;
  tenantId?: string;
}

export class QueueRepository {
  constructor(private readonly prisma: PrismaClient) {}

    /**
   * Inserts a brand new job into the PostgreSQL database.
   */
  async create(input: CreateJobInput) {
    return this.prisma.job.create({
      data: {
        id: input.id,
        type: input.type,
        queue: input.queue,
        payload: input.payload as any, // JSONB requires casting
        priority: input.priority ?? 5,
        maxAttempts: input.maxAttempts ?? 3,
        runAt: input.runAt ?? new Date(),
        timeoutMs: input.timeoutMs ?? 30_000,
        idempotencyKey: input.idempotencyKey ?? null, // Fix: undefined -> null
        tenantId: input.tenantId ?? null,             // Fix: undefined -> null
        status: 'pending',
      },
    });
  }

  /**
   * Finds a job by its ID.
   */
  async findById(id: string) {
    return this.prisma.job.findUnique({ where: { id } });
  }

  /**
   * Checks if a job with this idempotency key already exists.
   */
  async findByIdempotencyKey(tenantId: string, idempotencyKey: string) {
    return this.prisma.job.findUnique({
      where: {
        uniq_idem: { tenantId, idempotencyKey },
      },
    });
  }

  /**
   * When a worker pulls a job, we mark it as 'active' and record who locked it.
   */
  async markActive(id: string, workerId: string, lockedAt: Date) {
    return this.prisma.job.update({
      where: { id },
      data: {
        status: 'active',
        lockedAt,
        lockedBy: workerId,
        attempts: { increment: 1 }, // Increment the attempt counter
      },
    });
  }

  /**
   * When a worker finishes successfully, mark it as 'completed'.
   */
  async markCompleted(id: string, completedAt: Date) {
    return this.prisma.job.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt,
        lockedAt: null,
        lockedBy: null,
      },
    });
  }

  /**
   * If a job fails but has retries left, we reset it to 'pending' and set a new runAt time.
   */
  async rescheduleForRetry(id: string, runAt: Date) {
    return this.prisma.job.update({
      where: { id },
      data: {
        status: 'pending',
        runAt,
        lockedAt: null,
        lockedBy: null,
      },
    });
  }

  /**
   * If a job exhausts all retries, move it to the Dead Letter Queue (DLQ).
   */
  async moveToDlq(id: string) {
    return this.prisma.job.update({
      where: { id },
      data: {
        status: 'dlq',
        lockedAt: null,
        lockedBy: null,
      },
    });
  }

  /**
   * Cancels a job, but ONLY if it hasn't started running yet.
   */
  async cancel(id: string) {
    const result = await this.prisma.job.updateMany({
      where: { id, status: 'pending' },
      data: { status: 'cancelled' },
    });
    return result.count > 0;
  }

  /**
   * Finds jobs that crashed mid-execution (worker died) and need to be recovered.
   */
  async findStalled(leaseMs: number, limit = 100) {
    const cutoff = new Date(Date.now() - leaseMs);
    return this.prisma.job.findMany({
      where: {
        status: 'active',
        lockedAt: { lt: cutoff },
      },
      take: limit,
    });
  }

    /**
   * Logs every attempt a worker makes. This is crucial for debugging failures.
   */
  async recordAttempt(input: {
    jobId: string;
    attempt: number;
    startedAt: Date;
    finishedAt?: Date;
    status: 'success' | 'failed' | 'timeout';
    error?: string;
    workerId: string;
  }) {
    await this.prisma.jobAttempt.create({
      data: {
        jobId: input.jobId,
        attempt: input.attempt,
        startedAt: input.startedAt,
        finishedAt: input.finishedAt ?? null, // Fix: undefined -> null
        status: input.status,
        error: input.error ?? null,           // Fix: undefined -> null
        workerId: input.workerId,
      },
    });
  }
}