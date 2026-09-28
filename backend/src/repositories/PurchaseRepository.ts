import { injectable, singleton } from "tsyringe";
import { ClientSession } from "mongoose";
import Purchase, { IPurchase } from "../modules/purchase/models/Purchase.js";

export interface PurchaseListQuery {
    tenantId?: string;
    createdBy?: string;
    channel?: "RETAIL" | "WHOLESALE";
}

@injectable()
@singleton()
export class PurchaseRepository {
    /** Latest purchase whose number starts with `prefix`, used to derive the next sequence. */
    async findLatestByNumberPrefix(prefix: string): Promise<IPurchase | null> {
        return Purchase.findOne({ purchaseNumber: new RegExp(`^${prefix}`) }).sort({ purchaseNumber: -1 });
    }

    async create(data: Partial<IPurchase>, session?: ClientSession): Promise<IPurchase> {
        const purchase = new Purchase(data);
        await purchase.save({ session });
        return purchase;
    }

    /** Tenant-scoped lookup -- prevents one tenant from reading/mutating another tenant's purchase by id. */
    async findByIdForTenant(id: string, tenantId: string): Promise<IPurchase | null> {
        return Purchase.findOne({ _id: id, tenantId }).populate("vendorId").populate("items.productId");
    }

    async findAll(query: PurchaseListQuery): Promise<IPurchase[]> {
        const filter: Record<string, unknown> = {};
        if (query.tenantId) filter.tenantId = query.tenantId;
        else if (query.createdBy) filter.createdBy = query.createdBy;
        if (query.channel) filter.channel = query.channel;

        return Purchase.find(filter)
            .populate("vendorId", "name businessName")
            .populate("createdBy", "name")
            .sort({ createdAt: -1 });
    }

    async updateForTenant(id: string, tenantId: string, updateData: Partial<IPurchase>): Promise<IPurchase | null> {
        return Purchase.findOneAndUpdate({ _id: id, tenantId }, updateData, { new: true });
    }

    async deleteForTenant(id: string, tenantId: string): Promise<IPurchase | null> {
        return Purchase.findOneAndDelete({ _id: id, tenantId });
    }

    async findForTenant(id: string, tenantId: string, session?: ClientSession): Promise<IPurchase | null> {
        return Purchase.findOne({ _id: id, tenantId }).session(session ?? null);
    }

    async supplierTotals(tenantId: string) {
        return Purchase.aggregate([
            { $match: { tenantId, status: "COMPLETED" } },
            { $group: { _id: "$vendorId", totalAmount: { $sum: "$totalAmount" }, billCount: { $sum: 1 } } },
            { $lookup: { from: "suppliers", localField: "_id", foreignField: "_id", as: "supplier" } },
            { $unwind: "$supplier" },
            { $project: { _id: 1, supplierName: "$supplier.businessName", totalAmount: 1, billCount: 1 } },
            { $sort: { totalAmount: -1 } },
        ]);
    }

    async findCompletedByItem(tenantId: string, itemId: string, limit = 10): Promise<IPurchase[]> {
        return Purchase.find({ tenantId, "items.productId": itemId, status: "COMPLETED" })
            .sort({ date: -1 })
            .limit(limit)
            .populate("vendorId", "businessName shortCode");
    }
}
