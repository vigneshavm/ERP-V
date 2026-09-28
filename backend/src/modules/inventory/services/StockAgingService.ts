import { injectable, inject } from "tsyringe";
import { InventoryRepository } from "../../../repositories/InventoryRepository.js";
import Purchase from "../../purchase/models/Purchase.js";
import { info, error } from "../../../config/logger.js";
import { AppError } from "../../../utils/AppError.js";
import { IItem } from "../../../interfaces/IItem.js";
import mongoose from "mongoose";
import Item from "../models/Item.js";
import StockLog from "../models/StockLog.js";
import { applyStockFilters, deadStock, lowStock, stockFilterOptions, stockStatus } from "./stockReports.js";
import { classifyLots, filterByPurchaseDate, pageRows, summarize, summarizeMonths, type StockAgeLot, type StockAgeQuery } from "./stockAgeBuckets.js";

@injectable()
export class StockAgingService {
    constructor(
        @inject(InventoryRepository) private inventoryRepository: InventoryRepository
    ) { }

    /**
     * Calculates the age of the oldest unit in stock for each item using FIFO logic based on Purchase history.
     * Returns items that have stock older than the specified threshold (default 180 days).
     */
    async getAgingAnalysis(tenantId: string, thresholdDays: number = 180): Promise<any[]> {
        const items = await this.inventoryRepository.findAll(tenantId);
        // Filter only items with positive stock
        const inStockItems = items.filter((item: IItem) => item.stockQty > 0);

        const deadStock = [];
        const now = new Date();

        // Batch fetch purchases could be optimized, but for now we'll query per item or valid set
        // Optimization: Fetch ALL purchases for this tenant once if dataset is small, or use aggregation.
        // For robustness, let's use aggregation to get purchase history for these items.
        // Actually, let's stick to the logic plan: Iterate for now (simpler logic, easier to debug). 
        // If performance issues arise, we optimize to aggregation.

        for (const item of inStockItems) {
            try {
                // Fetch purchases containing this item, sorted by date DESC (Newest first)
                // We assume 'status: COMPLETED' implies stock was added.
                const purchases = await Purchase.find({
                    tenantId, // was missing: without it another tenant's purchases of the same item id could set the age
                    'items.productId': item._id,
                    status: 'COMPLETED',
                }).sort({ date: -1 }).lean();

                let accumulatedQty = 0;
                let oldestStockDate = item.createdAt; // Default to item creation if no purchase history found covers it

                // FIFO Logic:
                // We walk backwards from newest purchases.
                // The stock we have ON HAND (item.stockQty) is composed of these most recent purchases.
                // We keep adding up purchase quantities until we match or exceed current stockQty.
                // The purchase that tips us over the threshold contains the "oldest" unit we currently own.

                for (const purchase of purchases) {
                    const purchaseItem = purchase.items.find((pItem: any) => pItem.productId.toString() === item._id.toString());
                    if (purchaseItem) {
                        accumulatedQty += purchaseItem.quantity;
                        if (accumulatedQty >= item.stockQty) {
                            oldestStockDate = purchase.date;
                            break;
                        }
                    }
                }

                // If we iterated all purchases and accumulatedQty < item.stockQty, 
                // it means the remaining stock is from opening balance or unrecorded sources (very old).
                // In that case, oldestStockDate remains item.createdAt (or could differ if we tracked opening stock separately).

                const ageInMilliseconds = now.getTime() - new Date(oldestStockDate).getTime();
                const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));

                if (ageInDays > thresholdDays) {
                    deadStock.push({
                        _id: item._id,
                        name: item.name,
                        sku: item.sku,
                        barcode: (item as any).barcode,
                        category: item.category,
                        stockQty: item.stockQty,
                        costPrice: item.costPrice,
                        sellingPrice: item.sellingPrice,
                        valuation: item.stockQty * item.costPrice,
                        oldestStockDate,
                        ageInDays,
                        // fields the aged-stock page reads
                        daysSinceLastSold: ageInDays,
                        lastSoldDate: oldestStockDate,
                        stock: item.stockQty,
                        value: item.stockQty * item.costPrice,
                        status: "DEAD_STOCK"
                    });
                }
            } catch (err: any) {
                error(`Error analyzing aging for item ${item.name}: ${err.message}`);
                // Continue to next item
            }
        }

        return deadStock.sort((a, b) => b.ageInDays - a.ageInDays);
    }

    /**
     * Month-bucket report for Mongo mode (same response shape as sqlStockAgeBuckets). Approximate: ERP items are
     * not guaranteed to be one-purchase-per-barcode, so each item's whole stock takes the date of the oldest
     * purchase still covering it (see getAgingAnalysis). A true FIFO split per purchase is a follow-up.
     */
    async getStockAgeBuckets(tenantId: string, q: StockAgeQuery): Promise<any> {
        const asOf = new Date().toISOString().slice(0, 10);
        const aged = await this.getAgingAnalysis(tenantId, -1);
        const lots: StockAgeLot[] = aged.map((a: any) => ({
            barcode: String(a.barcode ?? a.sku ?? a._id),
            name: String(a.name ?? ""),
            purchaseDate: a.oldestStockDate ? new Date(a.oldestStockDate).toISOString().slice(0, 10) : null,
            supplier: "",
            purchasedQty: 0,
            soldQty: 0,
            returnedQty: 0,
            remainingQty: Number(a.stockQty) || 0,
            costPrice: Number(a.costPrice) || 0,
        }));
        const byBarcode = new Map(aged.map((a: any) => [String(a.barcode ?? a.sku ?? a._id), a]));
        const { rows, from, to } = filterByPurchaseDate(classifyLots(lots, asOf), q);
        const { buckets, totals } = summarize(rows, asOf);
        const { items, pagination, bucket, selection, detail } = pageRows(rows, q);
        return {
            asOf,
            buckets,
            totals,
            bucket,
            selection,
            detail,
            months: summarizeMonths(rows),
            items: items.map((r) => {
                const a: any = byBarcode.get(r.barcode);
                return { ...r, _id: String(a?._id ?? r.barcode), category: a?.category ?? null, sellingPrice: a?.sellingPrice ?? null, inMirror: true };
            }),
            pagination,
            range: { from, to },
            checks: { multiPurchaseBarcodes: 0 },
            source: "mongo",
            approximate: true,
        };
    }

    /**
     * Mongo-mode snapshot for the stock reports: one row per in-stock Item. Purchase date = item creation
     * (approximate), last sale = newest SALES/SALE stock log for the item.
     */
    private async mongoReportRows(tenantId: string) {
        const tenant = new mongoose.Types.ObjectId(String(tenantId));
        const asOf = new Date().toISOString().slice(0, 10);
        const items: any[] = await Item.find({ tenantId: tenant, stockQty: { $gt: 0 } }, { name: 1, barcode: 1, sku: 1, category: 1, brand: 1, costPrice: 1, sellingPrice: 1, stockQty: 1, lowStockLimit: 1, createdAt: 1 }).lean();
        const sales: { _id: any; last: Date }[] = await StockLog.aggregate([
            { $match: { tenantId: tenant, type: { $in: ["SALES", "SALE"] } } },
            { $group: { _id: "$itemId", last: { $max: "$createdAt" } } },
        ]);
        const lastSale = new Map(sales.map((x) => [String(x._id), x.last]));
        const iso = (d: any): string | null => (d ? new Date(d).toISOString().slice(0, 10) : null);
        const lots: StockAgeLot[] = items.map((i) => ({
            barcode: String(i.barcode || i.sku || i._id),
            name: String(i.name ?? ""),
            purchaseDate: iso(i.createdAt),
            supplier: "",
            purchasedQty: 0,
            soldQty: 0,
            returnedQty: 0,
            remainingQty: Number(i.stockQty) || 0,
            costPrice: Number(i.costPrice) || 0,
            category: i.category || null,
            brand: i.brand || null,
            sellingPrice: Number(i.sellingPrice) || 0,
            lastSoldDate: iso(lastSale.get(String(i._id))),
        }));
        return { asOf, rows: classifyLots(lots, asOf) };
    }

    async getStockStatusReport(tenantId: string, q: any = {}): Promise<any> {
        const { asOf, rows } = await this.mongoReportRows(tenantId);
        return { asOf, source: "mongo", approximate: true, ...stockStatus(applyStockFilters(rows, q)) };
    }

    async getLowStockReport(tenantId: string, q: any): Promise<any> {
        const { asOf, rows } = await this.mongoReportRows(tenantId);
        return { asOf, source: "mongo", approximate: true, ...lowStock(applyStockFilters(rows, q), q) };
    }

    async getDeadStockReport(tenantId: string, q: any): Promise<any> {
        const { asOf, rows } = await this.mongoReportRows(tenantId);
        return { asOf, source: "mongo", approximate: true, ...deadStock(applyStockFilters(rows, q), asOf, q) };
    }

    async getStockFilterOptions(tenantId: string): Promise<any> {
        const { asOf, rows } = await this.mongoReportRows(tenantId);
        return { asOf, source: "mongo", approximate: true, ...stockFilterOptions(rows) };
    }

    async applyAction(itemId: string, tenantId: string, actionType: 'CLEARANCE' | 'REDUCE_MARGIN', value?: number): Promise<any> {
        const item = await this.inventoryRepository.findById(itemId, tenantId);
        if (!item) {
            throw new AppError("Item not found", 404);
        }

        if (actionType === 'CLEARANCE') {
            const updated = await this.inventoryRepository.update(itemId, tenantId, {
                category: "Clearance Sale"
            });
            info(`Item ${item.name} moved to Clearance by user in tenant ${tenantId}`);
            return updated;
        } else if (actionType === 'REDUCE_MARGIN') {
            if (!value || value <= 0) {
                throw new AppError("Valid new selling price is required", 400);
            }

            const updated = await this.inventoryRepository.update(itemId, tenantId, {
                sellingPrice: value
            });
            info(`Item ${item.name} price reduced to ${value} by user in tenant ${tenantId}`);
            return updated;
        }

        throw new AppError("Invalid action type", 400);
    }
}
