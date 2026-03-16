var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { injectable, inject } from "tsyringe";
import { InventoryRepository } from '@smarterp/shared/repositories/InventoryRepository.js';
import Purchase from '@smarterp/core/modules/purchase/models/Purchase.js';
import { info, error } from '@smarterp/shared/config/logger.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
let StockAgingService = class StockAgingService {
    inventoryRepository;
    constructor(inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }
    /**
     * Calculates the age of the oldest unit in stock for each item using FIFO logic based on Purchase history.
     * Returns items that have stock older than the specified threshold (default 180 days).
     */
    async getAgingAnalysis(tenantId, thresholdDays = 180) {
        const items = await this.inventoryRepository.findAll(tenantId);
        // Filter only items with positive stock
        const inStockItems = items.filter((item) => item.stockQty > 0);
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
                    'items.productId': item._id,
                    status: 'COMPLETED',
                    // tenantId check is implicit if we filter by purchases created by user or linked to tenant
                    // Purchase model has tenantId.
                }).sort({ date: -1 }).lean();
                let accumulatedQty = 0;
                let oldestStockDate = item.createdAt; // Default to item creation if no purchase history found covers it
                // FIFO Logic:
                // We walk backwards from newest purchases.
                // The stock we have ON HAND (item.stockQty) is composed of these most recent purchases.
                // We keep adding up purchase quantities until we match or exceed current stockQty.
                // The purchase that tips us over the threshold contains the "oldest" unit we currently own.
                for (const purchase of purchases) {
                    const purchaseItem = purchase.items.find((pItem) => pItem.productId.toString() === item._id.toString());
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
                        category: item.category,
                        stockQty: item.stockQty,
                        costPrice: item.costPrice,
                        sellingPrice: item.sellingPrice,
                        valuation: item.stockQty * item.costPrice,
                        oldestStockDate,
                        ageInDays,
                        status: "DEAD_STOCK"
                    });
                }
            }
            catch (err) {
                error(`Error analyzing aging for item ${item.name}: ${err.message}`);
                // Continue to next item
            }
        }
        return deadStock.sort((a, b) => b.ageInDays - a.ageInDays);
    }
    async applyAction(itemId, tenantId, actionType, value) {
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
        }
        else if (actionType === 'REDUCE_MARGIN') {
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
};
StockAgingService = __decorate([
    injectable(),
    __param(0, inject(InventoryRepository)),
    __metadata("design:paramtypes", [InventoryRepository])
], StockAgingService);
export { StockAgingService };
