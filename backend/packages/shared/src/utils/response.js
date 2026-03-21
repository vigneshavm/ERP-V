/**
 * Canonical HTTP response helpers.
 *
 * Problem solved: 483 scattered `res.status(200).json({ success: true, ... })`
 * constructions across the codebase produce inconsistent shapes (some have
 * `success`, some don't; pagination keys differ between modules).
 *
 * Usage:
 *   import { ok, created, noContent, paginated, fail } from '@smarterp/shared/utils/response.js';
 *
 *   ok(res, data)
 *   created(res, entity)
 *   noContent(res)
 *   paginated(res, items, total, page, limit)
 *   fail(res, 'Not found', 404)    // for known operational errors without next()
 */
/** 200 — single resource or arbitrary data */
export const ok = (res, data, message) => {
    res.status(200).json({ success: true, ...(message ? { message } : {}), data });
};
/** 201 — created resource */
export const created = (res, data, message = 'Created successfully') => {
    res.status(201).json({ success: true, message, data });
};
/** 204 — success with no body (delete, logout) */
export const noContent = (res) => {
    res.status(204).end();
};
/** 200 — paginated list with consistent shape across all modules */
export const paginated = (res, data, total, page, limit) => {
    const meta = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
    res.status(200).json({ success: true, data, meta });
};
/** Operational error response — use only when you cannot propagate via next(err). */
export const fail = (res, message, statusCode = 500) => {
    res.status(statusCode).json({ success: false, message });
};
