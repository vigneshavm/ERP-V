/**
 * Pagination utilities.
 *
 * Problem solved: sort-string parsing and page/limit coercion are duplicated
 * in at least 12 controllers (SalesController, ExpenseController, BillController,
 * InventoryController, CustomerController, ...). Each copy has subtle differences.
 *
 * Usage:
 *   import { parsePagination, parseSort } from '@smarterp/shared/utils/pagination.js';
 *
 *   const { page, limit, skip } = parsePagination(req.query);
 *   const sort = parseSort(req.query.sort as string);   // { createdAt: -1 }
 */

import type { ParsedQs } from 'qs';

export interface PaginationParams {
    page:  number;
    limit: number;
    skip:  number;
}

/**
 * Extract and coerce page / limit from query string.
 * Defaults: page=1, limit=50. Limits are capped at 200 to prevent abuse.
 */
export const parsePagination = (query: ParsedQs, defaultLimit = 50): PaginationParams => {
    const page  = Math.max(1, parseInt(query.page  as string, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(query.limit as string, 10) || defaultLimit));
    return { page, limit, skip: (page - 1) * limit };
};

/**
 * Parse a sort string like "-createdAt" or "name" into a Mongoose sort object.
 * Falls back to { createdAt: -1 } when the input is absent or invalid.
 */
export const parseSort = (sort?: string, defaultSort = '-createdAt'): Record<string, 1 | -1> => {
    const raw   = sort ?? defaultSort;
    const desc  = raw.startsWith('-');
    const field = desc ? raw.slice(1) : raw;
    // Reject field names that could inject operators
    if (!/^[\w.]+$/.test(field)) return parseSort(defaultSort);
    return { [field]: desc ? -1 : 1 };
};
