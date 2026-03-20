import { addBreadcrumb } from '@configs/sentry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown> | undefined;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

/** Pretty-print for dev console with colour-coded level. */
function devFormat(entry: LogEntry): [string, string, ...unknown[]] {
  const colors: Record<LogLevel, string> = {
    debug: 'color: gray',
    info: 'color: blue',
    warn: 'color: orange',
    error: 'color: red',
  };

  const style = colors[entry.level];
  const prefix = `%c[${entry.level.toUpperCase()}]`;

  if (entry.context && Object.keys(entry.context).length > 0) {
    return [prefix, style, entry.message, entry.context];
  }
  return [prefix, style, entry.message];
}

/** Structured JSON string for production log aggregation. */
function jsonFormat(entry: LogEntry): string {
  return JSON.stringify(entry);
}

// ---------------------------------------------------------------------------
// Level gating
// ---------------------------------------------------------------------------

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Minimum level defaults: debug in dev, warn in prod. */
const MIN_LEVEL: LogLevel = import.meta.env.DEV ? 'debug' : 'warn';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

// ---------------------------------------------------------------------------
// Sentry breadcrumb bridge
// ---------------------------------------------------------------------------

const SENTRY_LEVEL_MAP: Record<LogLevel, 'debug' | 'info' | 'warning' | 'error'> = {
  debug: 'debug',
  info: 'info',
  warn: 'warning',
  error: 'error',
};

function sendBreadcrumb(entry: LogEntry): void {
  addBreadcrumb(entry.message, 'logger', {
    level: SENTRY_LEVEL_MAP[entry.level],
    ...entry.context,
  });
}

// ---------------------------------------------------------------------------
// Core log function
// ---------------------------------------------------------------------------

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  if (import.meta.env.DEV) {
    // Dev: colour-coded, human-readable output
    const [fmt, style, ...rest] = devFormat(entry);
    // eslint-disable-next-line no-console
    (console[level] as (...args: unknown[]) => void)(fmt, style, ...rest);
  } else {
    // Prod: structured JSON to console (picked up by log aggregators)
    // eslint-disable-next-line no-console
    (console[level] as (...args: unknown[]) => void)(jsonFormat(entry));

    // Also emit a Sentry breadcrumb for warn/error
    if (level === 'warn' || level === 'error') {
      sendBreadcrumb(entry);
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * logger — structured logging utility.
 *
 * Dev mode:  colour-coded, pretty-printed to console (all levels).
 * Prod mode: structured JSON to console + Sentry breadcrumbs for warn/error.
 *
 * @example
 * ```ts
 * import { logger } from '@utils/logger';
 *
 * logger.debug('Cache miss', { key: 'users' });
 * logger.info('User logged in', { userId: '42' });
 * logger.warn('Deprecated API called', { endpoint: '/v1/old' });
 * logger.error('Payment failed', { orderId: '123', code: 'CARD_DECLINED' });
 * ```
 */
export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
} as const;
