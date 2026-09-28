import { injectable, singleton } from "tsyringe";
import PaymentOut from "../models/PaymentOut.js";
import { IPaymentOut } from "../models/PaymentOut.js";
import { Types, ClientSession } from "mongoose";

@injectable()
@singleton()
export class PaymentOutRepository {
    async create(data: Partial<IPaymentOut>, session?: ClientSession): Promise<IPaymentOut> {
        if (session) {
            return (await PaymentOut.create([data], { session }))[0];
        }
        return PaymentOut.create(data);
    }

    async findById(id: string, tenantId: string, session?: ClientSession): Promise<IPaymentOut | null> {
        const query = PaymentOut.findOne({ _id: id, tenantId });
        if (session) {
            return query.session(session);
        }
        return query;
    }

    async findByPaymentNo(paymentNo: string, tenantId: string): Promise<IPaymentOut | null> {
        return PaymentOut.findOne({ paymentNo, tenantId });
    }

    async findAll(tenantId: string): Promise<IPaymentOut[]> {
        return PaymentOut.find({ tenantId })
            .populate('supplierId', 'businessName')
            .populate('bankAccountId', 'bankName accountNumber')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
    }

    async findBySupplier(supplierId: Types.ObjectId, tenantId: string): Promise<IPaymentOut[]> {
        return PaymentOut.find({ supplierId, tenantId }).sort({ createdAt: -1 });
    }

    async findByStatus(status: string, tenantId: string): Promise<IPaymentOut[]> {
        return PaymentOut.find({ status, tenantId }).sort({ createdAt: -1 });
    }

    async findLatestByTenant(tenantId: string): Promise<IPaymentOut | null> {
        return PaymentOut.findOne({ tenantId }).sort({ createdAt: -1 });
    }

    async update(id: string, tenantId: string, updates: Partial<IPaymentOut>, session?: ClientSession): Promise<IPaymentOut | null> {
        const query = PaymentOut.findOneAndUpdate(
            { _id: id, tenantId },
            updates,
            { new: true, runValidators: true }
        );
        if (session) {
            return query.session(session);
        }
        return query;
    }

    async delete(id: string, tenantId: string): Promise<IPaymentOut | null> {
        return PaymentOut.findOneAndDelete({ _id: id, tenantId });
    }
}
