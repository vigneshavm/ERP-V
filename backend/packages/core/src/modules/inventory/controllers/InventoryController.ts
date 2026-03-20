import { Request, Response } from 'express';
import { singleton, inject } from 'tsyringe';
import mongoose from 'mongoose';

import { InventoryService } from '../services/InventoryService.js';
import { StockAgingService } from '../services/StockAgingService.js';
import Item from '../models/Item.js';
import ReprintQueue from '../models/ReprintQueue.js';

import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created } from '@smarterp/shared/utils/response.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { info } from '@smarterp/shared/config/logger.js';

/**
 * InventoryController
 *
 * Pattern applied here (use this as the reference for all other controllers):
 *
 *   1. asyncHandler wraps every method — no try/catch, errors propagate to
 *      the global errorHandler automatically. AppErrors become typed 4xx
 *      responses; unhandled exceptions become 500s.
 *
 *   2. req.tenantId / req.user are typed via the global Express augmentation
 *      (packages/shared/src/types/express.d.ts) — no more `(req as any)`.
 *
 *   3. ok() / created() produce a consistent JSON envelope across all modules:
 *      { success: true, data: ... }  instead of ad-hoc res.status().json().
 */
@singleton()
export class InventoryController {
    constructor(
        @inject(InventoryService) private inventoryService: InventoryService,
        @inject(StockAgingService) private stockAgingService: StockAgingService,
    ) {}

    // ── CRUD ─────────────────────────────────────────────────────────────────

    public addItem = asyncHandler(async (req: Request, res: Response) => {
        const result = await this.inventoryService.addItem(req.body, req.tenantId!, req.user!);
        created(res, result);
    });

    public getAllItems = asyncHandler(async (req: Request, res: Response) => {
        const result = await this.inventoryService.getAllItemsWithPagination(req.tenantId!, req.query);
        ok(res, result);
    });

    public getSingleItem = asyncHandler(async (req: Request, res: Response) => {
        const item = await this.inventoryService.getSingleItem(req.params.id, req.tenantId!);
        ok(res, item);
    });

    public updateItem = asyncHandler(async (req: Request, res: Response) => {
        const result = await this.inventoryService.updateItem(
            req.params.id, req.tenantId!, req.body, req.user!,
        );
        ok(res, result);
    });

    public deleteItem = asyncHandler(async (req: Request, res: Response) => {
        await this.inventoryService.deleteItem(req.params.id, req.tenantId!, req.user!);
        ok(res, null, 'Item deleted');
    });

    // ── Bulk operations ───────────────────────────────────────────────────────

    public importItems = asyncHandler(async (req: Request, res: Response) => {
        const result = await this.inventoryService.importItems(
            req.body.items, req.tenantId!, req.user!,
        );
        ok(res, result);
    });

    public bulkAdjustStock = asyncHandler(async (req: Request, res: Response) => {
        const { ids, adjustment, type } = req.body;
        const modifiedCount = await this.inventoryService.bulkAdjustStock(
            ids, adjustment, type, req.tenantId!, req.user!,
        );
        ok(res, { modifiedCount }, `${modifiedCount} items adjusted successfully`);
    });

    public bulkUpdateCategory = asyncHandler(async (req: Request, res: Response) => {
        const { ids, category } = req.body;
        const modifiedCount = await this.inventoryService.bulkUpdateCategory(
            ids, category, req.tenantId!, req.user!,
        );
        ok(res, { modifiedCount }, `${modifiedCount} items updated successfully`);
    });

    public deleteItemsBatch = asyncHandler(async (req: Request, res: Response) => {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new AppError('No IDs provided for deletion', 400);
        }
        const deletedCount = await this.inventoryService.deleteItemsBatch(
            ids, req.tenantId!, req.user!,
        );
        ok(res, { deletedCount }, `${deletedCount} items deleted successfully`);
    });

    // ── Item-level actions ────────────────────────────────────────────────────

    public duplicateItem = asyncHandler(async (req: Request, res: Response) => {
        const item = await this.inventoryService.getSingleItem(req.params.id, req.tenantId!);
        const { _id, createdAt, updatedAt, ...itemData } = (item as any).toObject();

        itemData.name    = `${itemData.name} (Copy)`;
        itemData.sku     = itemData.sku ? `${itemData.sku}-COPY` : undefined;
        itemData.addedBy = req.user!._id;

        const result = await this.inventoryService.addItem(itemData, req.tenantId!, req.user!);
        created(res, result.item);
    });

    public toggleItemStatus = asyncHandler(async (req: Request, res: Response) => {
        const item = await this.inventoryService.toggleItemStatus(
            req.params.id, req.tenantId!, req.user!,
        );
        ok(res, item);
    });

    // ── Stock movements ───────────────────────────────────────────────────────

    public getItemStockHistory = asyncHandler(async (req: Request, res: Response) => {
        const history = await mongoose.model('StockLog')
            .find({ itemId: req.params.id, tenantId: req.tenantId! })
            .sort({ createdAt: -1 })
            .lean();
        ok(res, history);
    });

    public recordMovement = asyncHandler(async (req: Request, res: Response) => {
        await this.inventoryService.recordMovement(
            req.params.id, req.body, req.tenantId!, req.user!,
        );
        ok(res, null, 'Stock movement recorded successfully');
    });

    // ── Analytics ────────────────────────────────────────────────────────────

    public getInventoryStats = asyncHandler(async (req: Request, res: Response) => {
        const stats = await this.inventoryService.getInventoryStats(req.tenantId!);
        ok(res, stats);
    });

    public getLowStockItems = asyncHandler(async (req: Request, res: Response) => {
        const items = await this.inventoryService.getLowStockItems(req.tenantId!);
        ok(res, items);
    });

    public getStockAgingReport = asyncHandler(async (req: Request, res: Response) => {
        const report = await this.stockAgingService.getAgingAnalysis(req.tenantId!);
        ok(res, report);
    });

    public performAgingAction = asyncHandler(async (req: Request, res: Response) => {
        const { itemId, action, value } = req.body;
        const result = await this.stockAgingService.applyAction(
            itemId, req.tenantId!, action, value,
        );
        ok(res, result, 'Action applied successfully');
    });

    // ── Price updates + reprint queue ─────────────────────────────────────────

    public batchPriceUpdate = asyncHandler(async (req: Request, res: Response) => {
        const { sku, newPrice } = req.body;

        const item = await Item.findOne({ sku, tenantId: req.tenantId! });
        if (!item) throw new AppError('Item not found', 404);

        const oldPrice = item.sellingPrice;
        item.sellingPrice = newPrice;
        await item.save();

        // Upsert the reprint queue entry
        let queue = await ReprintQueue.findOne({ tenantId: req.tenantId! });
        if (!queue) queue = new ReprintQueue({ tenantId: req.tenantId!, items: [] });

        const existingIndex = queue.items.findIndex(
            (i: any) => i.itemId.toString() === (item._id as mongoose.Types.ObjectId).toString(),
        );

        if (existingIndex > -1) {
            queue.items[existingIndex].newPrice  = newPrice;
            queue.items[existingIndex].quantity  = item.stockQty || 0;
        } else {
            queue.items.push({
                itemId:   item._id as mongoose.Types.ObjectId,
                itemName: item.name,
                sku:      item.sku as string,
                oldPrice,
                newPrice,
                quantity: item.stockQty || 0,
                reason:   'Price Hike Batch Update',
            });
        }
        await queue.save();

        info(`Batch price update: ${item.sku} → ${newPrice} by ${req.user!._id}`);
        ok(res, { item, queue }, 'Price updated and queued for reprint');
    });

    public getReprintQueue = asyncHandler(async (req: Request, res: Response) => {
        const queue = await ReprintQueue.findOne({ tenantId: req.tenantId! });
        ok(res, queue ? queue.items : []);
    });

    public clearReprintQueue = asyncHandler(async (req: Request, res: Response) => {
        await ReprintQueue.findOneAndUpdate(
            { tenantId: req.tenantId! },
            { $set: { items: [] } },
        );
        ok(res, null, 'Reprint queue cleared');
    });
}
