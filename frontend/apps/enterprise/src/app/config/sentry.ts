import { logger } from '@/shared/lib/logger';
import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for React error tracking
 * Only active if VITE_SENTRY_DSN is configured
 */
export const initSentry = (): void => {
    const sentryDsn = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.VITE_SENTRY_DSN : null;

    if (!sentryDsn || sentryDsn.trim() === "") {
        logger.info("⚠️  Sentry not configured (VITE_SENTRY_DSN not set)");
        return;
    }

    Sentry.init({
        dsn: sentryDsn,
        environment: (typeof process !== 'undefined' ? process.env.NODE_ENV : "development") || "development",
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],
        // Performance Monitoring
        tracesSampleRate: (typeof process !== 'undefined' ? process.env.NODE_ENV : "development") === "production" ? 0.1 : 1.0,
        // Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        // Filter sensitive data
        beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint) {
            // Remove sensitive data from breadcrumbs
            if (event.breadcrumbs) {
                event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
                    if (breadcrumb.data?.token) {
                        breadcrumb.data.token = "[FILTERED]";
                    }
                    if (breadcrumb.data?.password) {
                        breadcrumb.data.password = "[FILTERED]";
                    }
                    return breadcrumb;
                });
            }
            return event;
        },
    });

    logger.info("✅ Sentry initialized for error tracking");
};

const sentryConfig = { initSentry };
export default sentryConfig;
