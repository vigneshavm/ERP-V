import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "tsyringe";
import { SalesService } from "../services/SalesService.js";

@injectable()
export class SalesController {
    constructor(@inject(SalesService) private salesService: SalesService) { }

    getSalesInvoiceSummary = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const summary = await this.salesService.getSummary(userId);
            res.status(200).json(summary);
        } catch (error) {
            next(error);
        }
    }

    getAllSalesInvoices = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const invoices = await this.salesService.getAllInvoices(userId);
            res.status(200).json(invoices);
        } catch (error) {
            next(error);
        }
    }

    getSalesInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const invoice = await this.salesService.getInvoiceById(req.params.id as string, userId);
            res.status(200).json(invoice);
        } catch (error) {
            next(error);
        }
    }

    deleteSalesInvoice = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            await this.salesService.deleteInvoice(req.params.id as string, userId);
            res.status(200).json({ message: "Invoice soft-deleted successfully" });
        } catch (error) {
            next(error);
        }
    }

    markSalesInvoiceAsPaid = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const userName = (req as any).user.name;
            const result = await this.salesService.markAsPaid(req.params.id as string, userId, userName, req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    createSalesInvoice = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const tenantId = (req as any).tenantId; 
            const invoice = await this.salesService.createInvoice(req.body, userId, tenantId);
            res.status(201).json(invoice);
        } catch (error) {
            next(error);
        }
    }

    updateInvoiceStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const { status } = req.body;
            if (!status) {
                res.status(400).json({ message: "Status is required" });
                return;
            }
            const result = await this.salesService.updateStatus(req.params.id as string, userId, status);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}
