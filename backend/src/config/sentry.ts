import * as Sentry from "@sentry/node";
// 
import SentryProfiling from "@sentry/profiling-node";
import type { Express } from "express";

// Coerce the import to handle potential CJS/ESM interop issues
// 
const nodeProfilingIntegration = (SentryProfiling as any).ProfilingIntegration || SentryProfiling.ProfilingIntegration;

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Only active if SENTRY_DSN is configured
 */
export const initSentry = (app: Express): void => {
    const sentryDsn = process.env.SENTRY_DSN;

    if (!sentryDsn || sentryDsn.trim() === "") {
        console.log("⚠️  Sentry not configured (SENTRY_DSN not set)");
        return;
    }

    Sentry.init({
        dsn: sentryDsn,
        environment: process.env.NODE_ENV || "development",
        integrations: [
            // Enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: true }),
            // Enable Express.js middleware tracing
            new Sentry.Integrations.Express({ app }),
            // Enable profiling
            new nodeProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0, // 10% in prod, 100% in dev
        // Profiling
        profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        // Filter sensitive data
        beforeSend(event, _hint) {
            // Remove sensitive headers
            if (event.request?.headers) {
                delete event.request.headers.authorization;
                delete event.request.headers.cookie;
            }
            // Remove sensitive data from context
            if (event.contexts?.user) {
                const user = event.contexts.user as any;
                delete user.email;
                delete user.ip_address;
            }
            return event;
        },
    });

    console.log("✅ Sentry initialized for error tracking");
};

/**
 * Sentry request handler (must be first middleware)
 */
export const sentryRequestHandler = () => {
    return Sentry.Handlers.requestHandler();
};

/**
 * Sentry tracing handler
 */
export const sentryTracingHandler = () => {
    return Sentry.Handlers.tracingHandler();
};

/**
 * Sentry error handler (must be before other error handlers)
 */
export const sentryErrorHandler = () => {
    return Sentry.Handlers.errorHandler();
};

export default { initSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler };
