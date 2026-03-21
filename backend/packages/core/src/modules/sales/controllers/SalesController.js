var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
let SalesController = class SalesController {
    salesService;
    constructor(salesService) {
        this.salesService = salesService;
    }
    getSalesInvoiceSummary = asyncHandler(async (req, res) => {
        const summary = await this.salesService.getSummary(req.user._id);
        ok(res, summary);
    });
    getAllSalesInvoices = asyncHandler(async (req, res) => {
        const { page, limit } = parsePagination(req.query);
        const sort = parseSort(req.query.sort);
        const { data, total } = await this.salesService.getAllInvoicesPaginated(req.user._id, page, limit, sort);
        paginated(res, data, total, page, limit);
    });
    getSalesInvoiceById = asyncHandler(async (req, res) => {
        const invoice = await this.salesService.getInvoiceById(req.params.id, req.user._id);
        ok(res, invoice);
    });
    createSalesInvoice = asyncHandler(async (req, res) => {
        const invoice = await this.salesService.createInvoice(req.body, req.user._id, req.tenantId);
        created(res, invoice);
    });
    updateSalesInvoice = asyncHandler(async (req, res) => {
        const invoice = await this.salesService.updateInvoice(req.params.id, req.user._id, req.body);
        ok(res, invoice);
    });
    updateInvoiceStatus = asyncHandler(async (req, res) => {
        const { status } = req.body;
        if (!status)
            throw new AppError('Status is required', 400);
        const result = await this.salesService.updateStatus(req.params.id, req.user._id, status);
        ok(res, result);
    });
    markSalesInvoiceAsPaid = asyncHandler(async (req, res) => {
        const result = await this.salesService.markAsPaid(req.params.id, req.user._id, req.user.name, req.body);
        ok(res, result);
    });
    deleteSalesInvoice = asyncHandler(async (req, res) => {
        await this.salesService.deleteInvoice(req.params.id, req.user._id);
        ok(res, null, 'Invoice soft-deleted successfully');
    });
};
SalesController = __decorate([
    injectable(),
    __param(0, inject(SalesService)),
    __metadata("design:paramtypes", [SalesService])
], SalesController);
export { SalesController };
