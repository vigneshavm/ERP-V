import { injectable, singleton } from "tsyringe";
import SupplierGroup from "../models/SupplierGroup.js";
import { ISupplierGroup } from "../models/SupplierGroup.js";

@injectable()
@singleton()
export class SupplierGroupRepository {
    async create(data: Partial<ISupplierGroup>): Promise<ISupplierGroup> {
        return SupplierGroup.create(data);
    }

    async findById(id: string, tenantId: string): Promise<ISupplierGroup | null> {
        return SupplierGroup.findOne({ _id: id, tenantId });
    }

    async findByName(name: string, tenantId: string): Promise<ISupplierGroup | null> {
        return SupplierGroup.findOne({ name, tenantId });
    }

    async findAll(tenantId: string): Promise<ISupplierGroup[]> {
        return SupplierGroup.find({ tenantId }).sort({ name: 1 });
    }

    async update(id: string, tenantId: string, updates: Partial<ISupplierGroup>): Promise<ISupplierGroup | null> {
        return SupplierGroup.findOneAndUpdate(
            { _id: id, tenantId },
            updates,
            { new: true, runValidators: true }
        );
    }

    async delete(id: string, tenantId: string): Promise<ISupplierGroup | null> {
        return SupplierGroup.findOneAndDelete({ _id: id, tenantId });
    }
}
