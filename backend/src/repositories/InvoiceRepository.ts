import { injectable, singleton } from "tsyringe";
import Invoice from "../modules/sales/models/Invoice.js";
import { IInvoice } from "../interfaces/IInvoice.js";
import { Types } from "mongoose";

@injectable()
@singleton()
export class InvoiceRepository {
    async create(invoiceData: Partial<IInvoice>): Promise<IInvoice> {
        return Invoice.create(invoiceData);
    }

    /**
     * Find invoice by ID for a specific tenant
     * @param id Invoice ID
     * @param tenantId Tenant scope
     */
    async findById(id: string, tenantId: Types.ObjectId): Promise<IInvoice | null> {
        return Invoice.findOne({ _id: id, tenantId })
            .populate("customer")
            .populate("items.item", "name sku");
    }

    /**
     * Find all invoices for a tenant
     * @param tenantId Tenant scope
     */
    async findAll(tenantId: Types.ObjectId): Promise<IInvoice[]> {
        return Invoice.find({
            tenantId,
            isDeleted: { $ne: true }
        })
            .populate("customer", "name phone")
            .sort({ createdAt: -1 });
    }

    /**
     * Update invoice for a tenant
     */
    async update(id: string, tenantId: Types.ObjectId, updateData: any): Promise<IInvoice | null> {
        return Invoice.findOneAndUpdate(
            { _id: id, tenantId },
            updateData,
            { new: true }
        );
    }

    /**
     * Soft delete invoice for a tenant
     */
    async delete(id: string, tenantId: Types.ObjectId): Promise<IInvoice | null> {
        // Soft delete logic is usually business logic, but repo supports update or direct delete
        // We'll use update for soft delete
        return Invoice.findOneAndUpdate(
            { _id: id, tenantId },
            {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: undefined  // No longer using userId, use tenantId context
            },
            { new: true }
        );
    }

    /**
     * Count invoices for a tenant
     */
    async count(tenantId: Types.ObjectId): Promise<number> {
        return Invoice.countDocuments({ tenantId });
    }
}
