import { injectable, inject } from "tsyringe";
import { InventoryRepository } from "../../../repositories/InventoryRepository.js";
import { AppError } from "../../../utils/AppError.js";
import { IItem } from "../../../interfaces/IItem.js";
import { info } from "../../../config/logger.js";
import StockLog from "../models/StockLog.js";
import Item from "../models/Item.js";
import Brand from "../models/Brand.js";
import Size from "../models/Size.js";
import Color from "../models/Color.js";
import Shelf from "../models/Shelf.js";
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
        // Every filter below that needs its own `$or` (text search, shelf-code-or-bin-location)
        // is pushed onto this array and combined with `$and` instead of writing directly to
        // `query.$or`. A plain object can only hold one `$or` key, so when both a product search
        // AND a shelf filter were active at once, the second `query.$or = [...]` assignment used
        // to silently overwrite the first -- meaning "search=Shirt&shelf=A-03" actually ignored the
        // "Shirt" text search entirely and returned every item on shelf A-03 regardless of name.
        const andConditions: any[] = [];

        if (search) {
            andConditions.push({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { sku: { $regex: search, $options: 'i' } }
                ]
            });
        }

        if (queryParams.category && queryParams.category !== 'ALL') {
            query.category = { $regex: new RegExp(`^${queryParams.category}$`, 'i') };
        }

        if (queryParams.brand && queryParams.brand !== 'ALL') {
            query.brand = { $regex: new RegExp(`^${queryParams.brand}$`, 'i') };
        }

        if (queryParams.size && queryParams.size !== 'ALL') {
            query.size = queryParams.size;
        }

        if (queryParams.color && queryParams.color !== 'ALL') {
            query.color = { $regex: new RegExp(`^${queryParams.color}$`, 'i') };
        }

        const shelfFilter = queryParams.shelfCode || queryParams.shelf || queryParams.binLocation;
        if (shelfFilter && shelfFilter !== 'ALL') {
            andConditions.push({
                $or: [
                    { shelfCode: shelfFilter },
                    { binLocation: shelfFilter }
                ]
            });
        }

        if (queryParams.shelfType && queryParams.shelfType !== 'ALL') {
            query.shelfType = queryParams.shelfType;
        }

        // Same "available stock <= limit" definition used by getInventoryStats and
        // getLowStockItems, so the Items page's "Low Stock" filter, the metrics
        // card count, and the aging/alerts logic all agree on what counts as low.
        if (queryParams.lowStockOnly === 'true' || queryParams.lowStockOnly === true) {
            query.$expr = {
                $lte: [
                    { $subtract: ["$stockQty", { $ifNull: ["$reservedStock", 0] }] },
                    "$lowStockLimit"
                ]
            };
        }

        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        const [items, total] = await this.inventoryRepository.findWithPagination(tenantId, query, skip, limit);

        // findWithPagination reads via .lean() for performance, which means the
        // schema's `availableStock` virtual (stockQty - reservedStock) never gets attached --
        // virtuals are a Mongoose-document feature, lean() returns plain objects. Computing it
        // explicitly here is what makes a completed sale (which raises reservedStock, or lowers
        // stockQty once fulfilled) actually show up as reduced "available quantity" to a search
        // like Inventory Variant Search, instead of the raw on-hand count.
        const itemsWithAvailability = (items as any[]).map((item) => ({
            ...item,
            availableQuantity: Math.max((item.stockQty || 0) - (item.reservedStock || 0), 0)
        }));

        return {
            items: itemsWithAvailability,
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
        if (!Array.isArray(ids) || ids.length === 0) return 0;

        // Snapshot "before" quantities purely for accurate audit logging below.
        const before = await this.inventoryRepository.findByQuery({ _id: { $in: ids }, tenantId });
        const beforeMap = new Map(before.map((item: any) => [item._id.toString(), item.stockQty || 0]));

        // IMPORTANT: the actual mutation is done as a MongoDB aggregation-pipeline
        // update, so the read-modify-write of stockQty happens atomically inside
        // the database, per document. The previous implementation computed the new
        // quantity in application memory from a stale read and then $set it, which
        // silently lost concurrent changes (e.g. a POS sale landing in between) and
        // let SUBTRACT push stockQty below zero. $max clamps SUBTRACT/SET at 0.
        let pipeline: any[];
        if (type === 'ADD') {
            pipeline = [{ $set: { stockQty: { $add: ["$stockQty", adjustment] } } }];
        } else if (type === 'SUBTRACT') {
            pipeline = [{ $set: { stockQty: { $max: [0, { $subtract: ["$stockQty", adjustment] }] } } }];
        } else {
            // SET
            pipeline = [{ $set: { stockQty: { $max: [0, adjustment] } } }];
        }

        const result = await Item.updateMany(
            { _id: { $in: ids }, tenantId },
            pipeline
        );

        if (result.modifiedCount > 0) {
            const after = await this.inventoryRepository.findByQuery({ _id: { $in: ids }, tenantId });
            const stockLogs = after
                .map((item: any) => {
                    const oldQty = beforeMap.get(item._id.toString()) ?? item.stockQty;
                    const delta = item.stockQty - oldQty;
                    if (delta === 0) return null;
                    return {
                        itemId: item._id,
                        tenantId,
                        type: 'ADJUST',
                        delta,
                        finalQty: item.stockQty,
                        reason: `Bulk adjustment (${type})`,
                        performedBy: user._id
                    };
                })
                .filter((log): log is NonNullable<typeof log> => log !== null);

            if (stockLogs.length > 0) await StockLog.insertMany(stockLogs);
        }

        info(`Bulk stock adjustment (${type}: ${adjustment}) by ${user.name}: ${result.modifiedCount} items adjusted`);
        return result.modifiedCount;
    }

    async getDistinctCategories(tenantId: string): Promise<string[]> {
        try {
            const categories = await Item.distinct('category', { tenantId, category: { $exists: true, $nin: [null, ''] } });
            if (categories && Array.isArray(categories)) {
                return categories
                    .filter((c: any) => typeof c === 'string' && c.trim() !== '')
                    .sort((a: string, b: string) => a.localeCompare(b));
            }
        } catch (err: any) {
            console.warn('MongoDB distinct category query error:', err.message);
        }
        // No fabricated category names -- a tenant with no items yet (or a genuine
        // query failure) sees an empty list, not made-up categories that imply
        // stock exists when it doesn't.
        return [];
    }

    // Powers the Inventory Variant Search filter dropdowns (Brand/Size/Color/Shelf).
    // Sourced entirely from MongoDB -- the global Brand/Size/Color/Shelf catalog
    // collections (curated reference data, matching the same pattern already used
    // for BusinessSector/ProductCategory) unioned with whatever values this tenant's
    // own Items already carry, so a value in active use always shows up even before
    // anyone has gotten around to adding it to the catalog. Nothing here is a
    // hardcoded fallback list -- an empty catalog + no matching items returns an
    // empty array, not fabricated options.
    async getFilterOptions(tenantId: string): Promise<{
        brands: string[];
        sizes: string[];
        colors: string[];
        shelves: { shelfCode: string; shelfType: string }[];
    }> {
        try {
            const [catalogBrands, catalogSizes, catalogColors, catalogShelves, itemBrands, itemSizes, itemColors, itemShelfDocs] = await Promise.all([
                Brand.find({ isActive: true }).select('name').lean(),
                Size.find({ isActive: true }).select('name').lean(),
                Color.find({ isActive: true }).select('name').lean(),
                Shelf.find({ isActive: true }).select('shelfCode shelfType').lean(),
                Item.distinct('brand', { tenantId, brand: { $exists: true, $nin: [null, ''] } }),
                Item.distinct('size', { tenantId, size: { $exists: true, $nin: [null, ''] } }),
                Item.distinct('color', { tenantId, color: { $exists: true, $nin: [null, ''] } }),
                Item.find({
                    tenantId,
                    $or: [
                        { shelfCode: { $exists: true, $nin: [null, ''] } },
                        { binLocation: { $exists: true, $nin: [null, ''] } }
                    ]
                }).select('shelfCode binLocation shelfType').lean(),
            ]);

            const brandSet = new Set<string>([
                ...(catalogBrands as any[]).map((b) => b.name),
                ...(itemBrands as string[]).filter(Boolean)
            ]);
            const sizeSet = new Set<string>([
                ...(catalogSizes as any[]).map((s) => s.name),
                ...(itemSizes as string[]).filter(Boolean)
            ]);
            const colorSet = new Set<string>([
                ...(catalogColors as any[]).map((c) => c.name),
                ...(itemColors as string[]).filter(Boolean)
            ]);

            const shelfMap = new Map<string, string>();
            (catalogShelves as any[]).forEach((s) => shelfMap.set(s.shelfCode, s.shelfType));
            (itemShelfDocs as any[]).forEach((it) => {
                const code = it.shelfCode || it.binLocation;
                if (code && !shelfMap.has(code)) shelfMap.set(code, it.shelfType || 'FULL');
            });

            return {
                brands: Array.from(brandSet).sort((a, b) => a.localeCompare(b)),
                sizes: Array.from(sizeSet),
                colors: Array.from(colorSet).sort((a, b) => a.localeCompare(b)),
                shelves: Array.from(shelfMap.entries())
                    .map(([shelfCode, shelfType]) => ({ shelfCode, shelfType }))
                    .sort((a, b) => a.shelfCode.localeCompare(b.shelfCode))
            };
        } catch (err: any) {
            console.warn('Get Filter Options error:', err.message);
            return { brands: [], sizes: [], colors: [], shelves: [] };
        }
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
        reason: string = 'SALES',
        session?: any
    ): Promise<void> {
        const item: any = await this.inventoryRepository.findById(itemId, tenantId, session);
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
        }).session(session || null);

        await StockLog.create([{
            itemId: item._id,
            tenantId,
            type: reason === 'PURCHASE_RETURN' ? 'RETURN' : 'SALES',
            delta: -quantity,
            finalQty: item.stockQty - quantity,
            reason: reason,
            performedBy: user._id
        }], { session });
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
