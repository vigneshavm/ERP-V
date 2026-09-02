import { injectable, inject } from "tsyringe";
import { InvoiceRepository } from "../../../repositories/InvoiceRepository.js";
import { CustomerRepository } from "../../../repositories/CustomerRepository.js";
// import { BankAccountRepository } from "../repositories/BankAccountRepository.js"; // Stubbed for now
import { AppError } from "../../../utils/AppError.js";
import { calculateBatchGST } from "../../../utils/gstUtils.js";
import { IInvoice } from "../../../interfaces/IInvoice.js"; // assuming interfaces are still in root or need migration?
import { info } from "../../../config/logger.js";
import BankAccount from "../../finance/models/BankAccount.js";
import CashbankTransaction from "../../finance/models/CashbankTransaction.js";

@injectable()
export class SalesService {
    constructor(
        @inject(InvoiceRepository) private invoiceRepository: InvoiceRepository,
        @inject(CustomerRepository) private customerRepository: CustomerRepository
    ) { }

    async getSummary(userId: string): Promise<any> {
        const invoices = await this.invoiceRepository.findAll(userId); // findAll already filters isDeleted

        const totalInvoices = invoices.length;
        const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

        // Get actual customer dues
        const customers = await this.customerRepository.findAll(userId);
        const outstandingDues = customers.reduce((sum, customer) => {
            return sum + (customer.dues > 0 ? customer.dues : 0);
        }, 0);

        return {
            totalInvoices,
            totalSales,
            totalPaid,
            outstandingDues
        };
    }

    async getAllInvoices(userId: string): Promise<IInvoice[]> {
        return this.invoiceRepository.findAll(userId);
    }

    async getInvoiceById(invoiceId: string, userId: string): Promise<any> {
        const invoice = await this.invoiceRepository.findById(invoiceId, userId);
        if (!invoice) {
            throw new AppError("Invoice not found or unauthorized", 404);
        }

        // Transformation for frontend compatibility
        const transformedInvoice = invoice.toObject();
        transformedInvoice.items = transformedInvoice.items.map((item: any) => ({
            ...item,
            name: item.item?.name || 'Item',
            sku: item.item?.sku || ''
        }));

        return transformedInvoice;
    }

    async deleteInvoice(invoiceId: string, userId: string): Promise<void> {
        const invoice = await this.invoiceRepository.findById(invoiceId, userId);
        if (!invoice) {
            throw new AppError("Invoice not found or unauthorized", 404);
        }

        if (invoice.paymentStatus === "paid" || invoice.paymentStatus === "partial") {
            throw new AppError("Cannot delete paid or partially paid invoices. This is forbidden for accounting integrity.", 400);
        }

        await this.invoiceRepository.delete(invoiceId, userId);
        info(`Invoice soft-deleted successfully: ${invoice.invoiceNo}`);
    }

    async markAsPaid(invoiceId: string, userId: string, userName: string, paymentData: { amount: number, bankAccount?: string, paymentMethod?: string }): Promise<{ message: string, invoice: IInvoice }> {
        const { amount, bankAccount, paymentMethod = 'bank_transfer' } = paymentData;

        if (!amount || amount <= 0) {
            throw new AppError("Valid payment amount is required", 400);
        }

        const invoice = await this.invoiceRepository.findById(invoiceId, userId);
        if (!invoice) {
            throw new AppError("Invoice not found or unauthorized", 404);
        }

        if (invoice.paymentStatus === 'paid') {
            throw new AppError("Invoice is already fully paid", 400);
        }

        // Validate Bank Account if applicable
        if (paymentMethod === 'bank_transfer' && bankAccount) {
            const bankAcc = await BankAccount.findOne({ _id: bankAccount, userId });
            if (!bankAcc) {
                throw new AppError("Bank account not found", 400);
            }
            if (bankAcc.currentBalance < amount) {
                throw new AppError(`Insufficient balance. Available: ₹${bankAcc.currentBalance}`, 400);
            }
        }

        const newPaidAmount = invoice.paidAmount + amount;
        let newPaymentStatus = 'partial';
        if (newPaidAmount >= invoice.totalAmount) {
            newPaymentStatus = 'paid';
        }

        const updatedInvoice = await this.invoiceRepository.update(invoiceId, userId, {
            $set: {
                paidAmount: newPaidAmount,
                paymentStatus: newPaymentStatus,
                paymentMethod: paymentMethod
            }
        });

        if (!updatedInvoice) throw new AppError("Update failed", 500);

        // Update Customer Dues
        if (invoice.customer) {
            // Using ID directly as per interface, populated in repo might return object
            // If populated, customer is object. If not, string.
            // Repo findById populates.
            const customerId = typeof invoice.customer === 'object' ? (invoice.customer as any)._id : invoice.customer;
            const customer = await this.customerRepository.findById(customerId, userId);

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
                userId,
            });

            await BankAccount.updateOne(
                { _id: bankAccount, userId },
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
    async createInvoice(invoiceData: any, userId: string, tenantId: string): Promise<IInvoice> {
        if (!invoiceData.items || invoiceData.items.length === 0) {
            throw new AppError("Invoice must have at least one item", 400);
        }

        const isInterState: boolean = invoiceData.isInterState ?? false;
        const isInclusive: boolean  = (invoiceData.taxMode ?? 'INCLUSIVE') === 'INCLUSIVE';

        // Reusable GST batch computation
        const gstResult = calculateBatchGST(invoiceData.items, isInterState, isInclusive);

        const invoice = await this.invoiceRepository.create({
            ...invoiceData,
            items:          gstResult.items,
            createdBy:      userId,
            tenantId:       tenantId,
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
}
