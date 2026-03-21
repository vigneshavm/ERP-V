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
let InventoryController = class InventoryController {
    inventoryService;
    stockAgingService;
    constructor(inventoryService, stockAgingService) {
        this.inventoryService = inventoryService;
        this.stockAgingService = stockAgingService;
    }
    // ── CRUD ─────────────────────────────────────────────────────────────────
    addItem = asyncHandler(async (req, res) => {
        const result = await this.inventoryService.addItem(req.body, req.tenantId, req.user);
        created(res, result);
    });
    getAllItems = asyncHandler(async (req, res) => {
        const result = await this.inventoryService.getAllItemsWithPagination(req.tenantId, req.query);
        ok(res, result);
    });
    getSingleItem = asyncHandler(async (req, res) => {
        const item = await this.inventoryService.getSingleItem(req.params.id, req.tenantId);
        ok(res, item);
    });
    updateItem = asyncHandler(async (req, res) => {
        const result = await this.inventoryService.updateItem(req.params.id, req.tenantId, req.body, req.user);
        ok(res, result);
    });
    deleteItem = asyncHandler(async (req, res) => {
        await this.inventoryService.deleteItem(req.params.id, req.tenantId, req.user);
        ok(res, null, 'Item deleted');
    });
    // ── Bulk operations ───────────────────────────────────────────────────────
    importItems = asyncHandler(async (req, res) => {
        const result = await this.inventoryService.importItems(req.body.items, req.tenantId, req.user);
        ok(res, result);
    });
    bulkAdjustStock = asyncHandler(async (req, res) => {
        const { ids, adjustment, type } = req.body;
        const modifiedCount = await this.inventoryService.bulkAdjustStock(ids, adjustment, type, req.tenantId, req.user);
        ok(res, { modifiedCount }, `${modifiedCount} items adjusted successfully`);
    });
    bulkUpdateCategory = asyncHandler(async (req, res) => {
        const { ids, category } = req.body;
        const modifiedCount = await this.inventoryService.bulkUpdateCategory(ids, category, req.tenantId, req.user);
        ok(res, { modifiedCount }, `${modifiedCount} items updated successfully`);
    });
    deleteItemsBatch = asyncHandler(async (req, res) => {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new AppError('No IDs provided for deletion', 400);
        }
        const deletedCount = await this.inventoryService.deleteItemsBatch(ids, req.tenantId, req.user);
        ok(res, { deletedCount }, `${deletedCount} items deleted successfully`);
    });
    // ── Item-level actions ────────────────────────────────────────────────────
    duplicateItem = asyncHandler(async (req, res) => {
        const item = await this.inventoryService.getSingleItem(req.params.id, req.tenantId);
        const { _id, createdAt, updatedAt, ...itemData } = item.toObject();
        itemData.name = `${itemData.name} (Copy)`;
        itemData.sku = itemData.sku ? `${itemData.sku}-COPY` : undefined;
        itemData.addedBy = req.user._id;
        const result = await this.inventoryService.addItem(itemData, req.tenantId, req.user);
        created(res, result.item);
    });
    toggleItemStatus = asyncHandler(async (req, res) => {
        const item = await this.inventoryService.toggleItemStatus(req.params.id, req.tenantId, req.user);
        ok(res, item);
    });
    // ── Stock movements ───────────────────────────────────────────────────────
    getItemStockHistory = asyncHandler(async (req, res) => {
        const history = await mongoose.model('StockLog')
            .find({ itemId: req.params.id, tenantId: req.tenantId })
            .sort({ createdAt: -1 })
            .lean();
        ok(res, history);
    });
    recordMovement = asyncHandler(async (req, res) => {
        await this.inventoryService.recordMovement(req.params.id, req.body, req.tenantId, req.user);
        ok(res, null, 'Stock movement recorded successfully');
    });
    // ── Analytics ────────────────────────────────────────────────────────────
    getInventoryStats = asyncHandler(async (req, res) => {
        const stats = await this.inventoryService.getInventoryStats(req.tenantId);
        ok(res, stats);
    });
    getLowStockItems = asyncHandler(async (req, res) => {
        const items = await this.inventoryService.getLowStockItems(req.tenantId);
        ok(res, items);
    });
    getStockAgingReport = asyncHandler(async (req, res) => {
        const report = await this.stockAgingService.getAgingAnalysis(req.tenantId);
        ok(res, report);
    });
    performAgingAction = asyncHandler(async (req, res) => {
        const { itemId, action, value } = req.body;
        const result = await this.stockAgingService.applyAction(itemId, req.tenantId, action, value);
        ok(res, result, 'Action applied successfully');
    });
    // ── Price updates + reprint queue ─────────────────────────────────────────
    batchPriceUpdate = asyncHandler(async (req, res) => {
        const { sku, newPrice } = req.body;
        const item = await Item.findOne({ sku, tenantId: req.tenantId });
        if (!item)
            throw new AppError('Item not found', 404);
        const oldPrice = item.sellingPrice;
        item.sellingPrice = newPrice;
        await item.save();
        // Upsert the reprint queue entry
        let queue = await ReprintQueue.findOne({ tenantId: req.tenantId });
        if (!queue)
            queue = new ReprintQueue({ tenantId: req.tenantId, items: [] });
        const existingIndex = queue.items.findIndex((i) => i.itemId.toString() === item._id.toString());
        if (existingIndex > -1) {
            queue.items[existingIndex].newPrice = newPrice;
            queue.items[existingIndex].quantity = item.stockQty || 0;
        }
        else {
            queue.items.push({
                itemId: item._id,
                itemName: item.name,
                sku: item.sku,
                oldPrice,
                newPrice,
                quantity: item.stockQty || 0,
                reason: 'Price Hike Batch Update',
            });
        }
        await queue.save();
        info(`Batch price update: ${item.sku} → ${newPrice} by ${req.user._id}`);
        ok(res, { item, queue }, 'Price updated and queued for reprint');
    });
    getReprintQueue = asyncHandler(async (req, res) => {
        const queue = await ReprintQueue.findOne({ tenantId: req.tenantId });
        ok(res, queue ? queue.items : []);
    });
    clearReprintQueue = asyncHandler(async (req, res) => {
        await ReprintQueue.findOneAndUpdate({ tenantId: req.tenantId }, { $set: { items: [] } });
        ok(res, null, 'Reprint queue cleared');
    });
};
InventoryController = __decorate([
    singleton(),
    __param(0, inject(InventoryService)),
    __param(1, inject(StockAgingService)),
    __metadata("design:paramtypes", [InventoryService,
        StockAgingService])
], InventoryController);
export { InventoryController };
