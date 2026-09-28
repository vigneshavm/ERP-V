import { Response } from "express";

/**
 * Success response helpers -- the only way controllers write success bodies.
 * Shapes are defined in docs/backend-architecture.md §3. Errors never go through here:
 * controllers call `next(error)` and `middlewares/errorHandler.ts` writes them.
 */

export interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

/** `{ success: true, data }` (+ optional `message`). */
export const sendSuccess = <T>(res: Response, data: T, options: { status?: number; message?: string } = {}): void => {
    res.status(options.status ?? 200).json({
        success: true,
        data,
        ...(options.message ? { message: options.message } : {}),
    });
};

/** 201 `{ success: true, data }`. */
export const sendCreated = <T>(res: Response, data: T, message?: string): void => {
    sendSuccess(res, data, { status: 201, message });
};

/** `{ success: true, data: [...], pagination? }` -- `pagination` only for paged endpoints. */
export const sendList = <T>(res: Response, items: T[], pagination?: Pagination): void => {
    res.status(200).json({
        success: true,
        data: items,
        ...(pagination ? { pagination } : {}),
    });
};

/** Builds the pagination block from page/pageSize/total. */
export const toPagination = (page: number, pageSize: number, total: number): Pagination => ({
    page,
    pageSize,
    total,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
});
