import { injectable, inject } from "tsyringe";
import { InventoryRepository } from "../../../repositories/InventoryRepository.js";
import Purchase from "../../purchase/models/Purchase.js";
import { info, error } from "../../../config/logger.js";
import { AppError } from "../../../utils/AppError.js";

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
        const items = await this.inventoryRepository.findAllByTenant(tenantId);
        // Filter only items with positive stock
        const inStockItems = items.filter(item => item.stockQty > 0);

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
            } catch (err: any) {
                error(`Error analyzing aging for item ${item.name}: ${err.message}`);
                // Continue to next item
            }
        }

        return deadStock.sort((a, b) => b.ageInDays - a.ageInDays);
    }

    async applyAction(itemId: string, userId: string, actionType: 'CLEARANCE' | 'REDUCE_MARGIN', value?: number): Promise<any> {
        const item = await this.inventoryRepository.findById(itemId, userId);
        if (!item) {
            throw new AppError("Item not found", 404);
        }

        if (actionType === 'CLEARANCE') {
            // Move to Clearance Category
            // We append "Clearance" to category or set it directly? 
            // Better to change category to "Clearance".
            const updated = await this.inventoryRepository.update(itemId, userId, {
                category: "Clearance Sale"
            });
            info(`Item ${item.name} moved to Clearance by user ${userId}`);
            return updated;
        } else if (actionType === 'REDUCE_MARGIN') {
            // Reduce selling price
            // value is expected to be percentage reduction or flat amount? 
            // Let's assume percentage for now, or new price. 
            // Requirement says "prompt the owner to reduce the margin". Owner likely provides a new price.
            // Let's assume 'value' is the NEW Selling Price.

            if (!value || value <= 0) {
                throw new AppError("Valid new selling price is required", 400);
            }

            // Check if below cost (Allow it, but maybe warn? For now just allow)
            const updated = await this.inventoryRepository.update(itemId, userId, {
                sellingPrice: value
            });
            info(`Item ${item.name} price reduced to ${value} by user ${userId}`);
            return updated;
        }

        throw new AppError("Invalid action type", 400);
    }
}
