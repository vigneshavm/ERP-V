import { injectable, inject } from "tsyringe";
import { InventoryRepository } from "../../../repositories/InventoryRepository.js";
import { AppError } from "../../../utils/AppError.js";
import { IItem } from "../../../interfaces/IItem.js";
import { info } from "../../../config/logger.js";
import StockLog from "../models/StockLog.js";
import Item from "../models/Item.js";
import mongoose from "mongoose";

@injectable()
export class InventoryService {
    constructor(
        @inject(InventoryRepository) private inventoryRepository: InventoryRepository
    ) { }

    async addItem(itemData: any, tenantId: string, user: any): Promise<{ item: IItem, alerts: any[] }> {
        if (!itemData.name || !itemData.costPrice || !itemData.sellingPrice) {
            throw new AppError("Please fill all required fields", 400);
        }

        const existing = await this.inventoryRepository.findByName(itemData.name, tenantId);
        if (existing) {
            throw new AppError("Item already exists in your inventory", 400);
        }

        const item = await this.inventoryRepository.create({
            ...itemData,
            tenantId,
            addedBy: user._id
        });

        // Log initial stock if any
        if (item.stockQty > 0) {
            await StockLog.create({
                itemId: item._id,
                tenantId,
                type: 'INIT',
                delta: item.stockQty,
                finalQty: item.stockQty,
                reason: 'Initial stock on creation',
                performedBy: user._id
            });
        }

        info(`Item added by ${user.name}: ${item.name}`);
        const alerts = await this.checkStockAlerts(tenantId);

        return { item, alerts };
    }

    async getAllItemsWithPagination(tenantId: string, queryParams: any): Promise<any> {
        const page = parseInt(queryParams.page as string) || 1;
        const limit = parseInt(queryParams.limit as string) || 20;
        const skip = (page - 1) * limit;
        const search = queryParams.search || '';

        const query: any = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }

        if (queryParams.category && queryParams.category !== 'ALL') {
            query.category = queryParams.category;
        }

        const [items, total] = await this.inventoryRepository.findWithPagination(tenantId, query, skip, limit);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async getSingleItem(itemId: string, tenantId: string): Promise<IItem> {
        const item = await this.inventoryRepository.findById(itemId, tenantId);
        if (!item) {
            throw new AppError("Item not found or unauthorized", 404);
        }
        return item;
    }

    async getItemByBarcode(barcode: string, tenantId: string): Promise<IItem> {
        const items = await this.inventoryRepository.findByQuery({ barcode, tenantId });
        if (!items || items.length === 0) {
            throw new AppError("Item not found for this barcode", 404);
        }
        return items[0];
    }

    async updateItem(itemId: string, tenantId: string, updateData: any, user: any): Promise<{ updated: IItem, alerts: any[] }> {
        const item = await this.inventoryRepository.findById(itemId, tenantId);
        if (!item) {
            throw new AppError("Item not found or unauthorized", 404);
        }

        if (updateData.name && updateData.name !== item.name) {
            const existingName = await this.inventoryRepository.findByNameExcludingId(updateData.name, tenantId, itemId);
            if (existingName) {
                throw new AppError("Item name already exists in your inventory", 400);
            }
        }

        const oldStock = item.stockQty;
        // Strip protected fields
        const { _id, tenantId: tId, createdAt, updatedAt, ...safeUpdateData } = updateData;

        const updated = await this.inventoryRepository.update(itemId, tenantId, safeUpdateData);
        if (!updated) throw new AppError("Update failed", 500);

        // Log stock change if stockQty was modified
        if (updated.stockQty !== oldStock) {
            await StockLog.create({
                itemId: updated._id,
                tenantId,
                type: updated.stockQty > oldStock ? 'PURCHASE' : 'ADJUST',
                delta: updated.stockQty - oldStock,
                finalQty: updated.stockQty,
                reason: 'Manual quantity update',
                performedBy: user._id
            });
        }

        info(`Item updated by ${user.name}: ${updated.name}`);
        const alerts = await this.checkStockAlerts(tenantId);

        return { updated, alerts };
    }

    async deleteItem(itemId: string, tenantId: string, userName: string): Promise<IItem> {
        const item = await this.inventoryRepository.delete(itemId, tenantId);
        if (!item) {
            throw new AppError("Item not found or unauthorized", 404);
        }
        info(`Item deleted by ${userName}: ${item.name}`);
        return item;
    }

    async getLowStockItems(tenantId: string): Promise<IItem[]> {
        return this.inventoryRepository.getLowStockItems(tenantId);
    }

    async getInventoryStats(tenantId: string): Promise<any> {
        const stats = await Item.aggregate([
            { $match: { tenantId } },
            {
                $group: {
                    _id: null,
                    totalItems: { $sum: 1 },
                    totalValuation: { $sum: { $multiply: ["$stockQty", { $ifNull: ["$costPrice", 0] }] } },
                    lowStockCount: {
                        $sum: {
                            $cond: [
                                {
                                    $lte: [
                                        { $subtract: ["$stockQty", { $ifNull: ["$reservedStock", 0] }] },
                                        "$lowStockLimit"
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        return stats[0] || { totalItems: 0, totalValuation: 0, lowStockCount: 0 };
    }

    async checkStockAlerts(tenantId: string): Promise<any[]> {
        const lowStockItems = await this.getLowStockItems(tenantId);

        return lowStockItems.map(item => ({
            itemId: item._id,
            name: item.name,
            currentStock: item.stockQty - (item.reservedStock || 0),
            limit: item.lowStockLimit,
            message: `Low stock alert: ${item.name} is below limit (${item.lowStockLimit})`
        }));
    }

    async bulkAdjustStock(ids: string[], adjustment: number, type: 'ADD' | 'SUBTRACT' | 'SET', tenantId: string, user: any): Promise<number> {
        const itemsToAdjust = await this.inventoryRepository.findByQuery({ _id: { $in: ids }, tenantId });
        const bulkOps: any[] = [];
        const stockLogs: any[] = [];

        for (const item of itemsToAdjust) {
            let newQty = item.stockQty;
            let delta = 0;

            if (type === 'ADD') {
                delta = adjustment;
                newQty += adjustment;
            } else if (type === 'SUBTRACT') {
                delta = -adjustment;
                newQty -= adjustment;
            } else if (type === 'SET') {
                delta = adjustment - item.stockQty;
                newQty = adjustment;
            }

            if (delta !== 0) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: item._id },
                        update: { $set: { stockQty: newQty } }
                    }
                });

                stockLogs.push({
                    itemId: item._id,
                    tenantId,
                    type: 'ADJUST',
                    delta: delta,
                    finalQty: newQty,
                    reason: `Bulk adjustment (${type})`,
                    performedBy: user._id
                });
            }
        }

        if (bulkOps.length > 0) {
            await Item.bulkWrite(bulkOps);
            await StockLog.insertMany(stockLogs);
        }

        info(`Bulk stock adjustment (${type}: ${adjustment}) by ${user.name}: ${bulkOps.length} items adjusted`);
        return bulkOps.length;
    }

    async importItems(items: any[], tenantId: string, user: any): Promise<any> {
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new AppError("No items provided for import", 400);
        }

        const results: any = {
            imported: 0,
            updated: 0,
            skipped: 0,
            errors: [],
            validationErrors: []
        };

        const validUnits = [
            'pcs', 'kg', 'g', 'mg', 'l', 'ml', 'box', 'pack', 'bag', 'bottle',
            'can', 'dozen', 'm', 'cm', 'ft', 'unit', 'pair', 'set'
        ];

        // Match results by scanning names and SKUs
        const skusToFind = items.filter(i => i.sku).map(i => i.sku.toLowerCase().trim());
        const namesToFind = items.filter(i => i.name).map(i => i.name.toLowerCase().trim());

        const existingItems = await this.inventoryRepository.findByQuery({
            tenantId,
            $or: [
                { sku: { $in: skusToFind.map(s => new RegExp(`^${s}$`, 'i')) } },
                { name: { $in: namesToFind.map(n => new RegExp(`^${n}$`, 'i')) } }
            ]
        });

        const existingMap = new Map();
        existingItems.forEach((item: any) => {
            if (item.sku) existingMap.set(`sku:${item.sku.toLowerCase()}`, item);
            existingMap.set(`name:${item.name.toLowerCase()}`, item);
        });

        const bulkOps: any[] = [];
        const stockLogs: any[] = [];

        items.forEach((item, index) => {
            const rowNum = index + 1;
            const rowErrors: string[] = [];

            if (!item.name || item.name.toString().trim() === '') rowErrors.push('Item name is required');
            if (item.costPrice === undefined || item.costPrice === '' || isNaN(parseFloat(item.costPrice)) || parseFloat(item.costPrice) < 0) rowErrors.push('Valid cost price required');
            if (item.sellingPrice === undefined || item.sellingPrice === '' || isNaN(parseFloat(item.sellingPrice)) || parseFloat(item.sellingPrice) < 0) rowErrors.push('Valid selling price required');
            if (item.unit && !validUnits.includes(item.unit.toLowerCase().trim())) rowErrors.push(`Invalid unit: ${item.unit}`);

            if (rowErrors.length > 0) {
                results.validationErrors.push({ row: rowNum, itemName: item.name || '?', errors: rowErrors });
                results.skipped++;
                return;
            }

            let match = null;
            const skuKey = item.sku ? `sku:${item.sku.toLowerCase().trim()}` : null;
            const nameKey = item.name ? `name:${item.name.toLowerCase().trim()}` : null;

            if (skuKey && existingMap.has(skuKey)) match = existingMap.get(skuKey);
            else if (nameKey && existingMap.has(nameKey)) match = existingMap.get(nameKey);

            const qtyToAdd = item.stockQty ? parseInt(item.stockQty) : 0;

            if (match) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: match._id },
                        update: {
                            $inc: { stockQty: qtyToAdd },
                            $set: {
                                category: item.category?.trim() || match.category,
                                unit: item.unit ? item.unit.toLowerCase().trim() : match.unit,
                                costPrice: parseFloat(item.costPrice),
                                sellingPrice: parseFloat(item.sellingPrice),
                            }
                        }
                    }
                });

                if (qtyToAdd !== 0) {
                    stockLogs.push({
                        itemId: match._id,
                        tenantId,
                        type: 'ADJUST',
                        delta: qtyToAdd,
                        finalQty: (match.stockQty || 0) + qtyToAdd,
                        reason: 'Bulk Import update',
                        performedBy: user._id
                    });
                }
                results.updated++;
            } else {
                const tempId = new mongoose.Types.ObjectId();
                bulkOps.push({
                    insertOne: {
                        document: {
                            _id: tempId,
                            name: item.name.trim(),
                            sku: item.sku ? item.sku.trim() : undefined,
                            category: item.category?.trim(),
                            costPrice: parseFloat(item.costPrice),
                            sellingPrice: parseFloat(item.sellingPrice),
                            stockQty: qtyToAdd,
                            unit: item.unit ? item.unit.toLowerCase().trim() : 'pcs',
                            addedBy: user._id,
                            tenantId: tenantId
                        }
                    }
                });

                if (qtyToAdd > 0) {
                    stockLogs.push({
                        itemId: tempId,
                        tenantId,
                        type: 'INIT',
                        delta: qtyToAdd,
                        finalQty: qtyToAdd,
                        reason: 'Initial stock from bulk import',
                        performedBy: user._id
                    });
                }
                results.imported++;
            }
        });

        if (bulkOps.length > 0) {
            await Item.bulkWrite(bulkOps);
            if (stockLogs.length > 0) await StockLog.insertMany(stockLogs);
        }

        info(`Items imported by ${user.name}: ${results.imported} created, ${results.updated} updated`);
        const alerts = await this.checkStockAlerts(tenantId);

        return { ...results, alerts };
    }
    async addStock(
        itemId: string,
        quantity: number,
        rate: number,
        batchInfo: { batchNumber?: string, expiryDate?: Date, supplierId?: string },
        tenantId: string,
        user: any,
        session?: any
    ): Promise<void> {
        const item = await this.inventoryRepository.findById(itemId, tenantId, session);
        if (!item) throw new AppError("Item not found", 404);

        // 1. WAC Calculation
        // New Cost = ((Old Qty * Old Cost) + (New Qty * New Rate)) / (Old Qty + New Qty)
        const oldQty = item.stockQty || 0;
        const oldCost = item.costPrice || 0;
        const totalVal = (oldQty * oldCost) + (quantity * rate);
        const newTotalQty = oldQty + quantity;
        const newWac = newTotalQty > 0 ? totalVal / newTotalQty : rate;

        // 2. Prepare Update
        const updates: any = {
            $inc: { stockQty: quantity },
            $set: { costPrice: parseFloat(newWac.toFixed(2)) }
        };

        // 3. Batch Tracking
        if (batchInfo.batchNumber) {
            updates.$push = {
                batches: {
                    batchNumber: batchInfo.batchNumber,
                    expiryDate: batchInfo.expiryDate,
                    quantity: quantity,
                    costPrice: rate, // Store actual purchase cost for this batch
                    supplierId: batchInfo.supplierId,
                    receivedDate: new Date()
                }
            };
        }

        await Item.findByIdAndUpdate(itemId, updates).session(session || null);

        // 4. Log
        await StockLog.create([{
            itemId: item._id,
            tenantId,
            type: 'PURCHASE',
            delta: quantity,
            finalQty: newTotalQty,
            reason: `Purchase Recv: ${batchInfo.batchNumber || 'N/A'}`,
            performedBy: user._id
        }], { session });
    }

    async reduceStock(
        itemId: string,
        quantity: number,
        tenantId: string,
        user: any,
        reason: string = 'SALES'
    ): Promise<void> {
        const item: any = await this.inventoryRepository.findById(itemId, tenantId);
        if (!item) throw new AppError("Item not found", 404);

        if (item.stockQty < quantity) {
            throw new AppError(`Insufficient stock for ${item.name}. Available: ${item.stockQty}`, 400);
        }

        // 1. FIFO Logic for Batches
        let remainingToDeduct = quantity;
        const updatedBatches = [...(item.batches || [])].sort((a: any, b: any) =>
            new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime()
        );

        for (const batch of updatedBatches) {
            if (remainingToDeduct <= 0) break;

            if (batch.quantity >= remainingToDeduct) {
                batch.quantity -= remainingToDeduct;
                remainingToDeduct = 0;
            } else {
                remainingToDeduct -= batch.quantity;
                batch.quantity = 0;
            }
        }

        // Clean up empty batches
        const finalBatches = updatedBatches.filter((b: any) => b.quantity > 0);

        await Item.findByIdAndUpdate(itemId, {
            $inc: { stockQty: -quantity },
            $set: { batches: finalBatches }
        });

        await StockLog.create({
            itemId: item._id,
            tenantId,
            type: reason === 'PURCHASE_RETURN' ? 'RETURN' : 'SALES',
            delta: -quantity,
            finalQty: item.stockQty - quantity,
            reason: reason,
            performedBy: user._id
        });
    }
    async updateBatchCost(
        itemId: string,
        batchNumber: string,
        newCost: number,
        tenantId: string,
        user: any
    ): Promise<void> {
        const item: any = await this.inventoryRepository.findById(itemId, tenantId);
        if (!item) throw new AppError("Item not found", 404);

        const batchIndex = item.batches?.findIndex((b: any) => b.batchNumber === batchNumber);
        if (batchIndex === -1) throw new AppError(`Batch ${batchNumber} not found`, 404);

        const oldCost = item.batches[batchIndex].costPrice;

        // Update Batch Cost
        item.batches[batchIndex].costPrice = newCost;

        // Recalculate WAC (Weighted Average Cost)
        // This is complex because we need to know the cost of ALL batches to be accurate.
        // Assuming current WAC is based on current stock. We can re-derive it.
        // WAC = Sum(BatchQty * BatchCost) / TotalQty
        // BUT item.batches might not have all historical batches if they were consumed.
        // However, standard WAC is usually updated on receipt.
        // If we change history, we should update current WAC based on *existing* stock weight.

        if (item.stockQty > 0 && item.batches && item.batches.length > 0) {
            let totalValue = 0;
            let totalQty = 0;

            // Loop through existing batches to calc new WAC
            item.batches.forEach((b: any) => {
                totalValue += (b.quantity || 0) * (b.costPrice || 0);
                totalQty += (b.quantity || 0);
            });

            // If there's a discrepancy between batch qty sum and stockQty (due to untracked batches?), 
            // we should probably trust the calculated WAC from batches for the *batch tracked* portion.
            // Or simpler: Just Adjust WAC by the diff for the specific batch's *remaining* qty.

            // Let's use the re-calculation from available batches for best accuracy of *current* value.
            if (totalQty > 0) {
                item.costPrice = parseFloat((totalValue / totalQty).toFixed(2));
            }
        }

        await Item.findByIdAndUpdate(itemId, {
            $set: {
                batches: item.batches,
                costPrice: item.costPrice
            }
        });

        await StockLog.create({
            itemId: item._id,
            tenantId,
            type: 'ADJUST',
            delta: 0,
            finalQty: item.stockQty,
            reason: `Cost Revision: Batch ${batchNumber} (${oldCost} -> ${newCost})`,
            performedBy: user._id
        });
    }
}
