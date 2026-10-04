import { injectable, inject } from "tsyringe";
import { InventoryRepository } from "../../../repositories/InventoryRepository.js";
import { AppError } from "../../../utils/AppError.js";
import { IItem } from "../../../interfaces/IItem.js";
import { info, warn } from "../../../config/logger.js";
import StockLog from "../models/StockLog.js";
import Item from "../models/Item.js";
import { brandRepo, colorRepo, sizeRepo } from "../../../integrations/textilesoft/erpCatalogs.js";
import Shelf from "../models/Shelf.js";
import mongoose from "mongoose";
import { isSqlItemSource } from "../../../config/itemDataSource.js";
import * as sqlItems from "../../../integrations/textilesoft/sqlItemSource.js";
import type { TenantRef, IdRef } from '../../../interfaces/TenantRef.js';

@injectable()
export class InventoryService {
    constructor(
        @inject(InventoryRepository) private inventoryRepository: InventoryRepository
    ) { }

    async addItem(itemData: any, tenantId: string, user: any): Promise<{ item: IItem, alerts: any[] }> {
        if (isSqlItemSource()) throw new AppError("SQL item creation is unavailable for the current Textilesoft product/stock tables", 409);
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
        return sqlItems.listItems(tenantId, queryParams);
    }

    async getSingleItem(itemId: string, _tenantId: string): Promise<IItem> {
        const fresh = await sqlItems.findByKeyDirect({ barcode: itemId }) ?? await sqlItems.findByKeyDirect({ sku: itemId });
        if (!fresh) throw new AppError("Item not found in the SQL catalogue", 404);
        return fresh as unknown as IItem;
    }

    async getItemByBarcode(barcode: string, _tenantId: string): Promise<IItem> {
        const item = await sqlItems.findByKeyDirect({ barcode });
        if (!item) throw new AppError("Item not found for this barcode in the SQL catalogue", 404);
        return item as unknown as IItem;
    }

    async updateItem(itemId: string, tenantId: string, updateData: any, user: any): Promise<{ updated: IItem, alerts: any[] }> {
        if (isSqlItemSource()) throw new AppError("SQL item updates are unavailable for the current Textilesoft product/stock tables", 409);
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
        if (isSqlItemSource()) throw new AppError("SQL item deletion is unavailable for the current Textilesoft product/stock tables", 409);
        const item = await this.inventoryRepository.delete(itemId, tenantId);
        if (!item) {
            throw new AppError("Item not found or unauthorized", 404);
        }
        info(`Item deleted by ${userName}: ${item.name}`);
        return item;
    }

    async getLowStockItems(tenantId: string): Promise<IItem[]> {
        if (isSqlItemSource()) {
            return (await sqlItems.lowStockItems(tenantId)) as unknown as IItem[];
        }
        return this.inventoryRepository.getLowStockItems(tenantId);
    }

    async getInventoryStats(tenantId: string): Promise<any> {
        if (isSqlItemSource()) {
            return sqlItems.inventoryStats();
        }
        return this.getInventoryStatsFromMongo(tenantId);
    }

    private async getInventoryStatsFromMongo(tenantId: string): Promise<any> {
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

    /**
     * Stock movement ledger from StockLog (Mongo source): paged rows plus in/out totals.
     * The Textilesoft equivalent is `sqlStockMovements`; callers pick the source.
     */
    async getStockMovements(tenantId: string, q: Record<string, string | undefined>): Promise<any> {
        const page = Math.max(1, parseInt(q.page || '1') || 1);
        const limit = Math.min(200, Math.max(1, parseInt(q.limit || '50') || 50));
        const filter: Record<string, unknown> = { tenantId };
        if (q.type === 'IN') filter.delta = { $gt: 0 };
        if (q.type === 'OUT') filter.delta = { $lt: 0 };
        if (q.from || q.to) filter.createdAt = { ...(q.from ? { $gte: new Date(q.from) } : {}), ...(q.to ? { $lte: new Date(`${q.to}T23:59:59Z`) } : {}) };
        const [logs, total, agg] = await Promise.all([
            StockLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('itemId', 'name sku').lean(),
            StockLog.countDocuments(filter),
            StockLog.aggregate([{ $match: filter }, { $group: { _id: null, inQty: { $sum: { $cond: [{ $gt: ['$delta', 0] }, '$delta', 0] } }, outQty: { $sum: { $cond: [{ $lt: ['$delta', 0] }, { $abs: '$delta' }, 0] } } } }]),
        ]);
        return {
            items: (logs as any[]).map((l) => ({
                id: String(l._id),
                date: new Date(l.createdAt).toISOString().slice(0, 10),
                item: l.itemId?.name || 'Unknown item',
                sku: l.itemId?.sku || '',
                type: l.delta >= 0 ? 'IN' : 'OUT',
                qty: Math.abs(l.delta),
                ref: l.type,
                party: '',
                reason: l.reason || '',
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            totals: { transactions: total, inQty: agg[0]?.inQty ?? 0, outQty: agg[0]?.outQty ?? 0 },
            range: null,
            source: 'mongo',
        };
    }

    // Groups current stock by the city of the store it's held in (via Item.storeLevels ->
    // Store.city). Store already has a city field (used for GST/address purposes), so this
    // reuses existing data rather than introducing a new location dimension.
    async getStockByCity(tenantId: string): Promise<any[]> {
        if (isSqlItemSource()) return [];
        return Item.aggregate([
            { $match: { tenantId } },
            { $unwind: { path: "$storeLevels", preserveNullAndEmptyArrays: false } },
            {
                $lookup: {
                    from: "stores",
                    localField: "storeLevels.storeId",
                    foreignField: "_id",
                    as: "store"
                }
            },
            { $unwind: { path: "$store", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ["$store.city", "Unassigned"] },
                    totalQty: { $sum: "$storeLevels.qty" },
                    totalValue: { $sum: { $multiply: ["$storeLevels.qty", { $ifNull: ["$costPrice", 0] }] } },
                    itemCount: { $sum: 1 },
                    storeIds: { $addToSet: "$store._id" }
                }
            },
            {
                $project: {
                    _id: 0,
                    city: "$_id",
                    totalQty: 1,
                    totalValue: 1,
                    itemCount: 1,
                    storeCount: { $size: "$storeIds" }
                }
            },
            { $sort: { totalValue: -1 } }
        ]);
    }

    // Groups current stock by physical shelf/rack location, using the item's own shelfCode
    // (falling back to binLocation) -- both already exist on Item for warehouse bin partitioning.
    async getStockByRack(tenantId: string): Promise<any[]> {
        if (isSqlItemSource()) return [];
        return Item.aggregate([
            { $match: { tenantId } },
            {
                $addFields: {
                    rackLabel: { $ifNull: ["$shelfCode", { $ifNull: ["$binLocation", "Unassigned"] }] }
                }
            },
            {
                $group: {
                    _id: "$rackLabel",
                    totalQty: { $sum: "$stockQty" },
                    totalValue: { $sum: { $multiply: ["$stockQty", { $ifNull: ["$costPrice", 0] }] } },
                    itemCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    rack: "$_id",
                    totalQty: 1,
                    totalValue: 1,
                    itemCount: 1
                }
            },
            { $sort: { rack: 1 } }
        ]);
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
        if (isSqlItemSource()) throw new AppError("SQL stock adjustment is unavailable for the current Textilesoft stock tables", 409);
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
        if (isSqlItemSource()) return sqlItems.distinctItemCategories();
        try {
            const categories = await Item.distinct('category', { tenantId, category: { $exists: true, $nin: [null, ''] } });
            if (categories && Array.isArray(categories)) {
                return categories
                    .filter((c: any) => typeof c === 'string' && c.trim() !== '')
                    .sort((a: string, b: string) => a.localeCompare(b));
            }
        } catch (err: any) {
            warn('MongoDB distinct category query error:', err.message);
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
        if (isSqlItemSource()) {
            const first = await sqlItems.listItems(tenantId, { page: 1, limit: 1000 });
            const items = [...first.items];
            for (let page = 2; page <= Number(first.pagination.pages ?? 1); page++) {
                items.push(...(await sqlItems.listItems(tenantId, { page, limit: 1000 })).items);
            }
            const unique = (key: "brand" | "size" | "color") => [...new Set(items.map((item) => String(item[key] ?? "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
            return {
                brands: unique("brand"),
                sizes: unique("size"),
                colors: unique("color"),
                shelves: [...new Set(items.map((item) => String(item.shelfCode ?? item.binLocation ?? "").trim()).filter(Boolean))].map((shelfCode) => ({ shelfCode, shelfType: "FULL" })),
            };
        }
        try {
            const [catalogBrands, catalogSizes, catalogColors, catalogShelves, itemBrands, itemSizes, itemColors, itemShelfDocs] = await Promise.all([
                brandRepo.list(),
                sizeRepo.list(),
                colorRepo.list(),
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
                ...catalogBrands.map((b) => b.name),
                ...(itemBrands as string[]).filter(Boolean)
            ]);
            const sizeSet = new Set<string>([
                ...catalogSizes.map((s) => s.name),
                ...(itemSizes as string[]).filter(Boolean)
            ]);
            const colorSet = new Set<string>([
                ...catalogColors.map((c) => c.name),
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
            warn('Get Filter Options error:', err.message);
            return { brands: [], sizes: [], colors: [], shelves: [] };
        }
    }

    async importItems(items: any[], tenantId: string, user: any): Promise<any> {
        if (isSqlItemSource()) throw new AppError("SQL item import is unavailable for the current Textilesoft product/stock tables", 409);
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
        if (isSqlItemSource()) throw new AppError("SQL stock receiving is unavailable for the existing Textilesoft stock tables", 409);
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
        tenantId: TenantRef,
        user: any,
        reason: string = 'SALES',
        session?: any
    ): Promise<void> {
        if (isSqlItemSource()) throw new AppError("SQL stock issuing is unavailable for the existing Textilesoft stock tables", 409);
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
    /**
     * Reduce stock from ONE specifically named batch, rather than reduceStock's FIFO sweep
     * across every batch. For a GRN-wise/lot-wise purchase return, the returned goods came
     * from a specific goods receipt -- deducting FIFO-oldest-first would silently reduce the
     * wrong batch (and its cost basis) if other purchases of the same item happened since.
     */
    async reduceStockFromBatch(
        itemId: string,
        quantity: number,
        batchNumber: string,
        tenantId: string,
        user: any,
        reason: string = 'PURCHASE_RETURN',
        session?: any
    ): Promise<void> {
        if (isSqlItemSource()) throw new AppError("SQL batch stock issuing is unavailable for the existing Textilesoft stock tables", 409);
        const item: any = await this.inventoryRepository.findById(itemId, tenantId, session);
        if (!item) throw new AppError("Item not found", 404);

        const batches = [...(item.batches || [])];
        const batchIndex = batches.findIndex((b: any) => b.batchNumber === batchNumber);
        if (batchIndex === -1) {
            throw new AppError(`Batch ${batchNumber} not found on ${item.name}`, 404);
        }
        if (batches[batchIndex].quantity < quantity) {
            throw new AppError(
                `Cannot return ${quantity} from batch ${batchNumber} -- only ${batches[batchIndex].quantity} remaining in that batch`,
                400
            );
        }
        if (item.stockQty < quantity) {
            throw new AppError(`Insufficient stock for ${item.name}. Available: ${item.stockQty}`, 400);
        }

        batches[batchIndex] = { ...batches[batchIndex], quantity: batches[batchIndex].quantity - quantity };
        const finalBatches = batches.filter((b: any) => b.quantity > 0);

        await Item.findByIdAndUpdate(itemId, {
            $inc: { stockQty: -quantity },
            $set: { batches: finalBatches }
        }).session(session || null);

        await StockLog.create([{
            itemId: item._id,
            tenantId,
            type: 'RETURN',
            delta: -quantity,
            finalQty: item.stockQty - quantity,
            reason: `${reason}: Batch ${batchNumber}`,
            performedBy: user._id
        }], { session });
    }

    /**
     * Record stock lost outside the normal sale/purchase-return flow -- damage or unexplained
     * shrinkage. Distinct StockLog types (DAMAGE/MISSING) so these show up separately from
     * ordinary ADJUST/SALES entries in stock history and reporting. Mirrors reduceStock's FIFO
     * batch sweep so batch-level quantities (and therefore cost-basis reporting) stay accurate.
     */
    async writeOffStock(
        itemId: string,
        quantity: number,
        cause: 'DAMAGE' | 'MISSING',
        reason: string,
        tenantId: string,
        user: any
    ): Promise<void> {
        if (isSqlItemSource()) throw new AppError("SQL stock write-off is unavailable for the existing Textilesoft stock tables", 409);
        if (!quantity || quantity <= 0) {
            throw new AppError("Quantity must be greater than zero", 400);
        }

        const item: any = await this.inventoryRepository.findById(itemId, tenantId);
        if (!item) throw new AppError("Item not found", 404);

        if (item.stockQty < quantity) {
            throw new AppError(`Insufficient stock for ${item.name}. Available: ${item.stockQty}`, 400);
        }

        // FIFO sweep across batches, same approach as reduceStock, so batch quantities
        // (and their cost basis) stay in sync with the item's total stockQty.
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

        const finalBatches = updatedBatches.filter((b: any) => b.quantity > 0);

        await Item.findByIdAndUpdate(itemId, {
            $inc: { stockQty: -quantity },
            $set: { batches: finalBatches }
        });

        await StockLog.create({
            itemId: item._id,
            tenantId,
            type: cause,
            delta: -quantity,
            finalQty: item.stockQty - quantity,
            reason: reason || (cause === 'DAMAGE' ? 'Stock damaged' : 'Stock missing/shrinkage'),
            performedBy: user._id
        });

        info(`Stock write-off (${cause}) by ${user.name}: ${item.name} x${quantity}`);
    }

    async updateBatchCost(
        itemId: string,
        batchNumber: string,
        newCost: number,
        tenantId: string,
        user: any
    ): Promise<void> {
        if (isSqlItemSource()) throw new AppError("SQL batch cost updates are unavailable for the existing Textilesoft stock tables", 409);
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

    /**
     * Stock effect of returning one serialized unit to its supplier: stockQty - 1 and a RETURN
     * stock-log line. (The unit's own status is set by SerializedUnitService.updateStatus.)
     */
    async removeReturnedUnit(itemId: string, tenantId: TenantRef, serialNumber: string, userId: IdRef): Promise<void> {
        if (isSqlItemSource()) throw new AppError("SQL return stock adjustments are unavailable for the existing Textilesoft stock tables", 409);
        const currentItem: any = await Item.findOne({ _id: itemId, tenantId });
        await Item.updateOne({ _id: itemId, tenantId }, { $inc: { stockQty: -1 } });
        await StockLog.create({
            itemId,
            tenantId,
            type: 'RETURN',
            delta: -1,
            finalQty: (currentItem?.stockQty || 1) - 1,
            reason: `PURCHASE_RETURN: Unit ${serialNumber}`,
            performedBy: userId,
        });
    }

    /** Reverses removeReturnedUnit: the unit is back on the shelf (stockQty + 1, RETURN log line). */
    async restoreReturnedUnit(itemId: string, tenantId: TenantRef, serialNumber: string, userId: IdRef): Promise<void> {
        if (isSqlItemSource()) throw new AppError("SQL return stock adjustments are unavailable for the existing Textilesoft stock tables", 409);
        const updated: any = await Item.findOneAndUpdate({ _id: itemId, tenantId }, { $inc: { stockQty: 1 } }, { new: true });
        if (!updated) throw new AppError("Item not found", 404, "ITEM_NOT_FOUND");
        await StockLog.create({
            itemId,
            tenantId,
            type: 'RETURN',
            delta: 1,
            finalQty: updated.stockQty,
            reason: `PURCHASE_RETURN_REVERSED: Unit ${serialNumber}`,
            performedBy: userId,
        });
    }

    /**
     * Reverses reduceStockFromBatch for a deleted purchase return: puts `quantity` back into the
     * batch, re-creating the batch entry (at `costPrice`) if the return had emptied and removed it.
     */
    async restoreBatchFromReturn(
        itemId: string,
        quantity: number,
        batchNumber: string,
        costPrice: number,
        supplierId: IdRef | undefined,
        tenantId: TenantRef,
        userId: IdRef,
    ): Promise<void> {
        if (isSqlItemSource()) throw new AppError("SQL return stock adjustments are unavailable for the existing Textilesoft stock tables", 409);
        const item: any = await Item.findOne({ _id: itemId, tenantId });
        if (!item) throw new AppError("Item not found", 404, "ITEM_NOT_FOUND");
        const batches = [...(item.batches || [])].map((b: any) => (b.toObject ? b.toObject() : b));
        const index = batches.findIndex((b: any) => b.batchNumber === batchNumber);
        if (index === -1) {
            batches.push({ batchNumber, quantity, costPrice, supplierId, receivedDate: new Date() });
        } else {
            batches[index] = { ...batches[index], quantity: (batches[index].quantity || 0) + quantity };
        }
        await Item.updateOne({ _id: itemId, tenantId }, { $inc: { stockQty: quantity }, $set: { batches } });
        await StockLog.create({
            itemId,
            tenantId,
            type: 'RETURN',
            delta: quantity,
            finalQty: (item.stockQty || 0) + quantity,
            reason: `PURCHASE_RETURN_REVERSED: Batch ${batchNumber}`,
            performedBy: userId,
        });
    }

    /**
     * Throws 400 INSUFFICIENT_STOCK unless every item has at least the requested quantity
     * (quantities for the same item are summed). Read-only: call it before any stock is moved.
     */
    async assertStockAvailable(lines: { itemId: string; quantity: number; label?: string }[], tenantId: TenantRef): Promise<void> {
        if (isSqlItemSource()) {
            for (const line of lines) {
                const item = await sqlItems.findByKeyDirect({ barcode: line.itemId }) ?? await sqlItems.findByKeyDirect({ sku: line.itemId });
                if (!item || Number(item.stockQty ?? 0) < line.quantity) {
                    throw new AppError(`Insufficient SQL stock for ${line.label || line.itemId}`, 400);
                }
            }
            return;
        }
        const needed = new Map<string, { quantity: number; label?: string }>();
        for (const line of lines) {
            const prev = needed.get(line.itemId);
            needed.set(line.itemId, { quantity: (prev?.quantity || 0) + line.quantity, label: prev?.label || line.label });
        }
        for (const [itemId, { quantity, label }] of needed) {
            const item: any = await Item.findOne({ _id: itemId, tenantId }).select("name stockQty").lean();
            if (!item) throw new AppError(`Item ${label || itemId} not found`, 404, "ITEM_NOT_FOUND");
            if ((item.stockQty || 0) < quantity) {
                throw new AppError(`Not enough stock of ${item.name}: need ${quantity}, have ${item.stockQty || 0}`, 400, "INSUFFICIENT_STOCK", { itemId, needed: quantity, available: item.stockQty || 0 });
            }
        }
    }

    /**
     * Moves quantity between two warehouses of the same item (total stockQty unchanged) and logs a
     * TRANSFER line. Throws 400 INSUFFICIENT_WAREHOUSE_STOCK if the source warehouse has too little.
     */
    async moveBetweenWarehouses(
        itemId: string,
        quantity: number,
        fromWarehouseId: string,
        toWarehouseId: string,
        tenantId: TenantRef,
        reason: string,
        userId: IdRef,
        session?: any,
    ): Promise<void> {
        if (isSqlItemSource()) throw new AppError("SQL warehouse transfers are unavailable for the existing Textilesoft stock tables", 409);
        const item: any = await Item.findOne({ _id: itemId, tenantId }).session(session || null);
        if (!item) throw new AppError(`Item not found: ${itemId}`, 404, "ITEM_NOT_FOUND");

        const levels = [...(item.warehouseLevels || [])].map((l: any) => (l.toObject ? l.toObject() : l));
        const fromIdx = levels.findIndex((l: any) => l.warehouseId === fromWarehouseId);
        const available = fromIdx >= 0 ? levels[fromIdx].qty : 0;
        if (available < quantity) {
            throw new AppError(
                `Not enough ${item.name} in warehouse ${fromWarehouseId}: available ${available}, requested ${quantity}`,
                400,
                "INSUFFICIENT_WAREHOUSE_STOCK",
                { itemId, available, requested: quantity },
            );
        }
        levels[fromIdx] = { ...levels[fromIdx], qty: available - quantity };
        const toIdx = levels.findIndex((l: any) => l.warehouseId === toWarehouseId);
        if (toIdx >= 0) levels[toIdx] = { ...levels[toIdx], qty: levels[toIdx].qty + quantity };
        else levels.push({ warehouseId: toWarehouseId, qty: quantity });

        await Item.updateOne(
            { _id: itemId, tenantId },
            { $set: { warehouseLevels: levels.filter((l: any) => l.qty > 0 || l.warehouseId === toWarehouseId) } },
            { session },
        );
        await StockLog.create([{
            itemId,
            tenantId,
            type: 'TRANSFER',
            delta: 0,
            finalQty: item.stockQty,
            reason,
            performedBy: userId,
        }], { session });
    }
}
