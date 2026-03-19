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

import type { Response } from 'express';

/** 200 — single resource or arbitrary data */
export const ok = (res: Response, data?: unknown, message?: string): void => {
    res.status(200).json({ success: true, ...(message ? { message } : {}), data });
};

/** 201 — created resource */
export const created = (res: Response, data: unknown, message = 'Created successfully'): void => {
    res.status(201).json({ success: true, message, data });
};

/** 204 — success with no body (delete, logout) */
export const noContent = (res: Response): void => {
    res.status(204).end();
};

export interface PaginationMeta {
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
}

/** 200 — paginated list with consistent shape across all modules */
export const paginated = <T>(
    res:   Response,
    data:  T[],
    total: number,
    page:  number,
    limit: number,
): void => {
    const meta: PaginationMeta = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
    res.status(200).json({ success: true, data, meta });
};

/** Operational error response — use only when you cannot propagate via next(err). */
export const fail = (res: Response, message: string, statusCode = 500): void => {
    res.status(statusCode).json({ success: false, message });
};
