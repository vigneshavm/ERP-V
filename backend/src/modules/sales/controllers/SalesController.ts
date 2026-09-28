import { Response, NextFunction } from "express";
import { injectable, inject } from "tsyringe";
import { SalesService } from "../services/SalesService.js";
import { AuthenticatedRequest } from "../../../middlewares/authMiddleware.js";

@injectable()
export class SalesController {
    constructor(@inject(SalesService) private salesService: SalesService) { }

    getSalesInvoiceSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const summary = await this.salesService.getSummary(req.tenantId);
            res.status(200).json({ success: true, data: summary });
        } catch (error) {
            next(error);
        }
    }

    getAllSalesInvoices = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const page = req.query.page ? Number(req.query.page) : undefined;
            if (page) {
                const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
                const search = typeof req.query.search === "string" ? req.query.search : undefined;
                const status = typeof req.query.status === "string" ? req.query.status : undefined;
                const customerId = typeof req.query.customerId === "string" ? req.query.customerId : undefined;
                const { invoices, total } = await this.salesService.searchInvoices(req.tenantId, { search, status, customerId, page, pageSize });
                res.status(200).json({
                    success: true,
                    data: invoices,
                    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
                });
                return;
            }
            const invoices = await this.salesService.getAllInvoices(req.tenantId);
            res.status(200).json({ success: true, data: invoices });
        } catch (error) {
            next(error);
        }
    }

    getSalesInvoiceById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const invoice = await this.salesService.getInvoiceById(req.params.id as string, req.tenantId);
            res.status(200).json({ success: true, data: invoice });
        } catch (error) {
            next(error);
        }
    }

    deleteSalesInvoice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            await this.salesService.deleteInvoice(req.params.id as string, req.tenantId);
            res.status(200).json({ success: true, data: { message: "Invoice soft-deleted successfully" } });
        } catch (error) {
            next(error);
        }
    }

    markSalesInvoiceAsPaid = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await this.salesService.markAsPaid(req.params.id as string, req.tenantId, req.user.name, req.body);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    createSalesInvoice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const invoice = await this.salesService.createInvoice(req.body, req.tenantId);
            res.status(201).json({ success: true, data: invoice });
        } catch (error) {
            next(error);
        }
    }
}
