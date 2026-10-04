import { Request, Response } from 'express';
import { singleton, inject } from 'tsyringe';
import { InventoryService } from '../services/InventoryService.js';
import { StockAgingService } from '../services/StockAgingService.js';
import { info, error } from '../../../config/logger.js';
import Item from '../models/Item.js';
import ReprintQueue from '../models/ReprintQueue.js';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import { isSqlItemSource } from '../../../config/itemDataSource.js';
import { sqlAgingReport, sqlCityWiseStock, sqlDeadStockReport, sqlItemHistory, sqlLowStockReport, sqlRackWiseStock, sqlStockAgeBuckets, sqlStockFilterOptions, sqlStockMovements, sqlStockStatusReport, type StockReportQuery } from '../../../integrations/textilesoft/sqlStockReports.js';

@singleton()
export class InventoryController {
    constructor(
        @inject(InventoryService) private inventoryService: InventoryService,
        @inject(StockAgingService) private stockAgingService: StockAgingService
    ) { }

    public addItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const result = await this.inventoryService.addItem(req.body, req.tenantId.toString(), req.user);
            res.status(201).json(result);
        } catch (err: any) {
            error(`Add Item Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public getAllItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const result = await this.inventoryService.getAllItemsWithPagination(req.tenantId.toString(), req.query);
            res.status(200).json(result);
        } catch (err: any) {
            error(`Get All Items Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public getSingleItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const item = await this.inventoryService.getSingleItem(String(req.params.id), req.tenantId.toString());
            res.status(200).json(item);
        } catch (err: any) {
            error(`Get Single Item Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public getItemByBarcode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const item = await this.inventoryService.getItemByBarcode(String(req.params.barcode), req.tenantId.toString());
            res.status(200).json(item);
        } catch (err: any) {
            error(`Get Item by Barcode Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public updateItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (isSqlItemSource()) { res.status(409).json({ message: 'SQL item updates are unavailable in the existing Textilesoft schema' }); return; }
            // Fetch current state for audit
            const originalItem = await Item.findOne({ _id: req.params.id, tenantId: req.tenantId });
            if (originalItem) {
                req.originalEntity = originalItem.toObject();
            }

            const result = await this.inventoryService.updateItem(String(req.params.id), req.tenantId.toString(), req.body, req.user);

            // Attach result for audit
            req.updatedEntity = result;

            res.status(200).json(result);
        } catch (err: any) {
            error(`Update Item Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public deleteItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (isSqlItemSource()) { res.status(409).json({ message: 'SQL item deletion is unavailable in the existing Textilesoft schema' }); return; }
            // Fetch current state for audit
            const originalItem = await Item.findOne({ _id: req.params.id, tenantId: req.tenantId });
            if (originalItem) {
                req.deletedEntity = originalItem.toObject();
            }

            await this.inventoryService.deleteItem(String(req.params.id), req.tenantId.toString(), req.user.name);
            res.status(200).json({ message: 'Item deleted' });
        } catch (err: any) {
            error(`Delete Item Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public getLowStockItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const lowStockItems = await this.inventoryService.getLowStockItems(req.tenantId.toString());
            res.status(200).json(lowStockItems);
        } catch (err: any) {
            error(`Low Stock Item Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public importItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const result = await this.inventoryService.importItems(req.body.items, req.tenantId.toString(), req.user);
            res.status(200).json(result);
        } catch (err: any) {
            error(`Bulk Import Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public bulkAdjustStock = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { ids, adjustment, type } = req.body;
            const modifiedCount = await this.inventoryService.bulkAdjustStock(ids, adjustment, type, req.tenantId.toString(), req.user);
            res.status(200).json({ message: `${modifiedCount} items adjusted successfully`, modifiedCount });
        } catch (err: any) {
            error(`Bulk Stock Adjustment Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public bulkUpdateCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (isSqlItemSource()) { res.status(409).json({ message: 'SQL category updates are unavailable in the existing Textilesoft schema' }); return; }
            const { ids, category } = req.body;
            const result = await Item.updateMany(
                { _id: { $in: ids }, tenantId: req.tenantId.toString() },
                { $set: { category } }
            );
            info(`Bulk category update by ${req.user.name}: ${result.modifiedCount} items migrated to ${category}`);
            res.status(200).json({ message: `${result.modifiedCount} items updated successfully`, modifiedCount: result.modifiedCount });
        } catch (err: any) {
            error(`Bulk Category Update Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public duplicateItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const item = await this.inventoryService.getSingleItem(String(req.params.id), req.tenantId.toString());
            const { _id, createdAt, updatedAt, ...itemData } = (item as any).toObject();

            itemData.name = `${itemData.name} (Copy)`;
            if (itemData.sku) itemData.sku = `${itemData.sku}-COPY`;
            // Barcode is not guaranteed unique in the schema, and getItemByBarcode()
            // just returns the first match it finds. Carrying the original barcode
            // over would let a POS scan resolve to the wrong SKU. Clear it so the
            // duplicate needs its own barcode assigned/printed.
            delete itemData.barcode;
            itemData.addedBy = req.user._id;

            const result = await this.inventoryService.addItem(itemData, req.tenantId.toString(), req.user);
            res.status(201).json(result.item);
        } catch (err: any) {
            error(`Duplicate Item Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public toggleItemStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (isSqlItemSource()) { res.status(409).json({ message: 'SQL item status updates are unavailable in the existing Textilesoft schema' }); return; }
            const item = await this.inventoryService.getSingleItem(String(req.params.id), req.tenantId.toString());
            item.isActive = !item.isActive;
            await item.save();
            info(`Item status toggled by ${req.user.name}: ${item.name} is now ${item.isActive ? 'Active' : 'Inactive'}`);
            res.status(200).json(item);
        } catch (err: any) {
            error(`Toggle Status Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    public getItemStockHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const tenantId = req.tenantId.toString();
            if (isSqlItemSource()) {
                res.status(200).json(await sqlItemHistory(String(req.params.id), tenantId));
                return;
            }
            const mongoHistory = () => mongoose.model('StockLog').find({
                itemId: req.params.id,
                tenantId
            }).sort({ createdAt: -1 });
            const history = await mongoHistory();
            res.status(200).json(history);
        } catch (err: any) {
            error(`Get History Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    /** Stock in/out log: Textilesoft purchases/sales/returns in SQL mode, ERP StockLog otherwise. */
    public getStockMovements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const q = req.query as Record<string, string | undefined>;
            const mongoMovements = () => this.inventoryService.getStockMovements(req.tenantId.toString(), q);
            const result = isSqlItemSource() ? await sqlStockMovements(q) : await mongoMovements();
            res.status(200).json(result);
        } catch (err: any) {
            error(`Stock Movements Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public getStockAgingReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const tenantId = req.tenantId.toString();
            const report = isSqlItemSource()
                ? await sqlAgingReport(tenantId)
                : await this.stockAgingService.getAgingAnalysis(tenantId);
            res.status(200).json(report);
        } catch (err: any) {
            error(`Stock Aging Report Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    /** Purchased-but-not-sold stock by calendar-month bucket (summary over all lots + one page of a bucket). */
    public getStockAgeBuckets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const tenantId = req.tenantId.toString();
            const q = {
                bucket: typeof req.query.bucket === 'string' ? req.query.bucket : undefined,
                month: typeof req.query.month === 'string' ? req.query.month : undefined,
                sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
                dir: typeof req.query.dir === 'string' ? req.query.dir : undefined,
                search: typeof req.query.search === 'string' ? req.query.search : undefined,
                page: typeof req.query.page === 'string' ? req.query.page : undefined,
                limit: typeof req.query.limit === 'string' ? req.query.limit : undefined,
                refresh: typeof req.query.refresh === 'string' ? req.query.refresh : undefined,
                from: typeof req.query.from === 'string' ? req.query.from : undefined,
                to: typeof req.query.to === 'string' ? req.query.to : undefined,
            };
            const mongo = () => this.stockAgingService.getStockAgeBuckets(tenantId, q);
            const report = isSqlItemSource() ? await sqlStockAgeBuckets(tenantId, q) : await mongo();
            res.status(200).json(report);
        } catch (err: any) {
            error(`Stock Age Buckets Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    /** Query params shared by the Reports > Inventory endpoints (strings only). */
    private stockReportQuery(req: Request): StockReportQuery {
        const str = (k: string): string | undefined => (typeof req.query[k] === 'string' ? (req.query[k] as string) : undefined);
        return {
            search: str('search'), category: str('category'), brand: str('brand'), supplier: str('supplier'), from: str('from'), to: str('to'),
            page: str('page'), limit: str('limit'), threshold: str('threshold'), days: str('days'), neverSold: str('neverSold'), refresh: str('refresh'),
            sort: str('sort'), dir: str('dir'),
        };
    }

    private runStockReport(label: string, sql: (tenantId: string, q: StockReportQuery) => Promise<any>, mongo: (tenantId: string, q: StockReportQuery) => Promise<any>) {
        return async (req: AuthenticatedRequest, res: Response): Promise<void> => {
            const tenantId = req.tenantId.toString();
            try {
                const q = this.stockReportQuery(req);
                const report = isSqlItemSource() ? await sql(tenantId, q) : await mongo(tenantId, q);
                res.status(200).json(report);
            } catch (err: any) {
                error(`${label} Error: ${err.message}`);
                res.status(500).json({ message: 'Server Error', error: err.message });
            }
        };
    }

    public getStockStatusReport = this.runStockReport('stock status report', sqlStockStatusReport, (t, q) => this.stockAgingService.getStockStatusReport(t, q));
    public getStockFilterOptions = this.runStockReport('stock filter options', (t) => sqlStockFilterOptions(t), (t) => this.stockAgingService.getStockFilterOptions(t));
    public getLowStockReport = this.runStockReport('low stock report', sqlLowStockReport, (t, q) => this.stockAgingService.getLowStockReport(t, q));
    public getDeadStockReport = this.runStockReport('dead stock report', sqlDeadStockReport, (t, q) => this.stockAgingService.getDeadStockReport(t, q));

    public performAgingAction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (isSqlItemSource()) { res.status(409).json({ message: 'SQL stock aging actions are unavailable in the existing Textilesoft schema' }); return; }
            const { itemId, action, value } = req.body;
            const result = await this.stockAgingService.applyAction(itemId, req.tenantId.toString(), action, value);
            res.status(200).json({ message: "Action applied successfully", result });
        } catch (err: any) {
            error(`Aging Action Error: ${err.message}`);
            res.status(500).json({ message: err.message });
        }
    };

    public batchPriceUpdate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (isSqlItemSource()) { res.status(409).json({ message: 'SQL batch price updates are unavailable in the existing Textilesoft schema' }); return; }
            const { sku, newPrice } = req.body;
            const tenantId = req.tenantId.toString();
            const item = await Item.findOne({ sku, tenantId });
            if (!item) {
                res.status(404).json({ message: 'Item not found' });
                return;
            }

            const oldPrice = item.sellingPrice;
            item.sellingPrice = newPrice;
            await item.save();

            let queue = await ReprintQueue.findOne({ tenantId });
            if (!queue) queue = new ReprintQueue({ tenantId, items: [] });

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
            info(`Batch Price Update by ${req.user.name}: ${item.sku} to ${newPrice}`);
            res.status(200).json({ message: 'Price updated and queued for reprint', item, queue });
        } catch (err: any) {
            error(`Batch Price Update Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public getReprintQueue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (isSqlItemSource()) { res.status(200).json([]); return; }
            const queue = await ReprintQueue.findOne({ tenantId: req.tenantId.toString() });
            res.status(200).json(queue ? queue.items : []);
        } catch (err: any) {
            error(`Get Reprint Queue Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public clearReprintQueue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (isSqlItemSource()) { res.status(200).json({ message: 'No SQL reprint queue is available' }); return; }
            await ReprintQueue.findOneAndUpdate({ tenantId: req.tenantId.toString() }, { $set: { items: [] } });
            res.status(200).json({ message: 'Reprint queue cleared' });
        } catch (err: any) {
            error(`Clear Reprint Queue Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public deleteItemsBatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (isSqlItemSource()) { res.status(409).json({ message: 'SQL item deletion is unavailable in the existing Textilesoft schema' }); return; }
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                res.status(400).json({ message: 'No IDs provided for deletion' });
                return;
            }
            const items = await Item.deleteMany({ _id: { $in: ids }, tenantId: req.tenantId.toString() });
            info(`Batch delete by ${req.user.name}: ${items.deletedCount} items removed`);
            res.status(200).json({ message: `${items.deletedCount} items deleted successfully`, deletedCount: items.deletedCount });
        } catch (err: any) {
            error(`Batch Delete Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public getInventoryStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const stats = await this.inventoryService.getInventoryStats(req.tenantId.toString());
            res.status(200).json(stats);
        } catch (err: any) {
            error(`Get Inventory Stats Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public getStockByCity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const tenantId = req.tenantId.toString();
            const mongo = () => this.inventoryService.getStockByCity(tenantId);
            // SQL mode: single-store shops get the shared stock snapshot; multi-store tenants keep per-store levels.
            const report = isSqlItemSource()
                ? (await sqlCityWiseStock(tenantId, this.stockReportQuery(req))) ?? []
                : await mongo();
            res.status(200).json(report);
        } catch (err: any) {
            error(`Get Stock By City Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    public getStockByRack = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const tenantId = req.tenantId.toString();
            const mongo = () => this.inventoryService.getStockByRack(tenantId);
            const report = isSqlItemSource()
                ? await sqlRackWiseStock(tenantId, this.stockReportQuery(req))
                : await mongo();
            res.status(200).json(report);
        } catch (err: any) {
            error(`Get Stock By Rack Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    // Distinct list of category values actually used across this tenant's items.
    // Used to populate the Items page category filter, which previously only
    // showed categories present on the currently loaded page of results.
    public getDistinctCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const categories = await this.inventoryService.getDistinctCategories(req.tenantId.toString());
            res.status(200).json(categories);
        } catch (err: any) {
            // The service itself already catches its own DB errors and resolves to [],
            // so reaching here means something unexpected broke -- surface it as a real
            // error rather than quietly handing back a fabricated category list.
            error(`Get Distinct Categories Error: ${err.message}`);
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    };

    // Records stock lost to damage or unexplained shrinkage -- distinct from a normal
    // ADJUST/SALES stock movement so it shows up separately in stock history/reporting.
    public writeOffStock = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (isSqlItemSource()) { res.status(409).json({ message: 'SQL stock write-off is unavailable in the existing Textilesoft schema' }); return; }
            const { itemId, quantity, cause, reason } = req.body;
            await this.inventoryService.writeOffStock(itemId, Number(quantity), cause, reason, req.tenantId.toString(), req.user);
            res.status(200).json({ message: 'Stock write-off recorded' });
        } catch (err: any) {
            error(`Stock Write-Off Error: ${err.message}`);
            res.status(err.statusCode || 500).json({ message: err.message });
        }
    };

    // Backs the Inventory Variant Search page's Brand/Size/Color/Shelf filter dropdowns.
    // Always DB-driven (global Brand/Size/Color/Shelf catalog collections unioned with
    // whatever values this tenant's own Items already use) -- see InventoryService.getFilterOptions.
    public getFilterOptions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const options = await this.inventoryService.getFilterOptions(req.tenantId.toString());
            res.status(200).json({ success: true, data: options });
        } catch (err: any) {
            error(`Get Filter Options Error: ${err.message}`);
            res.status(500).json({ success: false, message: 'Server Error', error: err.message });
        }
    };
}
