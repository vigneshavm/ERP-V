import { injectable } from "tsyringe";
import { FilterQuery, Types } from "mongoose";
import PurchaseReturn, { IPurchaseReturn } from "../models/PurchaseReturn.js";

/**
 * Who may see a purchase return: the tenant's returns, plus -- until
 * scripts/migrations/004-backfill-purchase-return-tenant.js has run -- the caller's own returns
 * that were created before returns carried a tenantId (the old behaviour scoped by createdBy).
 */
export interface PurchaseReturnScope {
    tenantId: Types.ObjectId;
    userId: Types.ObjectId;
}

const scopeFilter = (scope: PurchaseReturnScope): FilterQuery<IPurchaseReturn> => ({
    $or: [
        { tenantId: scope.tenantId },
        { tenantId: { $exists: false }, createdBy: scope.userId },
    ],
});

@injectable()
export class PurchaseReturnRepository {
    async create(data: Partial<IPurchaseReturn>): Promise<IPurchaseReturn> {
        return PurchaseReturn.create(data);
    }

    async list(scope: PurchaseReturnScope): Promise<IPurchaseReturn[]> {
        return PurchaseReturn.find(scopeFilter(scope))
            .populate("supplier", "businessName")
            .populate("grnId", "grnNumber")
            .sort({ createdAt: -1 });
    }

    async findById(scope: PurchaseReturnScope, id: string): Promise<IPurchaseReturn | null> {
        return PurchaseReturn.findOne({ _id: id, ...scopeFilter(scope) })
            .populate("supplier", "businessName")
            .populate("bill", "billNo")
            .populate("grnId", "grnNumber");
    }

    /** Unpopulated document, for reversal logic that needs the raw ids. */
    async findRawById(scope: PurchaseReturnScope, id: string): Promise<IPurchaseReturn | null> {
        return PurchaseReturn.findOne({ _id: id, ...scopeFilter(scope) });
    }

    async delete(scope: PurchaseReturnScope, id: string): Promise<void> {
        await PurchaseReturn.deleteOne({ _id: id, ...scopeFilter(scope) });
    }

    /**
     * Next `PR-00001`-style number. Uses the highest number among the tenant's returns and the
     * caller's legacy ones, so it never collides with the (returnId, createdBy) unique index.
     */
    async nextReturnId(scope: PurchaseReturnScope): Promise<string> {
        const latest = await PurchaseReturn.findOne({ ...scopeFilter(scope), returnId: /^PR-\d{5}$/ })
            .sort({ returnId: -1 })
            .select("returnId")
            .lean<{ returnId: string }>();
        const next = latest ? parseInt(latest.returnId.slice(3), 10) + 1 : 1;
        return `PR-${String(next).padStart(5, "0")}`;
    }

    /** Quantity of an item/batch already returned against a GRN (for the "can't return more than received" check). */
    async quantityReturnedAgainstGrn(grnId: Types.ObjectId, itemId: string, batchNumber: string): Promise<number> {
        const rows = await PurchaseReturn.aggregate([
            { $match: { grnId } },
            { $unwind: "$items" },
            { $match: { "items.itemId": new Types.ObjectId(itemId), "items.batchNumber": batchNumber } },
            { $group: { _id: null, total: { $sum: "$items.quantity" } } },
        ]);
        return rows[0]?.total || 0;
    }
}
