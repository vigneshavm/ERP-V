import { injectable, singleton } from "tsyringe";
import SupplierReconciliation from "../models/SupplierReconciliation.js";
import { ISupplierReconciliation } from "../models/SupplierReconciliation.js";
import { Types } from "mongoose";

@injectable()
@singleton()
export class SupplierReconciliationRepository {
    async create(data: Partial<ISupplierReconciliation>): Promise<ISupplierReconciliation> {
        return SupplierReconciliation.create(data);
    }

    async findById(id: string, tenantId: Types.ObjectId): Promise<ISupplierReconciliation | null> {
        return SupplierReconciliation.findOne({ _id: id, tenantId });
    }

    async findByTransactionId(transactionId: string, tenantId: Types.ObjectId): Promise<ISupplierReconciliation | null> {
        return SupplierReconciliation.findOne({ transactionId, tenantId });
    }

    async findBySupplier(supplierId: Types.ObjectId, tenantId: Types.ObjectId): Promise<ISupplierReconciliation[]> {
        return SupplierReconciliation.find({ supplierId, tenantId }).sort({ reconciledAt: -1 });
    }

    async findByStatus(status: string, tenantId: Types.ObjectId): Promise<ISupplierReconciliation[]> {
        return SupplierReconciliation.find({ status, tenantId }).sort({ reconciledAt: -1 });
    }

    async findUpsert(
        transactionId: string,
        tenantId: Types.ObjectId,
        data: Partial<ISupplierReconciliation>
    ): Promise<ISupplierReconciliation> {
        return SupplierReconciliation.findOneAndUpdate(
            { transactionId, tenantId },
            data,
            { upsert: true, new: true }
        );
    }

    async update(id: string, tenantId: Types.ObjectId, updates: Partial<ISupplierReconciliation>): Promise<ISupplierReconciliation | null> {
        return SupplierReconciliation.findOneAndUpdate(
            { _id: id, tenantId },
            updates,
            { new: true, runValidators: true }
        );
    }

    async delete(id: string, tenantId: Types.ObjectId): Promise<ISupplierReconciliation | null> {
        return SupplierReconciliation.findOneAndDelete({ _id: id, tenantId });
    }
}
