import { Request, Response } from 'express';
import { singleton, inject } from 'tsyringe';
import { InventoryService } from '../services/InventoryService.js';
import { StockAgingService } from '../services/StockAgingService.js';
import { info, error } from '../../../config/logger.js';
import Item from '../models/Item.js';
import ReprintQueue from '../models/ReprintQueue.js';
import mongoose from 'mongoose';

@singleton()
export class InventoryController {
    constructor(
        @inject(InventoryService) private inventoryService: InventoryService,
        @inject(StockAgingService) private stockAgingService: StockAgingService
    ) { }

    public addItem = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const result = await this.inventoryService.addItem(authReq.body, authReq.tenantId as string, authReq.user);
            res.status(201).json(result);
        } catch (err: any) {
            error(`Add Item Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public getAllItems = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const result = await this.inventoryService.getAllItemsWithPagination(authReq.tenantId as string, req.query);
            res.status(200).json(result);
        } catch (err: any) {
            error(`Get All Items Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public getSingleItem = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const item = await this.inventoryService.getSingleItem(authReq.params.id, authReq.tenantId as string);
            res.status(200).json(item);
        } catch (err: any) {
            error(`Get Single Item Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public updateItem = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const result = await this.inventoryService.updateItem(authReq.params.id, authReq.tenantId as string, authReq.body, authReq.user);
            res.status(200).json(result);
        } catch (err: any) {
            error(`Update Item Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public deleteItem = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            await this.inventoryService.deleteItem(authReq.params.id, authReq.tenantId as string, authReq.user);
            res.status(200).json({ message: 'Item deleted' });
        } catch (err: any) {
            error(`Delete Item Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public getLowStockItems = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const lowStockItems = await this.inventoryService.getLowStockItems(authReq.tenantId as string);
            res.status(200).json(lowStockItems);
        } catch (err: any) {
            error(`Low Stock Item Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public importItems = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const result = await this.inventoryService.importItems(authReq.body.items, authReq.tenantId as string, authReq.user);
            res.status(200).json(result);
        } catch (err: any) {
            error(`Bulk Import Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public bulkAdjustStock = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const { ids, adjustment, type } = authReq.body;
            const modifiedCount = await this.inventoryService.bulkAdjustStock(ids, adjustment, type, authReq.tenantId as string, authReq.user);
            res.status(200).json({ message: `${modifiedCount} items adjusted successfully`, modifiedCount });
        } catch (err: any) {
            error(`Bulk Stock Adjustment Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public bulkUpdateCategory = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const { ids, category } = authReq.body;
            const modifiedCount = await this.inventoryService.bulkUpdateCategory(ids, category, authReq.tenantId as string, authReq.user);
            res.status(200).json({ message: `${modifiedCount} items updated successfully`, modifiedCount });
        } catch (err: any) {
            error(`Bulk Category Update Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public duplicateItem = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const item = await this.inventoryService.getSingleItem(authReq.params.id, authReq.tenantId as string);
            const { _id, createdAt, updatedAt, ...itemData } = (item as any).toObject();

            itemData.name = `${itemData.name} (Copy)`;
            if (itemData.sku) itemData.sku = `${itemData.sku}-COPY`;
            itemData.addedBy = authReq.user?._id as string;

            const result = await this.inventoryService.addItem(itemData, authReq.tenantId as string, authReq.user);
            res.status(201).json(result.item);
        } catch (err: any) {
            error(`Duplicate Item Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public toggleItemStatus = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const item = await this.inventoryService.toggleItemStatus(authReq.params.id, authReq.tenantId as string, authReq.user);
            res.status(200).json(item);
        } catch (err: any) {
            error(`Toggle Status Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public getItemStockHistory = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const history = await mongoose.model('StockLog').find({
                itemId: authReq.params.id,
                tenantId: authReq.tenantId as string
            }).sort({ createdAt: -1 });
            res.status(200).json(history);
        } catch (err: any) {
            error(`Get History Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public getStockAgingReport = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const report = await this.stockAgingService.getAgingAnalysis(authReq.tenantId as string);
            res.status(200).json(report);
        } catch (err: any) {
            error(`Stock Aging Report Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public performAgingAction = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const { itemId, action, value } = req.body;
            const result = await this.stockAgingService.applyAction(itemId, authReq.tenantId as string, action, value);
            res.status(200).json({ message: "Action applied successfully", result });
        } catch (err: any) {
            error(`Aging Action Error: ${err.message}`);
            res.status(500).json({ message: err.message });
        }
    };

    public batchPriceUpdate = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const { sku, newPrice } = req.body;
            const item = await Item.findOne({ sku, tenantId: authReq.tenantId as string });
            if (!item) {
                res.status(404).json({ message: 'Item not found' });
                return;
            }

            const oldPrice = item.sellingPrice;
            item.sellingPrice = newPrice;
            await item.save();

            let queue = await ReprintQueue.findOne({ tenantId: authReq.tenantId as string });
            if (!queue) queue = new ReprintQueue({ tenantId: authReq.tenantId as string, items: [] });

            const existingIndex = queue.items.findIndex(i => i.itemId.toString() === item._id.toString());
            if (existingIndex > -1) {
                queue.items[existingIndex].newPrice = newPrice;
                queue.items[existingIndex].quantity = item.stockQty || 0;
            } else {
                queue.items.push({
                    itemId: item._id as mongoose.Types.ObjectId,
                    itemName: item.name,
                    sku: item.sku as string,
                    oldPrice,
                    newPrice,
                    quantity: item.stockQty || 0,
                    reason: 'Price Hike Batch Update'
                });
            }
            await queue.save();
            info(`Batch Price Update by ${authReq.user?.name}: ${item.sku} to ${newPrice}`);
            res.status(200).json({ message: 'Price updated and queued for reprint', item, queue });
        } catch (err: any) {
            error(`Batch Price Update Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public getReprintQueue = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const queue = await ReprintQueue.findOne({ tenantId: authReq.tenantId as string });
            res.status(200).json(queue ? queue.items : []);
        } catch (err: any) {
            error(`Get Reprint Queue Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public clearReprintQueue = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            await ReprintQueue.findOneAndUpdate({ tenantId: authReq.tenantId as string }, { $set: { items: [] } });
            res.status(200).json({ message: 'Reprint queue cleared' });
        } catch (err: any) {
            error(`Clear Reprint Queue Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public deleteItemsBatch = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const { ids } = authReq.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                res.status(400).json({ message: 'No IDs provided for deletion' });
                return;
            }
            const deletedCount = await this.inventoryService.deleteItemsBatch(ids, authReq.tenantId as string, authReq.user);
            res.status(200).json({ message: `${deletedCount} items deleted successfully`, deletedCount });
        } catch (err: any) {
            error(`Batch Delete Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public getInventoryStats = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            const stats = await this.inventoryService.getInventoryStats(authReq.tenantId as string);
            res.status(200).json(stats);
        } catch (err: any) {
            error(`Get Inventory Stats Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public recordMovement = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as any;
        try {
            await this.inventoryService.recordMovement(authReq.params.id, authReq.body, authReq.tenantId as string, authReq.user);
            res.status(200).json({ message: 'Stock movement recorded successfully' });
        } catch (err: any) {
            error(`Record Movement Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };
}
