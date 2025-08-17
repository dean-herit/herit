import { env } from "@/lib/env";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = env.NODE_ENV === "development";
  private isProduction = env.NODE_ENV === "production";

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
      environment: env.NODE_ENV,
    };

    if (this.isDevelopment) {
      // Pretty print in development
      return `[${timestamp}] ${level.toUpperCase()}: ${message} ${context ? JSON.stringify(context, null, 2) : ""}`;
    }

    // JSON format for production (easier to parse by log aggregators)
    return JSON.stringify(logEntry);
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case "debug":
        if (this.isDevelopment) {
          console.debug(formattedMessage);
        }
        break;
      case "info":
        console.log(formattedMessage);
        break;
      case "warn":
        console.warn(formattedMessage);
        break;
      case "error":
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = { ...context };

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      errorContext.error = error;
    }

    this.log("error", message, errorContext);
  }

  // Log API requests
  logRequest(request: Request, context?: LogContext): void {
    const url = new URL(request.url);

    this.info("API Request", {
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      headers: this.isDevelopment
        ? Object.fromEntries(request.headers.entries())
        : undefined,
      ...context,
    });
  }

  // Log API responses
  logResponse(status: number, duration: number, context?: LogContext): void {
    const level: LogLevel =
      status >= 500 ? "error" : status >= 400 ? "warn" : "info";

    this.log(level, "API Response", {
      status,
      duration: `${duration}ms`,
      ...context,
    });
  }

  // Log database queries (development only by default)
  logQuery(query: string, params?: any[], duration?: number): void {
    if (this.isDevelopment) {
      this.debug("Database Query", {
        query: query.substring(0, 500), // Truncate long queries
        params,
        duration: duration ? `${duration}ms` : undefined,
      });
    }
  }

  // Log authentication events
  logAuth(event: string, userId?: string, context?: LogContext): void {
    this.info(`Auth: ${event}`, {
      userId,
      ...context,
    });
  }

  // Log security events (always log these)
  logSecurity(event: string, context?: LogContext): void {
    this.warn(`Security: ${event}`, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export middleware for Next.js API routes
export function withLogging<T extends (...args: any[]) => any>(
  handler: T,
  handlerName?: string,
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    const [request] = args as [Request];

    // Log incoming request
    logger.logRequest(request, { handler: handlerName });

    try {
      const result = await handler(...args);

      // Log successful response
      const duration = Date.now() - startTime;

      if (result && typeof result === "object" && "status" in result) {
        logger.logResponse(result.status, duration, { handler: handlerName });
      }

      return result;
    } catch (error) {
      // Log error
      const duration = Date.now() - startTime;

      logger.error(`Handler error: ${handlerName || "unknown"}`, error, {
        duration: `${duration}ms`,
      });
      throw error;
    }
  }) as T;
}
