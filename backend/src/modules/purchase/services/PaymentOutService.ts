import { injectable, inject } from "tsyringe";
import { PaymentOutRepository } from "../repositories/PaymentOutRepository.js";
import { AppError } from "../../../utils/AppError.js";
import type { PaymentOutEntry, PaymentOutMode, PaymentAllocation } from "../../../integrations/textilesoft/erpPaymentOut.js";
import { info } from "../../../config/logger.js";

/** SQL-only payment-out workflow. The existing SQL table stores the payment and allocation snapshot;
 * linked Mongo bill, bank balance and cash-book records are intentionally not maintained. */
@injectable()
export class PaymentOutService {
    constructor(@inject(PaymentOutRepository) private paymentOutRepository: PaymentOutRepository) { }

    async createPayment(_tenantId: string, userId: string, body: any): Promise<PaymentOutEntry> {
        const { supplierId, paymentDate, amount, paymentMode, referenceNo, bankAccountId, chequeDate, allocations = [], notes } = body;
        const paymentAmount = Number(amount);
        if (!supplierId) throw new AppError("Supplier ID is required", 400);
        if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) throw new AppError("Payment amount must be greater than zero", 400);
        if (!Array.isArray(allocations) || allocations.some((allocation: PaymentAllocation) => !Number.isFinite(Number(allocation.amount)) || Number(allocation.amount) < 0)) {
            throw new AppError("Payment allocations must have non-negative amounts", 400);
        }
        const totalAllocated = allocations.reduce((sum: number, allocation: PaymentAllocation) => sum + Number(allocation.amount || 0), 0);
        if (totalAllocated > paymentAmount) throw new AppError("Allocated amount cannot exceed payment amount", 400);

        const lastPayment = await this.paymentOutRepository.findLatestByTenant(_tenantId);
        const lastNumber = Number(lastPayment?.paymentNo.match(/-(\d+)$/)?.[1] ?? 0);
        const paymentNo = `PAY-${String(lastNumber + 1).padStart(5, "0")}`;
        const payment = await this.paymentOutRepository.create({
            paymentNo,
            supplierId: String(supplierId),
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            amount: paymentAmount,
            paymentMode: String(paymentMode || "Cash") as PaymentOutMode,
            referenceNo: referenceNo ? String(referenceNo) : undefined,
            bankAccountId: bankAccountId ? String(bankAccountId) : undefined,
            chequeDate: chequeDate ? new Date(chequeDate) : undefined,
            status: paymentMode === "Cheque" ? "pending" : "cleared",
            allocations,
            unallocatedAmount: paymentAmount - totalAllocated,
            notes: notes ? String(notes) : undefined,
            createdBy: String(userId),
        });
        info(`SQL payment created: ${paymentNo}`);
        return payment;
    }

    async getPayments(tenantId: string): Promise<PaymentOutEntry[]> {
        return this.paymentOutRepository.findAll(tenantId);
    }

    async getPaymentById(id: string, tenantId: string): Promise<PaymentOutEntry> {
        const payment = await this.paymentOutRepository.findById(id, tenantId);
        if (!payment) throw new AppError("Payment not found", 404);
        return payment;
    }

    async updatePaymentStatus(id: string, tenantId: string, newStatus: string): Promise<PaymentOutEntry> {
        const payment = await this.getPaymentById(id, tenantId);
        if (!["pending", "cleared", "bounced", "cancelled"].includes(newStatus)) throw new AppError("Invalid payment status", 400);
        const updated = await this.paymentOutRepository.update(id, tenantId, { status: newStatus as PaymentOutEntry["status"] });
        if (!updated) throw new AppError("Failed to update payment status", 500);
        info(`SQL payment status updated: ${payment.paymentNo} -> ${newStatus}`);
        return updated;
    }
}
