import { injectable, singleton } from "tsyringe";
import Supplier, { ISupplier } from "../modules/purchase/models/Supplier.js";

/**
 * Repository for the Purchase module's own Supplier model (`modules/purchase/models/Supplier.ts`).
 * Distinct from the top-level `SupplierRepository`, which reads the CRM module's separate
 * Supplier model (`modules/crm/models/Supplier.js`, owner-scoped) -- the two are not interchangeable.
 */
@injectable()
@singleton()
export class PurchaseSupplierRepository {
    async findByName(tenantId: string, businessName: string): Promise<ISupplier | null> {
        return Supplier.findOne({ tenantId, businessName });
    }

    async findLatestForTenant(tenantId: string): Promise<ISupplier | null> {
        return Supplier.findOne({ tenantId }).sort({ supplierId: -1 });
    }

    async create(data: Partial<ISupplier>): Promise<ISupplier> {
        return Supplier.create(data);
    }

    async findAllForTenant(tenantId: string): Promise<ISupplier[]> {
        return Supplier.find({ tenantId }).populate("groupId").sort({ createdAt: -1 });
    }

    async findByIdForTenant(id: string, tenantId: string): Promise<ISupplier | null> {
        return Supplier.findOne({ _id: id, tenantId }).populate("groupId").lean<ISupplier>();
    }

    async findRawByIdForTenant(id: string, tenantId: string): Promise<ISupplier | null> {
        return Supplier.findOne({ _id: id, tenantId });
    }

    async updateForTenant(id: string, tenantId: string, updateData: Partial<ISupplier>): Promise<ISupplier | null> {
        return Supplier.findOneAndUpdate({ _id: id, tenantId }, updateData, { new: true, runValidators: true });
    }

    async deleteForTenant(id: string, tenantId: string): Promise<ISupplier | null> {
        return Supplier.findOneAndDelete({ _id: id, tenantId });
    }
}
