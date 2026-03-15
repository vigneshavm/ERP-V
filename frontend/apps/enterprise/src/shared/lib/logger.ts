import * as Sentry from '@sentry/react';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const IS_PROD = typeof process !== 'undefined' ? process.env.NODE_ENV === 'production' : false;

/**
 * Centralized logging utility.
 * In development: Proxies to console.
 * In production: Reports to Sentry (captures errors, adds breadcrumbs for others).
 */
export const logger = {
  info: (message: string, data?: Record<string, unknown>): void => {
    if (IS_PROD) {
      Sentry.addBreadcrumb({
        category: 'log',
        level: 'info' as Sentry.SeverityLevel,
        message,
        data,
      });
    } else {
      console.info(`[INFO] ${message}`, data || '');
    }
  },

  warn: (message: string, data?: Record<string, unknown>): void => {
    if (IS_PROD) {
      Sentry.addBreadcrumb({
        category: 'log',
        level: 'warning' as Sentry.SeverityLevel,
        message,
        data,
      });
    } else {
      logger.warn(`[WARN] ${message}`, data || '');
    }
  },

  error: (message: string | Error, data?: Record<string, unknown>): void => {
    if (IS_PROD) {
      if (message instanceof Error) {
        Sentry.captureException(message, { extra: data });
      } else {
        Sentry.captureMessage(message, {
          level: 'error' as Sentry.SeverityLevel,
          extra: data,
        });
      }
    } else {
      logger.error(`[ERROR] ${message}`, data || '');
    }
  },

  debug: (message: string, data?: Record<string, unknown>): void => {
    if (!IS_PROD) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  },
};

export default logger;
