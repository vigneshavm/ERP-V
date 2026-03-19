import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';

import { SalesService } from '../services/SalesService.js';

import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';
import { parsePagination, parseSort } from '@smarterp/shared/utils/pagination.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';

/**
 * SalesController
 *
 * Follows the same pattern as InventoryController (the canonical reference).
 * Key changes from original:
 *   - asyncHandler replaces every try/catch block (8 removed).
 *   - (req as any).user replaced with typed req.user via express.d.ts.
 *   - Manual sort-string parsing replaced with parseSort() utility.
 *   - Inline pagination object replaced with paginated() helper.
 *   - Inline status validation replaced with AppError throw.
 */
@injectable()
export class SalesController {
    constructor(@inject(SalesService) private salesService: SalesService) {}

    getSalesInvoiceSummary = asyncHandler(async (req: Request, res: Response) => {
        const summary = await this.salesService.getSummary(req.user!._id);
        ok(res, summary);
    });

    getAllSalesInvoices = asyncHandler(async (req: Request, res: Response) => {
        const { page, limit } = parsePagination(req.query);
        const sort = parseSort(req.query.sort as string | undefined);

        const { data, total } = await this.salesService.getAllInvoicesPaginated(
            req.user!._id, page, limit, sort,
        );

        paginated(res, data, total, page, limit);
    });

    getSalesInvoiceById = asyncHandler(async (req: Request, res: Response) => {
        const invoice = await this.salesService.getInvoiceById(req.params.id, req.user!._id);
        ok(res, invoice);
    });

    createSalesInvoice = asyncHandler(async (req: Request, res: Response) => {
        const invoice = await this.salesService.createInvoice(
            req.body, req.user!._id, req.tenantId!,
        );
        created(res, invoice);
    });

    updateSalesInvoice = asyncHandler(async (req: Request, res: Response) => {
        const invoice = await this.salesService.updateInvoice(
            req.params.id, req.user!._id, req.body,
        );
        ok(res, invoice);
    });

    updateInvoiceStatus = asyncHandler(async (req: Request, res: Response) => {
        const { status } = req.body;
        if (!status) throw new AppError('Status is required', 400);

        const result = await this.salesService.updateStatus(req.params.id, req.user!._id, status);
        ok(res, result);
    });

    markSalesInvoiceAsPaid = asyncHandler(async (req: Request, res: Response) => {
        const result = await this.salesService.markAsPaid(
            req.params.id, req.user!._id, req.user!.name, req.body,
        );
        ok(res, result);
    });

    deleteSalesInvoice = asyncHandler(async (req: Request, res: Response) => {
        await this.salesService.deleteInvoice(req.params.id, req.user!._id);
        ok(res, null, 'Invoice soft-deleted successfully');
    });
}
