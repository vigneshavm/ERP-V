import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { BillService } from '../services/BillService.js';

import { asyncHandler }               from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated }     from '@smarterp/shared/utils/response.js';
import { parsePagination, parseSort } from '@smarterp/shared/utils/pagination.js';
import { requireUserId }              from '@smarterp/shared/utils/tenantContext.js';

const resolve = () => container.resolve(BillService);

/**
 * GET /api/v1/finance/bills
 * Paginated bill list with optional supplier/status/paymentStatus filters.
 */
export const getAllBills = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId              = requireUserId(req);
    const { page, limit }     = parsePagination(req.query, 50);
    const sort                = parseSort(req.query.sort as string | undefined, '-date');
    const { supplier, status, paymentStatus } = req.query as Record<string, string>;

    const { data, total } = await resolve().getAllBillsPaginated(userId, page, limit, sort, {
        supplier, status, paymentStatus,
    });

    paginated(res, data, total, page, limit);
});

/** POST /api/v1/finance/bills */
export const createBill = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const bill = await resolve().createBill(req.body, requireUserId(req));
    created(res, bill);
});

/** GET /api/v1/finance/bills/:id */
export const getBillById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const bill = await resolve().getBillById(req.params.id, requireUserId(req));
    ok(res, bill);
});

/** PUT /api/v1/finance/bills/:id */
export const updateBill = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const bill = await resolve().updateBill(req.params.id, requireUserId(req), req.body);
    ok(res, bill, 'Bill updated successfully');
});

/** DELETE /api/v1/finance/bills/:id */
export const deleteBill = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await resolve().deleteBill(req.params.id, requireUserId(req));
    ok(res, null, 'Bill deleted');
});

/** PATCH /api/v1/finance/bills/:id — record a payment */
export const updateBillPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await resolve().updateBillPayment(req.params.id, requireUserId(req), req.body);
    ok(res, result, 'Payment recorded successfully');
});

export default { getAllBills, createBill, getBillById, updateBill, deleteBill, updateBillPayment };
