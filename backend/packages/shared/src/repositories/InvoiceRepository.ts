import { injectable, singleton } from "tsyringe";
import Invoice from '@smarterp/core/modules/sales/models/Invoice.js';
import { IInvoice } from '@smarterp/shared/interfaces/IInvoice.js';

@injectable()
@singleton()
export class InvoiceRepository {
    async create(invoiceData: Partial<IInvoice>): Promise<IInvoice> {
        return Invoice.create(invoiceData);
    }

    async findById(id: string, userId: string): Promise<IInvoice | null> {
        return Invoice.findOne({ _id: id, createdBy: userId })
            .populate("customer")
            .populate("items.item", "name sku");
    }

    async findAll(userId: string): Promise<IInvoice[]> {
        return Invoice.find({
            createdBy: userId,
            isDeleted: { $ne: true }
        })
            .populate("customer", "name phone")
            .sort({ createdAt: -1 });
    }

    async update(id: string, userId: string, updateData: any): Promise<IInvoice | null> {
        return Invoice.findOneAndUpdate(
            { _id: id, createdBy: userId },
            updateData,
            { new: true }
        );
    }

    async delete(id: string, userId: string): Promise<IInvoice | null> {
        // Soft delete logic is usually business logic, but repo supports update or direct delete
        // We'll use update for soft delete
        return Invoice.findOneAndUpdate(
            { _id: id, createdBy: userId },
            {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: userId
            },
            { new: true }
        );
    }

    async count(userId: string): Promise<number> {
        return Invoice.countDocuments({ createdBy: userId });
    }
}
