/**
 * Global Express Request augmentation.
 *
 * Single source of truth for properties injected by middleware.
 * Eliminates the 169+ `(req as any).user` casts spread across controllers —
 * `req.user`, `req.tenantId`, and `req.tenant` are now fully typed everywhere.
 *
 * Rules:
 *  - All middleware that injects a property MUST do so via this interface.
 *  - Controllers should read from `req.user`, `req.tenantId` directly.
 *  - Never re-declare AuthenticatedRequest locally — use this global instead.
 */

import type { ITenant } from '@smarterp/core/modules/core/models/Tenant.js';

declare global {
    namespace Express {
        interface Request {
            /** Authenticated user — set by protect middleware. Present on all protected routes. */
            user?:       Record<string, any> & { _id: string; tenantId?: string; role?: string; systemRole?: string; activeDeviceId?: string; };
            /** Active tenant ID (string form of tenant._id) — set by protect + tenantResolver. */
            tenantId?:   string;
            /** Full tenant document — set by tenantResolver when resolved. */
            tenant?:     ITenant;
            tenantSlug?: string;
            /** Correlation ID for distributed tracing — set by requestId middleware. */
            correlationId?: string;
            /** Rate-limit context — set by rateLimiter middleware. */
            rateLimitContext?: Record<string, unknown>;
        }
    }
}

export {};
