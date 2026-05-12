type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  userId?: number | null;
  stack?: string;
}

// Get userId from window if available (set by useAuth)
const getUserId = (): number | null => {
  if (typeof window !== "undefined" && (window as any).__authUserId) {
    return (window as any).__authUserId;
  }
  return null;
};

// Format log entry as JSON
const formatLogEntry = (entry: LogEntry): string => {
  return JSON.stringify(entry, null, 0);
};

// Get current timestamp in ISO format
const getTimestamp = (): string => {
  return new Date().toISOString();
};

// Extract stack trace from error
const getStackTrace = (error: Error | unknown): string | undefined => {
  if (error instanceof Error && error.stack) {
    return error.stack;
  }
  return undefined;
};

class StructuredLogger {
  debug(message: string, context?: LogContext): void {
    const entry: LogEntry = {
      timestamp: getTimestamp(),
      level: "debug",
      message,
      context,
      userId: getUserId() || undefined,
    };

    console.debug(formatLogEntry(entry));
  }

  info(message: string, context?: LogContext): void {
    const entry: LogEntry = {
      timestamp: getTimestamp(),
      level: "info",
      message,
      context,
      userId: getUserId() || undefined,
    };

    console.info(formatLogEntry(entry));
  }

  warn(message: string, context?: LogContext): void {
    const entry: LogEntry = {
      timestamp: getTimestamp(),
      level: "warn",
      message,
      context,
      userId: getUserId() || undefined,
    };

    console.warn(formatLogEntry(entry));
  }

  error(message: string, context?: LogContext | Error): void {
    let contextObj: LogContext | undefined;
    let stack: string | undefined;

    // Handle both LogContext and Error objects
    if (context instanceof Error) {
      stack = getStackTrace(context);
      contextObj = {
        error: context.message,
      };
    } else {
      contextObj = context;
      // If context has an error property that's an Error, extract its stack
      if (context && context.error instanceof Error) {
        stack = getStackTrace(context.error);
      }
    }

    const entry: LogEntry = {
      timestamp: getTimestamp(),
      level: "error",
      message,
      context: contextObj,
      userId: getUserId() || undefined,
      stack,
    };

    console.error(formatLogEntry(entry));
  }
}

// Export singleton instance
export const structuredLogger = new StructuredLogger();