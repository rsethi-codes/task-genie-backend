import { logger } from "./logger.js";

export interface AILogContext {
  feature: string;
  provider: string;
  model?: string;
  latencyMs: number;
  success: boolean;
  fallback?: string;
  correlationId: string;
  userId?: string;
  error?: any;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  aiMode?: "TEST" | "PROD";
}

/**
 * AI Provider logging wrapper
 * Provides structured logging for all AI provider interactions
 */
export class AILogger {
  private static instance: AILogger;
  private logger = logger;

  static getInstance(): AILogger {
    if (!AILogger.instance) {
      AILogger.instance = new AILogger();
    }
    return AILogger.instance;
  }

  /**
   * Log AI provider usage with full context
   */
  logUsage(context: AILogContext): void {
    this.logger.logAIUsage(context);
  }

  /**
   * Wrap AI provider calls with automatic logging
   */
  async withLogging<T>(
    operation: () => Promise<T>,
    context: Omit<AILogContext, "latencyMs" | "success" | "error">
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await operation();
      const latencyMs = Date.now() - start;
      
      this.logUsage({
        ...context,
        latencyMs,
        success: true,
      });
      
      return result;
    } catch (error) {
      const latencyMs = Date.now() - start;
      
      this.logUsage({
        ...context,
        latencyMs,
        success: false,
        error,
      });
      
      throw error;
    }
  }

  /**
   * Log AI provider fallback
   */
  logFallback(context: {
    feature: string;
    fromProvider: string;
    toProvider: string;
    reason: string;
    correlationId: string;
    userId?: string;
  }): void {
    this.logger.warn({
      event: "ai.provider.fallback",
      msg: `[AI] ${context.feature} fallback: ${context.fromProvider} → ${context.toProvider} (${context.reason})`,
      correlationId: context.correlationId,
      userId: context.userId,
      ai: {
        feature: context.feature,
        fallback: {
          from: context.fromProvider,
          to: context.toProvider,
          reason: context.reason,
        },
      },
    });
  }

  /**
   * Log AI provider retry
   */
  logRetry(context: {
    feature: string;
    provider: string;
    attempt: number;
    maxAttempts: number;
    reason: string;
    correlationId: string;
    userId?: string;
  }): void {
    this.logger.warn({
      event: "ai.provider.retry",
      msg: `[AI] ${context.feature} retry ${context.attempt}/${context.maxAttempts} with ${context.provider} (${context.reason})`,
      correlationId: context.correlationId,
      userId: context.userId,
      ai: {
        feature: context.feature,
        provider: context.provider,
        retry: {
          attempt: context.attempt,
          maxAttempts: context.maxAttempts,
          reason: context.reason,
        },
      },
    });
  }
}

/**
 * AI operation helpers for common patterns
 */
export const aiOperations = {
  /**
   * Log subtask generation
   */
  subtaskGeneration: (context: {
    provider: string;
    model?: string;
    latencyMs: number;
    success: boolean;
    correlationId: string;
    userId?: string;
    error?: any;
  }) => {
    AILogger.getInstance().logUsage({
      feature: "SubtaskGeneration",
      ...context,
    });
  },

  /**
   * Log persona analysis
   */
  personaAnalysis: (context: {
    provider: string;
    model?: string;
    latencyMs: number;
    success: boolean;
    correlationId: string;
    userId?: string;
    error?: any;
  }) => {
    AILogger.getInstance().logUsage({
      feature: "PersonaAnalysis",
      ...context,
    });
  },

  /**
   * Log task breakdown
   */
  taskBreakdown: (context: {
    provider: string;
    model?: string;
    latencyMs: number;
    success: boolean;
    correlationId: string;
    userId?: string;
    error?: any;
  }) => {
    AILogger.getInstance().logUsage({
      feature: "TaskBreakdown",
      ...context,
    });
  },

  /**
   * Log questionnaire processing
   */
  questionnaireProcessing: (context: {
    provider: string;
    model?: string;
    latencyMs: number;
    success: boolean;
    correlationId: string;
    userId?: string;
    error?: any;
  }) => {
    AILogger.getInstance().logUsage({
      feature: "QuestionnaireProcessing",
      ...context,
    });
  },

  /**
   * Log AI provider selection
   */
  providerSelection: (context: {
    feature: string;
    selectedProvider: string;
    rejectedProviders: string[];
    reason: string;
    correlationId: string;
    userId?: string;
  }) => {
    logger.debug({
      event: "ai.provider.selected",
      msg: `[AI] ${context.feature} selected ${context.selectedProvider} (rejected: ${context.rejectedProviders.join(", ")}) - ${context.reason}`,
      correlationId: context.correlationId,
      userId: context.userId,
      ai: {
        feature: context.feature,
        provider: context.selectedProvider,
        selection: {
          rejected: context.rejectedProviders,
          reason: context.reason,
        },
      },
    });
  },

  /**
   * Log AI mode switch
   */
  modeSwitch: (context: {
    feature: string;
    fromMode: "TEST" | "PROD";
    toMode: "TEST" | "PROD";
    reason: string;
    correlationId: string;
    userId?: string;
  }) => {
    logger.info({
      event: "ai.mode.switched",
      msg: `[AI] ${context.feature} mode: ${context.fromMode} → ${context.toMode} (${context.reason})`,
      correlationId: context.correlationId,
      userId: context.userId,
      ai: {
        feature: context.feature,
        mode: {
          from: context.fromMode,
          to: context.toMode,
          reason: context.reason,
        },
      },
    });
  },
};

/**
 * Decorator for automatic AI operation logging
 */
export function logAIOperation(feature: string, defaultProvider: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const correlationId = args[0]?.correlationId || "unknown";
      const userId = args[0]?.userId;

      const aiLogger = AILogger.getInstance();
      
      return aiLogger.withLogging(
        () => method.apply(this, args),
        {
          feature,
          provider: defaultProvider,
          correlationId,
          userId,
          aiMode: process.env.AI_MODE as "TEST" | "PROD" || "PROD",
        }
      );
    };

    return descriptor;
  };
}
