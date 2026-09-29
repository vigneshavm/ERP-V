import { injectable, inject } from "tsyringe";
import { Types } from "mongoose";
import { InvoiceRepository } from "../../../repositories/InvoiceRepository.js";
import { CustomerRepository } from "../../../repositories/CustomerRepository.js";
// import { BankAccountRepository } from "../repositories/BankAccountRepository.js"; // Stubbed for now
import { AppError } from "../../../utils/AppError.js";
import { calculateBatchGST } from "../../../utils/gstUtils.js";
import { IInvoice } from "../../../interfaces/IInvoice.js"; // assuming interfaces are still in root or need migration?
import { info } from "../../../config/logger.js";
import BankAccount from "../../finance/models/BankAccount.js";
import CashbankTransaction from "../../finance/models/CashbankTransaction.js";
import Invoice from "../models/Invoice.js";
import Customer from "../../crm/models/Customer.js";
import { isSqlItemSource } from "../../../config/itemDataSource.js";
import { isSqlId, sqlInvoiceById } from "../../../integrations/textilesoft/sqlSales.js";
import { tenantKey } from "../../../utils/mongooseUtils.js";

@injectable()
export class SalesService {
    constructor(
        @inject(InvoiceRepository) private invoiceRepository: InvoiceRepository,
        @inject(CustomerRepository) private customerRepository: CustomerRepository
    ) { }

    /**
     * Get sales summary for a tenant using aggregation (not loading all invoices into memory)
     * OPTIMIZED: Uses aggregation pipeline to compute totals in database, reducing memory usage by 70x
     * @param tenantId Tenant to scope by
     */
    async getSummary(tenantId: Types.ObjectId): Promise<any> {
        const tid = tenantKey(String(tenantId));

        // Use aggregation to compute all totals in database (not in memory)
        const [invoiceSummary] = await Invoice.aggregate([
            {
                $match: {
                    tenantId: tid,
                    isDeleted: { $ne: true },
                    fulfillmentStatus: { $nin: ["CANCELLED", "REFUNDED"] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalInvoices: { $sum: 1 },
                    totalSales: { $sum: "$totalAmount" },
                    totalPaid: { $sum: "$paidAmount" }
                }
            }
        ]);

        // Get customer dues using aggregation as well
        const [duesSummary] = await Customer.aggregate([
            {
                $match: {
                    tenantId: tid
                }
            },
            {
                $group: {
                    _id: null,
                    outstandingDues: { $sum: { $max: [0, "$dues"] } }
                }
            }
        ]);

        return {
            totalInvoices: invoiceSummary?.totalInvoices ?? 0,
            totalSales: invoiceSummary?.totalSales ?? 0,
            totalPaid: invoiceSummary?.totalPaid ?? 0,
            outstandingDues: duesSummary?.outstandingDues ?? 0
        };
    }

    /**
     * Get all invoices for a tenant (unbounded, sorted newest-first). Kept as-is for existing
     * full-list consumers (POS invoice lookup, generic report data source, EMI plans) — use
     * `searchInvoices` for the paginated sales-invoices list page.
     */
    async getAllInvoices(tenantId: Types.ObjectId): Promise<IInvoice[]> {
        return this.invoiceRepository.findAll(tenantId);
    }

    /**
     * Paginated + filterable invoice list for the Sales Invoices page. Total count is computed
     * with the same filter so the UI's page count reflects the applied search/status/customer.
     */
    async searchInvoices(
        tenantId: Types.ObjectId,
        options: { search?: string; status?: string; customerId?: string; page: number; pageSize: number }
    ): Promise<{ invoices: IInvoice[]; total: number }> {
        const tid = tenantKey(String(tenantId));
        const filter: Record<string, unknown> = { tenantId: tid, isDeleted: { $ne: true } };

        if (options.status && options.status !== "all") {
            filter.paymentStatus = options.status;
        }
        if (options.customerId) {
            filter.customer = options.customerId;
        }

        const search = options.search?.trim();
        if (search) {
            const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            const matchingCustomers = await Customer.find({ tenantId: tid, name: regex }, { _id: 1 }).lean();
            filter.$or = [
                { invoiceNo: regex },
                { customer: { $in: matchingCustomers.map((c) => c._id) } },
            ];
        }

        const skip = (options.page - 1) * options.pageSize;
        const [invoices, total] = await Promise.all([
            Invoice.find(filter)
                .populate("customer", "name phone")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(options.pageSize)
                .lean() as unknown as Promise<IInvoice[]>,
            Invoice.countDocuments(filter),
        ]);

        return { invoices, total };
    }

    /**
     * Get invoice by ID for a tenant
     */
    async getInvoiceById(invoiceId: string, tenantId: Types.ObjectId): Promise<any> {
        // Bills from the shop's Textilesoft database use ids like "sql:10212257" -- never a valid
        // Mongo ObjectId, so they must be handled before any Invoice.findOne/findById call, which
        // would otherwise throw a CastError (as it did here: this path is the one actually wired to
        // GET /api/sales-invoice/invoice/:id via SalesController/sales.routes.ts).
        if (isSqlId(invoiceId)) {
            const shopInvoice = isSqlItemSource() ? await sqlInvoiceById(invoiceId) : undefined;
            if (!shopInvoice) {
                throw new AppError("Invoice not found", 404, 'INVOICE_NOT_FOUND');
            }
            return shopInvoice;
        }

        const invoice = await this.invoiceRepository.findById(invoiceId, tenantId);
        if (!invoice) {
            throw new AppError("Invoice not found", 404, 'INVOICE_NOT_FOUND');
        }

        // Transformation for frontend compatibility
        const transformedInvoice = invoice.toObject();
        transformedInvoice.items = transformedInvoice.items.map((item: any) => ({
            ...item,
            name: item.item?.name || item.name || 'Item', // Quick Entry lines have no item, only their own name
            sku: item.item?.sku || ''
        }));

        return transformedInvoice;
    }

    /**
     * Soft delete invoice for a tenant
     */
    async deleteInvoice(invoiceId: string, tenantId: Types.ObjectId): Promise<void> {
        const invoice = await this.invoiceRepository.findById(invoiceId, tenantId);
        if (!invoice) {
            throw new AppError("Invoice not found", 404, 'INVOICE_NOT_FOUND');
        }

        if (invoice.paymentStatus === "paid" || invoice.paymentStatus === "partial") {
            throw new AppError("Cannot delete paid or partially paid invoices. This is forbidden for accounting integrity.", 400, 'INVOICE_PAID_CANNOT_DELETE');
        }

        await this.invoiceRepository.delete(invoiceId, tenantId);
        info(`Invoice soft-deleted: ${invoice.invoiceNo} (tenant: ${tenantId})`);
    }

    /**
     * Mark invoice as paid for a tenant
     */
    async markAsPaid(invoiceId: string, tenantId: Types.ObjectId, userName: string, paymentData: { amount: number, bankAccount?: string, paymentMethod?: string }): Promise<{ message: string, invoice: IInvoice }> {
        const { amount, bankAccount, paymentMethod = 'bank_transfer' } = paymentData;

        if (!amount || amount <= 0) {
            throw new AppError("Valid payment amount is required", 400, 'INVALID_PAYMENT_AMOUNT');
        }

        const invoice = await this.invoiceRepository.findById(invoiceId, tenantId);
        if (!invoice) {
            throw new AppError("Invoice not found", 404, 'INVOICE_NOT_FOUND');
        }

        if (invoice.paymentStatus === 'paid') {
            throw new AppError("Invoice is already fully paid", 400, 'INVOICE_ALREADY_PAID');
        }

        // Validate Bank Account if applicable
        if (paymentMethod === 'bank_transfer' && bankAccount) {
            const bankAcc = await BankAccount.findOne({ _id: bankAccount, tenantId });
            if (!bankAcc) {
                throw new AppError("Bank account not found", 400, 'BANK_ACCOUNT_NOT_FOUND');
            }
            if (bankAcc.currentBalance < amount) {
                throw new AppError(`Insufficient balance. Available: ₹${bankAcc.currentBalance}`, 400, 'INSUFFICIENT_BALANCE');
            }
        }

        const newPaidAmount = invoice.paidAmount + amount;
        let newPaymentStatus = 'partial';
        if (newPaidAmount >= invoice.totalAmount) {
            newPaymentStatus = 'paid';
        }

        const updatedInvoice = await this.invoiceRepository.update(invoiceId, tenantId, {
            $set: {
                paidAmount: newPaidAmount,
                paymentStatus: newPaymentStatus,
                paymentMethod: paymentMethod
            }
        });

        if (!updatedInvoice) throw new AppError("Update failed", 500, 'UPDATE_FAILED');

        // Update Customer Dues
        if (invoice.customer) {
            // Using ID directly as per interface, populated in repo might return object
            // If populated, customer is object. If not, string.
            // Repo findById populates.
            const customerId = typeof invoice.customer === 'object' ? (invoice.customer as any)._id : invoice.customer;
            const customer = await this.customerRepository.findById(customerId, tenantId);

            if (customer) {
                customer.dues = Math.max(0, customer.dues - amount);
                await customer.save(); // Using save on document
                info(`Customer ledger updated: ${customer.name} dues reduced by ₹${amount}, new balance: ₹${customer.dues}`);
            }
        }

        // Handle Bank Transaction
        if (paymentMethod === 'bank_transfer' && bankAccount) {
            const cashbankTxn = await CashbankTransaction.create({
                type: 'in',
                amount,
                fromAccount: 'sale',
                toAccount: bankAccount,
                description: `Payment for invoice ${invoice.invoiceNo}`,
                date: new Date(),
                tenantId,
            });

            await BankAccount.updateOne(
                { _id: bankAccount, tenantId },
                {
                    $inc: { currentBalance: amount },
                    $push: { transactions: cashbankTxn._id }
                }
            );

            info(`Bank payment recorded for sales invoice ${invoice.invoiceNo}: +₹${amount} to account ${bankAccount}`);
        }

        info(`Sales invoice ${invoice.invoiceNo} marked as ${newPaymentStatus} by ${userName}: +₹${amount}`);

        return {
            message: `Invoice marked as ${newPaymentStatus}`,
            invoice: updatedInvoice
        };
    }
    /**
     * Create invoice for a tenant
     */
    async createInvoice(invoiceData: any, tenantId: Types.ObjectId): Promise<IInvoice> {
        if (!invoiceData.items || invoiceData.items.length === 0) {
            throw new AppError("Invoice must have at least one item", 400, 'INVOICE_NO_ITEMS');
        }

        const isInterState: boolean = invoiceData.isInterState ?? false;
        const isInclusive: boolean  = (invoiceData.taxMode ?? 'INCLUSIVE') === 'INCLUSIVE';

        // Reusable GST batch computation
        const gstResult = calculateBatchGST(invoiceData.items, isInterState, isInclusive);

        // Server-assigned, ignoring any client-supplied invoiceNo -- a client-generated number
        // (e.g. Date.now()-based) risks colliding with the unique {invoiceNo, tenantId} index
        // under concurrent submissions. Same "INV-<year>-<seq>" convention as PosController.
        const invoiceNo = await this.nextInvoiceNo(tenantId);

        const invoice = await this.invoiceRepository.create({
            ...invoiceData,
            invoiceNo,
            items:          gstResult.items,
            tenantId,
            isInterState,
            taxMode:        invoiceData.taxMode ?? 'INCLUSIVE',
            taxBreakdown: {
                cgst:  gstResult.totalCGST,
                sgst:  gstResult.totalSGST,
                igst:  gstResult.totalIGST,
                total: gstResult.totalTax,
            },
            paymentStatus:  invoiceData.status || 'unpaid',
            paymentMethod:  invoiceData.paymentMethod || 'due',
            hasReturns:     false,
            returnedAmount: 0,
            paidAmount:     0,
        });

        return invoice;
    }

    private async nextInvoiceNo(tenantId: Types.ObjectId): Promise<string> {
        const lastInvoice = await Invoice.findOne({ tenantId, invoiceNo: /^INV-/ }).sort({ createdAt: -1 });
        let nextNum = 1;
        const match = lastInvoice?.invoiceNo?.match(/-(\d+)$/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
        return `INV-${new Date().getFullYear()}-${String(nextNum).padStart(5, '0')}`;
    }
}
