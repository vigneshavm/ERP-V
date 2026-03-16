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
import { InventoryService } from '../services/InventoryService.js';
import { StockAgingService } from '../services/StockAgingService.js';
import { info, error } from '@smarterp/shared/config/logger.js';
import Item from '../models/Item.js';
import ReprintQueue from '../models/ReprintQueue.js';
import mongoose from 'mongoose';
let InventoryController = class InventoryController {
    inventoryService;
    stockAgingService;
    constructor(inventoryService, stockAgingService) {
        this.inventoryService = inventoryService;
        this.stockAgingService = stockAgingService;
    }
    addItem = async (req, res) => {
        const authReq = req;
        try {
            const result = await this.inventoryService.addItem(authReq.body, authReq.tenantId, authReq.user);
            res.status(201).json(result);
        }
        catch (err) {
            error(`Add Item Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
    getAllItems = async (req, res) => {
        const authReq = req;
        try {
            const result = await this.inventoryService.getAllItemsWithPagination(authReq.tenantId, req.query);
            res.status(200).json(result);
        }
        catch (err) {
            error(`Get All Items Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };
    getSingleItem = async (req, res) => {
        const authReq = req;
        try {
            const item = await this.inventoryService.getSingleItem(authReq.params.id, authReq.tenantId);
            res.status(200).json(item);
        }
        catch (err) {
            error(`Get Single Item Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
    updateItem = async (req, res) => {
        const authReq = req;
        try {
            const result = await this.inventoryService.updateItem(authReq.params.id, authReq.tenantId, authReq.body, authReq.user);
            res.status(200).json(result);
        }
        catch (err) {
            error(`Update Item Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
    deleteItem = async (req, res) => {
        const authReq = req;
        try {
            await this.inventoryService.deleteItem(authReq.params.id, authReq.tenantId, authReq.user);
            res.status(200).json({ message: 'Item deleted' });
        }
        catch (err) {
            error(`Delete Item Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
    getLowStockItems = async (req, res) => {
        const authReq = req;
        try {
            const lowStockItems = await this.inventoryService.getLowStockItems(authReq.tenantId);
            res.status(200).json(lowStockItems);
        }
        catch (err) {
            error(`Low Stock Item Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };
    importItems = async (req, res) => {
        const authReq = req;
        try {
            const result = await this.inventoryService.importItems(authReq.body.items, authReq.tenantId, authReq.user);
            res.status(200).json(result);
        }
        catch (err) {
            error(`Bulk Import Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
    bulkAdjustStock = async (req, res) => {
        const authReq = req;
        try {
            const { ids, adjustment, type } = authReq.body;
            const modifiedCount = await this.inventoryService.bulkAdjustStock(ids, adjustment, type, authReq.tenantId, authReq.user);
            res.status(200).json({ message: `${modifiedCount} items adjusted successfully`, modifiedCount });
        }
        catch (err) {
            error(`Bulk Stock Adjustment Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };
    bulkUpdateCategory = async (req, res) => {
        const authReq = req;
        try {
            const { ids, category } = authReq.body;
            const modifiedCount = await this.inventoryService.bulkUpdateCategory(ids, category, authReq.tenantId, authReq.user);
            res.status(200).json({ message: `${modifiedCount} items updated successfully`, modifiedCount });
        }
        catch (err) {
            error(`Bulk Category Update Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };
    duplicateItem = async (req, res) => {
        const authReq = req;
        try {
            const item = await this.inventoryService.getSingleItem(authReq.params.id, authReq.tenantId);
            const { _id, createdAt, updatedAt, ...itemData } = item.toObject();
            itemData.name = `${itemData.name} (Copy)`;
            if (itemData.sku)
                itemData.sku = `${itemData.sku}-COPY`;
            itemData.addedBy = authReq.user?._id;
            const result = await this.inventoryService.addItem(itemData, authReq.tenantId, authReq.user);
            res.status(201).json(result.item);
        }
        catch (err) {
            error(`Duplicate Item Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
    toggleItemStatus = async (req, res) => {
        const authReq = req;
        try {
            const item = await this.inventoryService.toggleItemStatus(authReq.params.id, authReq.tenantId, authReq.user);
            res.status(200).json(item);
        }
        catch (err) {
            error(`Toggle Status Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
    getItemStockHistory = async (req, res) => {
        const authReq = req;
        try {
            const history = await mongoose.model('StockLog').find({
                itemId: authReq.params.id,
                tenantId: authReq.tenantId
            }).sort({ createdAt: -1 });
            res.status(200).json(history);
        }
        catch (err) {
            error(`Get History Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };
    getStockAgingReport = async (req, res) => {
        const authReq = req;
        try {
            const report = await this.stockAgingService.getAgingAnalysis(authReq.tenantId);
            res.status(200).json(report);
        }
        catch (err) {
            error(`Stock Aging Report Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };
    performAgingAction = async (req, res) => {
        const authReq = req;
        try {
            const { itemId, action, value } = req.body;
            const result = await this.stockAgingService.applyAction(itemId, authReq.tenantId, action, value);
            res.status(200).json({ message: "Action applied successfully", result });
        }
        catch (err) {
            error(`Aging Action Error: ${err.message}`);
            res.status(500).json({ message: err.message });
        }
    };
    batchPriceUpdate = async (req, res) => {
        const authReq = req;
        try {
            const { sku, newPrice } = req.body;
            const item = await Item.findOne({ sku, tenantId: authReq.tenantId });
            if (!item) {
                res.status(404).json({ message: 'Item not found' });
                return;
            }
            const oldPrice = item.sellingPrice;
            item.sellingPrice = newPrice;
            await item.save();
            let queue = await ReprintQueue.findOne({ tenantId: authReq.tenantId });
            if (!queue)
                queue = new ReprintQueue({ tenantId: authReq.tenantId, items: [] });
            const existingIndex = queue.items.findIndex(i => i.itemId.toString() === item._id.toString());
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
                    reason: 'Price Hike Batch Update'
                });
            }
            await queue.save();
            info(`Batch Price Update by ${authReq.user?.name}: ${item.sku} to ${newPrice}`);
            res.status(200).json({ message: 'Price updated and queued for reprint', item, queue });
        }
        catch (err) {
            error(`Batch Price Update Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };
    getReprintQueue = async (req, res) => {
        const authReq = req;
        try {
            const queue = await ReprintQueue.findOne({ tenantId: authReq.tenantId });
            res.status(200).json(queue ? queue.items : []);
        }
        catch (err) {
            error(`Get Reprint Queue Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };
    clearReprintQueue = async (req, res) => {
        const authReq = req;
        try {
            await ReprintQueue.findOneAndUpdate({ tenantId: authReq.tenantId }, { $set: { items: [] } });
            res.status(200).json({ message: 'Reprint queue cleared' });
        }
        catch (err) {
            error(`Clear Reprint Queue Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };
    deleteItemsBatch = async (req, res) => {
        const authReq = req;
        try {
            const { ids } = authReq.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                res.status(400).json({ message: 'No IDs provided for deletion' });
                return;
            }
            const deletedCount = await this.inventoryService.deleteItemsBatch(ids, authReq.tenantId, authReq.user);
            res.status(200).json({ message: `${deletedCount} items deleted successfully`, deletedCount });
        }
        catch (err) {
            error(`Batch Delete Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };
    getInventoryStats = async (req, res) => {
        const authReq = req;
        try {
            const stats = await this.inventoryService.getInventoryStats(authReq.tenantId);
            res.status(200).json(stats);
        }
        catch (err) {
            error(`Get Inventory Stats Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };
    recordMovement = async (req, res) => {
        const authReq = req;
        try {
            await this.inventoryService.recordMovement(authReq.params.id, authReq.body, authReq.tenantId, authReq.user);
            res.status(200).json({ message: 'Stock movement recorded successfully' });
        }
        catch (err) {
            error(`Record Movement Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
};
InventoryController = __decorate([
    singleton(),
    __param(0, inject(InventoryService)),
    __param(1, inject(StockAgingService)),
    __metadata("design:paramtypes", [InventoryService,
        StockAgingService])
], InventoryController);
export { InventoryController };
