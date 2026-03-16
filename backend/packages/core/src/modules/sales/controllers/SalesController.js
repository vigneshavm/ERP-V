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
import { injectable, inject } from "tsyringe";
import { SalesService } from "../services/SalesService.js";
let SalesController = class SalesController {
    salesService;
    constructor(salesService) {
        this.salesService = salesService;
    }
    getSalesInvoiceSummary = async (req, res, next) => {
        try {
            const userId = req.user._id;
            const summary = await this.salesService.getSummary(userId);
            res.status(200).json(summary);
        }
        catch (error) {
            next(error);
        }
    };
    getAllSalesInvoices = async (req, res, next) => {
        try {
            const userId = req.user._id;
            const invoices = await this.salesService.getAllInvoices(userId);
            res.status(200).json(invoices);
        }
        catch (error) {
            next(error);
        }
    };
    getSalesInvoiceById = async (req, res, next) => {
        try {
            const userId = req.user._id;
            const invoice = await this.salesService.getInvoiceById(req.params.id, userId);
            res.status(200).json(invoice);
        }
        catch (error) {
            next(error);
        }
    };
    deleteSalesInvoice = async (req, res, next) => {
        try {
            const userId = req.user._id;
            await this.salesService.deleteInvoice(req.params.id, userId);
            res.status(200).json({ message: "Invoice soft-deleted successfully" });
        }
        catch (error) {
            next(error);
        }
    };
    markSalesInvoiceAsPaid = async (req, res, next) => {
        try {
            const userId = req.user._id;
            const userName = req.user.name;
            const result = await this.salesService.markAsPaid(req.params.id, userId, userName, req.body);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    };
    createSalesInvoice = async (req, res, next) => {
        try {
            const userId = req.user._id;
            const tenantId = req.tenantId;
            const invoice = await this.salesService.createInvoice(req.body, userId, tenantId);
            res.status(201).json(invoice);
        }
        catch (error) {
            next(error);
        }
    };
    updateInvoiceStatus = async (req, res, next) => {
        try {
            const userId = req.user._id;
            const { status } = req.body;
            if (!status) {
                res.status(400).json({ message: "Status is required" });
                return;
            }
            const result = await this.salesService.updateStatus(req.params.id, userId, status);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    };
};
SalesController = __decorate([
    injectable(),
    __param(0, inject(SalesService)),
    __metadata("design:paramtypes", [SalesService])
], SalesController);
export { SalesController };
