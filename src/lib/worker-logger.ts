import { v4 as uuidv4 } from "uuid";
import { logger } from "./logger.js";

export interface WorkerLogContext {
  worker: string;
  action: "started" | "claimed" | "completed" | "failed";
  jobId?: string;
  durationMs?: number;
  correlationId: string;
  error?: any;
  jobType?: string;
  jobData?: any;
}

/**
 * Worker and background job logging wrapper
 * Provides structured logging for async operations outside HTTP context
 */
export class WorkerLogger {
  private static instance: WorkerLogger;
  private logger = logger;

  static getInstance(): WorkerLogger {
    if (!WorkerLogger.instance) {
      WorkerLogger.instance = new WorkerLogger();
    }
    return WorkerLogger.instance;
  }

  /**
   * Generate a correlation ID for worker operations
   */
  generateCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Create a worker-specific logger with correlation context
   */
  createWorkerLogger(workerName: string, jobId?: string): ReturnType<typeof logger.child> {
    const correlationId = this.generateCorrelationId();
    
    return this.logger.child({
      correlationId,
      worker: {
        name: workerName,
        jobId,
      },
    });
  }

  /**
   * Log worker lifecycle events
   */
  logWorkerEvent(context: WorkerLogContext): void {
    this.logger.logWorker(context);
  }

  /**
   * Wrap worker operations with automatic logging
   */
  async withLogging<T>(
    operation: () => Promise<T>,
    context: Omit<WorkerLogContext, "durationMs" | "error" | "action">
  ): Promise<T> {
    const start = Date.now();
    const correlationId = context.correlationId || this.generateCorrelationId();
    
    // Log operation start
    this.logWorkerEvent({
      ...context,
      correlationId,
      action: "started",
    });
    
    try {
      const result = await operation();
      const durationMs = Date.now() - start;
      
      // Log successful completion
      this.logWorkerEvent({
        ...context,
        correlationId,
        durationMs,
        action: "completed",
      });
      
      return result;
    } catch (error) {
      const durationMs = Date.now() - start;
      
      // Log failure
      this.logWorkerEvent({
        ...context,
        correlationId,
        durationMs,
        error,
        action: "failed",
      });
      
      throw error;
    }
  }

  /**
   * Log job claiming
   */
  logJobClaimed(context: {
    worker: string;
    jobId: string;
    jobType: string;
    jobData?: any;
  }): void {
    const correlationId = this.generateCorrelationId();
    
    this.logWorkerEvent({
      worker: context.worker,
      action: "claimed",
      jobId: context.jobId,
      correlationId,
      jobType: context.jobType,
      jobData: context.jobData,
    });
  }

  /**
   * Log worker startup/shutdown
   */
  logWorkerLifecycle(context: {
    worker: string;
    action: "startup" | "shutdown" | "restart";
    reason?: string;
  }): void {
    const correlationId = this.generateCorrelationId();
    
    this.logger.info({
      event: "worker.lifecycle",
      msg: `[WORKER] ${context.worker} ${context.action}${context.reason ? ` (${context.reason})` : ""}`,
      correlationId,
      worker: {
        name: context.worker,
        lifecycle: context.action,
        reason: context.reason,
      },
    });
  }

  /**
   * Log queue health metrics
   */
  logQueueHealth(context: {
    queueName: string;
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    workerId?: string;
  }): void {
    const correlationId = this.generateCorrelationId();
    
    this.logger.debug({
      event: "queue.health",
      msg: `[QUEUE] ${context.queueName}: ${context.active} active, ${context.waiting} waiting, ${context.completed} completed, ${context.failed} failed`,
      correlationId,
      queue: {
        name: context.queueName,
        metrics: {
          active: context.active,
          waiting: context.waiting,
          completed: context.completed,
          failed: context.failed,
        },
        workerId: context.workerId,
      },
    });
  }
}

/**
 * Worker operation helpers for common patterns
 */
export const workerOperations = {
  /**
   * Log task generation worker
   */
  taskGeneration: (context: {
    action: "started" | "claimed" | "completed" | "failed";
    jobId?: string;
    durationMs?: number;
    correlationId: string;
    error?: any;
  }) => {
    WorkerLogger.getInstance().logWorkerEvent({
      worker: "task-generation",
      ...context,
    });
  },

  /**
   * Log reminder worker
   */
  reminderWorker: (context: {
    action: "started" | "claimed" | "completed" | "failed";
    jobId?: string;
    durationMs?: number;
    correlationId: string;
    error?: any;
  }) => {
    WorkerLogger.getInstance().logWorkerEvent({
      worker: "reminder",
      ...context,
    });
  },

  /**
   * Log cleanup worker
   */
  cleanupWorker: (context: {
    action: "started" | "claimed" | "completed" | "failed";
    jobId?: string;
    durationMs?: number;
    correlationId: string;
    error?: any;
  }) => {
    WorkerLogger.getInstance().logWorkerEvent({
      worker: "cleanup",
      ...context,
    });
  },

  /**
   * Log notification worker
   */
  notificationWorker: (context: {
    action: "started" | "claimed" | "completed" | "failed";
    jobId?: string;
    durationMs?: number;
    correlationId: string;
    error?: any;
  }) => {
    WorkerLogger.getInstance().logWorkerEvent({
      worker: "notification",
      ...context,
    });
  },
};

/**
 * Decorator for automatic worker operation logging
 */
export function logWorkerOperation(workerName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const workerLogger = WorkerLogger.getInstance();
      const jobId = args[0]?.id || args[0]?.jobId;
      const correlationId = workerLogger.generateCorrelationId();
      
      return workerLogger.withLogging(
        () => method.apply(this, args),
        {
          worker: workerName,
          jobId,
          correlationId,
        }
      );
    };

    return descriptor;
  };
}

/**
 * Utility to create a worker logger instance
 */
export const createWorkerLogger = (workerName: string, jobId?: string) => {
  return WorkerLogger.getInstance().createWorkerLogger(workerName, jobId);
};
