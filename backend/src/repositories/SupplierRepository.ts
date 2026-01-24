import { injectable, singleton } from "tsyringe";
import Supplier from "../models/Supplier.js";
import { ISupplier } from "../interfaces/ISupplier.js";

@injectable()
@singleton()
export class SupplierRepository {
    async create(supplierData: Partial<ISupplier>): Promise<ISupplier> {
        return Supplier.create(supplierData);
    }

    async findById(id: string, userId: string): Promise<ISupplier | null> {
        return Supplier.findOne({ _id: id, owner: userId });
    }

    async findByContactNo(contactNo: string, userId: string): Promise<ISupplier | null> {
        return Supplier.findOne({ contactNo, owner: userId });
    }

    async findByEmail(email: string, userId: string): Promise<ISupplier | null> {
        return Supplier.findOne({ email, owner: userId });
    }

    async findByContactNoExcludingId(contactNo: string, userId: string, excludeId: string): Promise<ISupplier | null> {
        return Supplier.findOne({ contactNo, owner: userId, _id: { $ne: excludeId } });
    }

    async findByEmailExcludingId(email: string, userId: string, excludeId: string): Promise<ISupplier | null> {
        return Supplier.findOne({ email, owner: userId, _id: { $ne: excludeId } });
    }

    async findAll(userId: string): Promise<ISupplier[]> {
        return Supplier.find({ owner: userId }).sort({ businessName: 1 });
    }

    async findLatest(userId: string): Promise<ISupplier | null> {
        return Supplier.findOne({ owner: userId }).sort({ supplierId: -1 });
    }

    async update(id: string, userId: string, updateData: Partial<ISupplier>): Promise<ISupplier | null> {
        return Supplier.findOneAndUpdate(
            { _id: id, owner: userId },
            updateData,
            { new: true }
        );
    }

    async delete(id: string, userId: string): Promise<ISupplier | null> {
        return Supplier.findOneAndDelete({ _id: id, owner: userId });
    }
}
