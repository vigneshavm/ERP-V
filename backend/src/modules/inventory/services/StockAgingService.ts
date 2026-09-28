import { injectable, inject } from "tsyringe";
import { InventoryRepository } from "../../../repositories/InventoryRepository.js";
import Purchase from "../../purchase/models/Purchase.js";
import { info, error } from "../../../config/logger.js";
import { AppError } from "../../../utils/AppError.js";
import mongoose from "mongoose";
import Item from "../models/Item.js";
import StockLog from "../models/StockLog.js";
import { applyStockFilters, deadStock, lowStock, stockFilterOptions, stockStatus } from "./stockReports.js";
import { classifyLots, filterByPurchaseDate, pageRows, summarize, summarizeMonths, type StockAgeLot, type StockAgeQuery } from "./stockAgeBuckets.js";
import { todayIst, istDate } from "../../../utils/dateUtils.js";

@injectable()
export class StockAgingService {
    constructor(
        @inject(InventoryRepository) private inventoryRepository: InventoryRepository
    ) { }

    /**
     * Calculates the age of the oldest unit in stock for each item using FIFO logic based on Purchase history.
     * Returns items that have stock older than the specified threshold (default 180 days).
     * 
     * OPTIMIZED: Uses aggregation pipeline to fetch all purchases in one query instead of N+1 queries.
     * This reduces database load from O(n) to O(1) + single aggregation.
     */
    async getAgingAnalysis(tenantId: string, thresholdDays: number = 180): Promise<any[]> {
        const now = new Date();
        const now_ms = now.getTime();

        // Step 1: Fetch only items with positive stock (with field projection)
        const inStockItems = await Item.find(
            { tenantId, stockQty: { $gt: 0 } },
            { _id: 1, name: 1, sku: 1, barcode: 1, category: 1, stockQty: 1, costPrice: 1, sellingPrice: 1, createdAt: 1 }
        ).lean();

        // Step 2: Get ALL purchases for this tenant and items in ONE query (not N queries)
        const purchases = await Purchase.find(
            {
                tenantId,
                'items.productId': { $in: inStockItems.map((i) => i._id) },
                status: 'COMPLETED',
            },
            { items: 1, date: 1, productId: 1 }
        ).sort({ date: -1 }).lean();

        // Step 3: Build a map of item ID -> purchases for O(1) lookup
        const purchasesByItemId = new Map<string, any[]>();
        for (const purchase of purchases) {
            for (const item of purchase.items || []) {
                const itemIdStr = String(item.productId);
                if (!purchasesByItemId.has(itemIdStr)) {
                    purchasesByItemId.set(itemIdStr, []);
                }
                purchasesByItemId.get(itemIdStr)!.push(purchase);
            }
        }

        // Step 4: Calculate aging for each item using FIFO logic
        const deadStock = [];
        for (const item of inStockItems) {
            try {
                const itemPurchases = purchasesByItemId.get(String(item._id)) || [];
                let accumulatedQty = 0;
                let oldestStockDate = item.createdAt;

                // FIFO Logic: Walk backwards from newest purchases
                for (const purchase of itemPurchases) {
                    const purchaseItem = purchase.items.find((pItem: any) => pItem.productId.toString() === item._id.toString());
                    if (purchaseItem) {
                        accumulatedQty += purchaseItem.quantity;
                        if (accumulatedQty >= item.stockQty) {
                            oldestStockDate = purchase.date;
                            break;
                        }
                    }
                }

                const ageInDays = Math.floor((now_ms - new Date(oldestStockDate).getTime()) / (1000 * 60 * 60 * 24));

                if (ageInDays > thresholdDays) {
                    deadStock.push({
                        _id: item._id,
                        name: item.name,
                        sku: item.sku,
                        barcode: item.barcode,
                        category: item.category,
                        stockQty: item.stockQty,
                        costPrice: item.costPrice,
                        sellingPrice: item.sellingPrice,
                        valuation: item.stockQty * item.costPrice,
                        oldestStockDate,
                        ageInDays,
                        daysSinceLastSold: ageInDays,
                        lastSoldDate: oldestStockDate,
                        stock: item.stockQty,
                        value: item.stockQty * item.costPrice,
                        status: "DEAD_STOCK"
                    });
                }
            } catch (err: any) {
                error(`Error analyzing aging for item ${item.name}: ${err.message}`);
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
        const asOf = todayIst();
        const aged = await this.getAgingAnalysis(tenantId, -1);
        const lots: StockAgeLot[] = aged.map((a: any) => ({
            barcode: String(a.barcode ?? a.sku ?? a._id),
            name: String(a.name ?? ""),
            purchaseDate: a.oldestStockDate ? istDate(new Date(a.oldestStockDate)) : null,
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
        const asOf = todayIst();
        const items: any[] = await Item.find({ tenantId: tenant, stockQty: { $gt: 0 } }, { name: 1, barcode: 1, sku: 1, category: 1, brand: 1, costPrice: 1, sellingPrice: 1, stockQty: 1, lowStockLimit: 1, createdAt: 1 }).lean();
        const sales: { _id: any; last: Date }[] = await StockLog.aggregate([
            { $match: { tenantId: tenant, type: { $in: ["SALES", "SALE"] } } },
            { $group: { _id: "$itemId", last: { $max: "$createdAt" } } },
        ]);
        const lastSale = new Map(sales.map((x) => [String(x._id), x.last]));
        const iso = (d: any): string | null => (d ? istDate(new Date(d)) : null);
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
