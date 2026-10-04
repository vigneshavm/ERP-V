import { injectable, singleton } from "tsyringe";
import {
    createPaymentOut,
    findPaymentOutById,
    findPaymentOutByPaymentNo,
    listPaymentOuts,
    listPaymentOutsBySupplier,
    listPaymentOutsByStatus,
    findLatestPaymentOut,
    updatePaymentOut,
    deletePaymentOut,
    type PaymentOutEntry,
} from "../../../integrations/textilesoft/erpPaymentOut.js";

@injectable()
@singleton()
export class PaymentOutRepository {
    async create(data: Parameters<typeof createPaymentOut>[0]): Promise<PaymentOutEntry> {
        return createPaymentOut(data);
    }

    async findById(id: string, _tenantId?: unknown): Promise<PaymentOutEntry | null> {
        return findPaymentOutById(id);
    }

    async findByPaymentNo(paymentNo: string, _tenantId?: unknown): Promise<PaymentOutEntry | null> {
        return findPaymentOutByPaymentNo(paymentNo);
    }

    async findAll(_tenantId?: unknown): Promise<PaymentOutEntry[]> {
        return listPaymentOuts();
    }

    async findBySupplier(supplierId: string, _tenantId?: unknown): Promise<PaymentOutEntry[]> {
        return listPaymentOutsBySupplier(supplierId);
    }

    async findByStatus(status: string, _tenantId?: unknown): Promise<PaymentOutEntry[]> {
        return listPaymentOutsByStatus(status);
    }

    async findLatestByTenant(_tenantId?: unknown): Promise<PaymentOutEntry | null> {
        return findLatestPaymentOut();
    }

    async update(id: string, _tenantId: unknown, updates: Partial<{ status: PaymentOutEntry["status"] }>): Promise<PaymentOutEntry | null> {
        return updatePaymentOut(id, updates);
    }

    async delete(id: string, _tenantId?: unknown): Promise<PaymentOutEntry | null> {
        const payment = await findPaymentOutById(id);
        if (!payment) return null;
        await deletePaymentOut(id);
        return payment;
    }
}
