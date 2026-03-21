/**
 * Tenant context helpers.
 *
 * Problem solved: every service and controller accesses `req.tenantId` or
 * `req.user._id` via `(req as any)` because the types were not centralised.
 * With the global Express augmentation in types/express.d.ts, these are now
 * typed, but controllers still need a guard that throws a clear error if
 * the middleware chain wasn't wired correctly.
 *
 * Usage:
 *   import { requireTenantId, requireUserId } from '@smarterp/shared/utils/tenantContext.js';
 *
 *   const tenantId = requireTenantId(req);   // throws AppError 400 if missing
 *   const userId   = requireUserId(req);     // throws AppError 401 if missing
 */
import { AppError } from './AppError.js';
/** Assert tenantId is on the request (injected by tenantResolver + protect). */
export const requireTenantId = (req) => {
    if (!req.tenantId) {
        throw new AppError('Tenant context missing — protect middleware not applied', 400);
    }
    return req.tenantId;
};
/** Assert the authenticated user is on the request (injected by protect). */
export const requireUserId = (req) => {
    if (!req.user?._id) {
        throw new AppError('Not authorized', 401);
    }
    return String(req.user._id);
};
/** Assert both tenantId and userId are present and return both. */
export const requireContext = (req) => ({
    tenantId: requireTenantId(req),
    userId: requireUserId(req),
});
