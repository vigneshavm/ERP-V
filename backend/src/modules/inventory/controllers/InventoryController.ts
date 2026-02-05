import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { singleton, container } from 'tsyringe';

import Item from '../models/Item.js';
import ReprintQueue from '../models/ReprintQueue.js';
import { StockAgingService } from '../services/StockAgingService.js';

import { checkStockAlerts } from '../../../utils/stockAlert.js';
import { info, error } from '../../../config/logger.js';

/**
 * Request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
        [key: string]: any;
    };
    tenantId?: string; // Injected by Auth Middleware
    originalEntity?: any;
    updatedEntity?: any;
    deletedEntity?: any;
}

/**
 * Interface for import item
 */
interface ImportItem {
    name?: string;
    sku?: string;
    category?: string;
    costPrice?: string | number;
    sellingPrice?: string | number;
    stockQty?: string | number;
    unit?: string;
}

/**
 * Interface for import results
 */
interface ImportResults {
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; itemName: string; error: string }>;
    validationErrors: Array<{ row: number; itemName: string; sku: string; errors: string[] }>;
}

@singleton()
export class InventoryController {
    /**
     * @swagger
     * /api/inventory:
     *   post:
     *     summary: Add new item to inventory
     *     tags: [Inventory]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Item'
     *     responses:
     *       201:
     *         description: Item added successfully
     *       400:
     *         description: Invalid input or item exists
     */
    public addItem = async (req: Request, res: Response): Promise<void> => {
        // Cast to authenticated request
        const authReq = req as AuthenticatedRequest;

        try {
            const { name, sku, category, costPrice, sellingPrice, stockQty, lowStockLimit, unit } =
                authReq.body;

            if (!name || !costPrice || !sellingPrice) {
                res.status(400).json({ message: 'Please fill all required fields' });
                return;
            }

            // Check if item already exists for this tenant
            const existing = await Item.findOne({ name, tenantId: authReq.tenantId });
            if (existing) {
                res.status(400).json({ message: 'Item already exists in your inventory' });
                return;
            }

            const item = await Item.create({
                name,
                sku,
                category,
                costPrice,
                sellingPrice,
                stockQty,
                lowStockLimit,
                unit,
                addedBy: authReq.user?._id,
                tenantId: authReq.tenantId // Enforce Tenant Scope
            });

            info(`Item added by ${authReq.user?.name}: ${item.name}`);
            const alerts = await checkStockAlerts(authReq.user?._id as string);

            res.status(201).json({ item, alerts });
        } catch (err) {
            console.error('Add Item Error:', err);
            error(`Add Item Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/inventory:
     *   get:
     *     summary: Get all items
     *     tags: [Inventory]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema: { type: integer, default: 1 }
     *       - in: query
     *         name: limit
     *         schema: { type: integer, default: 20 }
     *       - in: query
     *         name: search
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: List of items retrieved successfully
     */
    public getAllItems = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as AuthenticatedRequest;
        try {
            // Pagination parameters
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            // Search query (optional)
            const search = (req.query.search as string) || '';
            const query: any = { tenantId: authReq.tenantId };

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { sku: { $regex: search, $options: 'i' } }
                ];
            }

            // Execute query with lean() for performance
            const [items, total] = await Promise.all([
                Item.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(), // Use lean queries for read-only operations
                Item.countDocuments(query)
            ]);

            res.status(200).json({
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (err) {
            error(`Get All Items Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/inventory/{id}:
     *   get:
     *     summary: Get single item by ID
     *     tags: [Inventory]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: Item details retrieved
     *       404:
     *         description: Item not found
     */
    public getSingleItem = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as AuthenticatedRequest;
        try {
            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(authReq.params.id as string)) {
                res.status(400).json({ message: 'Invalid item ID format' });
                return;
            }

            const item = await Item.findOne({
                _id: authReq.params.id,
                addedBy: authReq.user?._id
            });

            if (!item) {
                res.status(404).json({ message: 'Item not found or unauthorized' });
                return;
            }

            res.status(200).json(item);
        } catch (err) {
            error(`Get Single Item Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/inventory/{id}:
     *   put:
     *     summary: Update item
     *     tags: [Inventory]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Item'
     *     responses:
     *       200:
     *         description: Item updated successfully
     */
    public updateItem = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as AuthenticatedRequest;
        try {
            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(authReq.params.id as string)) {
                res.status(400).json({ message: 'Invalid item ID format' });
                return;
            }

            // First check if item belongs to this owner
            const item = await Item.findOne({
                _id: authReq.params.id,
                addedBy: authReq.user?._id
            });

            if (!item) {
                res.status(404).json({ message: 'Item not found or unauthorized' });
                return;
            }

            // Check for duplicate name if name is being updated
            if (authReq.body.name && authReq.body.name !== item.name) {
                const existingName = await Item.findOne({
                    name: authReq.body.name,
                    tenantId: authReq.tenantId,
                    _id: { $ne: authReq.params.id }
                });

                if (existingName) {
                    res.status(400).json({ message: 'Item name already exists in your inventory' });
                    return;
                }
            }

            // Attach for audit middleware (before update)
            authReq.originalEntity = item.toObject();

            const updated = await Item.findByIdAndUpdate(authReq.params.id, authReq.body, { new: true });

            if (!updated) {
                res.status(404).json({ message: 'Item not found' });
                return;
            }

            // Attach for audit middleware (after update)
            authReq.updatedEntity = updated.toObject();

            info(`Item updated by ${authReq.user?.name}: ${updated.name}`);

            const alerts = await checkStockAlerts(authReq.user?._id as string);
            res.status(200).json({ updated, alerts });
        } catch (err) {
            error(`Update Item Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/inventory/{id}:
     *   delete:
     *     summary: Delete item
     *     tags: [Inventory]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: Item deleted successfully
     */
    public deleteItem = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as AuthenticatedRequest;
        try {
            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(authReq.params.id as string)) {
                res.status(400).json({ message: 'Invalid item ID format' });
                return;
            }

            const item = await Item.findOne({
                _id: authReq.params.id,
                addedBy: authReq.user?._id
            });

            if (!item) {
                res.status(404).json({ message: 'Item not found or unauthorized' });
                return;
            }

            // Attach for audit middleware (before deletion)
            authReq.deletedEntity = item.toObject();

            await Item.findByIdAndDelete(authReq.params.id as string);

            info(`Item deleted by ${authReq.user?.name}: ${item.name}`);
            res.status(200).json({ message: 'Item deleted' });
        } catch (err) {
            error(`Delete Item Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/inventory/low-stock:
     *   get:
     *     summary: Get low-stock items
     *     tags: [Inventory]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of low-stock items
     */
    public getLowStockItems = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as AuthenticatedRequest;
        try {
            // Get all items and filter by available stock (stockQty - reservedStock)
            // Use tenantId instead of addedBy
            const allItems = await Item.find({ tenantId: authReq.tenantId });

            const lowStockItems = allItems.filter((item: any) => {
                const availableStock = item.stockQty - (item.reservedStock || 0);
                return availableStock <= item.lowStockLimit;
            });

            res.status(200).json(lowStockItems);
        } catch (err) {
            error(`Low Stock Item Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/inventory/import:
     *   post:
     *     summary: Bulk import items
     *     tags: [Inventory]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               items:
     *                 type: array
     *                 items:
     *                   $ref: '#/components/schemas/Item'
     *     responses:
     *       200:
     *         description: Import results
     */
    public importItems = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as AuthenticatedRequest;
        try {
            const { items } = authReq.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                res.status(400).json({ message: 'No items provided for import' });
                return;
            }

            const results: ImportResults = {
                imported: 0,
                updated: 0,
                skipped: 0,
                errors: [],
                validationErrors: []
            };

            // Valid unit labels
            const validUnits = [
                'pcs', 'kg', 'g', 'mg', 'l', 'ml', 'box', 'pack', 'bag', 'bottle',
                'can', 'dozen', 'm', 'cm', 'ft', 'unit', 'pair', 'set'
            ];

            // 1. Pre-validation and Batch duplicate check
            const importSKUs = new Map<string, number[]>();
            const importNames = new Map<string, number[]>();

            // Collect SKUs and Names for DB lookup
            const skusToFind: string[] = [];
            const namesToFind: string[] = [];

            // Pre-process items to identify keys and check internal batch duplicates
            items.forEach((item: ImportItem, index: number) => {
                const rowNum = index + 1;

                // Track SKUs
                if (item.sku && item.sku.toString().trim() !== '') {
                    const skuLower = item.sku.toLowerCase().trim();
                    if (importSKUs.has(skuLower)) {
                        importSKUs.get(skuLower)!.push(rowNum);
                    } else {
                        importSKUs.set(skuLower, [rowNum]);
                        skusToFind.push(skuLower);
                    }
                }

                // Track Names
                if (item.name && item.name.toString().trim() !== '') {
                    const nameLower = item.name.toLowerCase().trim();
                    if (importNames.has(nameLower)) {
                        importNames.get(nameLower)!.push(rowNum);
                    } else {
                        importNames.set(nameLower, [rowNum]);
                        namesToFind.push(nameLower);
                    }
                }
            });

            // 2. Fetch efficiently only potentially colliding items
            const existingItems = await Item.find({
                tenantId: authReq.tenantId,
                $or: [
                    { sku: { $in: skusToFind.map(s => new RegExp(`^${s}$`, 'i')) } }, // Case insensitive match
                    { name: { $in: namesToFind.map(n => new RegExp(`^${n}$`, 'i')) } }
                ]
            }).lean();

            // Map existing items for fast lookup
            const existingMap = new Map<string, any>(); // Key: "sku:xyz" or "name:abc"

            existingItems.forEach((item: any) => {
                if (item.sku) existingMap.set(`sku:${item.sku.toLowerCase()}`, item);
                existingMap.set(`name:${item.name.toLowerCase()}`, item);
            });

            // 3. Process items and build Bulk Ops
            const bulkOps: any[] = [];

            items.forEach((item: ImportItem, index: number) => {
                const rowNum = index + 1;
                const rowErrors: string[] = [];

                // Basic Validation
                if (!item.name || item.name.toString().trim() === '') rowErrors.push('Item name is required');
                if (!item.costPrice || item.costPrice === '') rowErrors.push('Cost price is required');
                else if (isNaN(Number(item.costPrice)) || parseFloat(String(item.costPrice)) < 0) rowErrors.push('Invalid cost price');
                if (!item.sellingPrice || item.sellingPrice === '') rowErrors.push('Selling price is required');
                else if (isNaN(Number(item.sellingPrice)) || parseFloat(String(item.sellingPrice)) < 0) rowErrors.push('Invalid selling price');
                if (!item.category || item.category.toString().trim() === '') rowErrors.push('Category is required');

                // Unit Validation
                if (item.unit && item.unit.toString().trim() !== '') {
                    if (!validUnits.includes(item.unit.toLowerCase().trim())) {
                        rowErrors.push(`Invalid unit "${item.unit}"`);
                    }
                }

                // Batch Duplicate Validation
                if (item.sku) {
                    const skuLower = item.sku.toLowerCase().trim();
                    const dups = importSKUs.get(skuLower);
                    if (dups && dups.length > 1 && dups[0] !== rowNum) {
                        rowErrors.push(`SKU "${item.sku}" is duplicated in rows: ${dups.join(', ')}`);
                    }
                }

                if (rowErrors.length > 0) {
                    results.validationErrors.push({ row: rowNum, itemName: item.name || '?', sku: item.sku || 'N/A', errors: rowErrors });
                    results.skipped++;
                    return; // Skip this item
                }

                // Match with Existing
                let match = null;
                const skuKey = item.sku ? `sku:${item.sku.toLowerCase().trim()}` : null;
                const nameKey = item.name ? `name:${item.name.toLowerCase().trim()}` : null;

                if (skuKey && existingMap.has(skuKey)) match = existingMap.get(skuKey);
                else if (nameKey && existingMap.has(nameKey)) match = existingMap.get(nameKey);

                const qtyToAdd = item.stockQty ? parseInt(String(item.stockQty)) : 0;

                if (match) {
                    // UPDATE Operation
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: match._id },
                            update: {
                                $inc: { stockQty: qtyToAdd },
                                $set: {
                                    category: (item.category as string).trim(),
                                    unit: item.unit ? item.unit.toLowerCase().trim() : match.unit,
                                    costPrice: parseFloat(String(item.costPrice)),
                                    sellingPrice: parseFloat(String(item.sellingPrice)),
                                }
                            }
                        }
                    });
                    results.updated++;
                } else {
                    // INSERT Operation
                    bulkOps.push({
                        insertOne: {
                            document: {
                                name: (item.name as string).trim(),
                                sku: item.sku ? item.sku.trim() : undefined,
                                category: (item.category as string).trim(),
                                costPrice: parseFloat(String(item.costPrice)),
                                sellingPrice: parseFloat(String(item.sellingPrice)),
                                stockQty: qtyToAdd,
                                unit: item.unit ? item.unit.toLowerCase().trim() : 'pcs',
                                addedBy: authReq.user?._id,
                                tenantId: authReq.tenantId,
                                reservedStock: 0,
                                lowStockLimit: 10 // Default
                            }
                        }
                    });
                    results.imported++;
                }
            });

            // 4. Execute Bulk Write
            if (bulkOps.length > 0) {
                const bulkResult = await Item.bulkWrite(bulkOps);
                info(`Bulk Write Result: ${bulkResult.insertedCount} inserted, ${bulkResult.modifiedCount} modified`);
            }

            info(`Items imported by ${authReq.user?.name}: ${results.imported} created, ${results.updated} updated, ${results.skipped} skipped`);
            const alerts = await checkStockAlerts(authReq.user?._id as string);

            res.status(200).json({
                message: `Import completed: ${results.imported} items created, ${results.updated} items updated, ${results.skipped} skipped`,
                ...results,
                alerts
            });
        } catch (err) {
            console.error('Bulk Import Error:', err);
            error(`Bulk Import Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error during import', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/inventory/aging-report:
     *   get:
     *     summary: Get stock aging analysis report (Dead Stock)
     *     tags: [Inventory]
     *     responses:
     *       200:
     *         description: List of items with age analysis
     */
    public getStockAgingReport = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as AuthenticatedRequest;
        try {
            const stockAgingService = container.resolve(StockAgingService);
            const report = await stockAgingService.getAgingAnalysis(authReq.tenantId as string);
            res.status(200).json(report);
        } catch (err) {
            error(`Stock Aging Report Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/inventory/aging-action:
     *   post:
     *     summary: Perform action on dead stock (Clearance/Reduce Margin)
     *     tags: [Inventory]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [itemId, action]
     *             properties:
     *               itemId: { type: string }
     *               action: { type: string, enum: [CLEARANCE, REDUCE_MARGIN] }
     *               value: { type: number }
     *     responses:
     *       200:
     *         description: Action applied successfully
     */
    public performAgingAction = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as AuthenticatedRequest;
        try {
            const { itemId, action, value } = req.body;

            if (!itemId || !action) {
                res.status(400).json({ message: "Item ID and Action are required" });
                return;
            }

            const stockAgingService = container.resolve(StockAgingService);
            const result = await stockAgingService.applyAction(itemId, authReq.user?._id as string || authReq.tenantId as string, action, value);

            res.status(200).json({ message: "Action applied successfully", result });
        } catch (err) {
            error(`Aging Action Error: ${(err as Error).message}`);
            res.status(500).json({ message: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/inventory/batch-price-update:
     *   post:
     *     summary: Update price and queue for reprint
     *     tags: [Inventory]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               sku: { type: string }
     *               newPrice: { type: number }
     *     responses:
     *       200:
     *         description: Price updated and queued for reprint
     */
    public batchPriceUpdate = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as AuthenticatedRequest;
        try {
            const { sku, newPrice } = req.body;

            if (!sku || !newPrice) {
                res.status(400).json({ message: 'SKU and New Price are required' });
                return;
            }

            const item = await Item.findOne({
                sku: sku,
                tenantId: authReq.tenantId
            });

            if (!item) {
                res.status(404).json({ message: 'Item not found' });
                return;
            }

            const oldPrice = item.sellingPrice;
            item.sellingPrice = newPrice;
            await item.save();

            // Add to Reprint Queue
            // Find existing queue doc for tenant or create new
            let queue = await ReprintQueue.findOne({ tenantId: authReq.tenantId });
            if (!queue) {
                queue = new ReprintQueue({ tenantId: authReq.tenantId, items: [] });
            }

            // Check if item already in queue, update it
            const existingIndex = queue.items.findIndex(i => i.itemId.toString() === item._id.toString());
            if (existingIndex > -1) {
                // Update existing entry
                queue.items[existingIndex].newPrice = newPrice;
                queue.items[existingIndex].quantity = item.stockQty || 0; // Update qty to current stock
                queue.items[existingIndex].updatedAt = new Date(); // If I monitored timestamps on subdocs
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
        } catch (err) {
            error(`Batch Price Update Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/inventory/reprint-queue:
     *   get:
     *     summary: Get reprint queue
     *     tags: [Inventory]
     *     responses:
     *       200:
     *         description: Reprint queue retrieved
     */
    public getReprintQueue = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as AuthenticatedRequest;
        try {
            const queue = await ReprintQueue.findOne({ tenantId: authReq.tenantId });
            res.status(200).json(queue ? queue.items : []);
        } catch (err) {
            error(`Get Reprint Queue Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/inventory/reprint-queue:
     *   delete:
     *     summary: Clear reprint queue (after printing)
     *     tags: [Inventory]
     *     responses:
     *       200:
     *         description: Queue cleared
     */
    public clearReprintQueue = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as AuthenticatedRequest;
        try {
            await ReprintQueue.findOneAndUpdate(
                { tenantId: authReq.tenantId },
                { $set: { items: [] } }
            );
            res.status(200).json({ message: 'Reprint queue cleared' });
        } catch (err) {
            error(`Clear Reprint Queue Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @swagger
     * /api/inventory/batch:
     *   delete:
     *     summary: Batch delete items
     *     tags: [Inventory]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [ids]
     *             properties:
     *               ids: { type: array, items: { type: string } }
     *     responses:
     *       200:
     *         description: Items deleted successfully
     */
    public deleteItemsBatch = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as AuthenticatedRequest;
        try {
            const { ids } = authReq.body;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                res.status(400).json({ message: 'No IDs provided for deletion' });
                return;
            }

            // Ensure all items belong to the tenant
            const result = await Item.deleteMany({
                _id: { $in: ids },
                tenantId: authReq.tenantId
            });

            info(`Batch delete by ${authReq.user?.name}: ${result.deletedCount} items removed`);
            res.status(200).json({ message: `${result.deletedCount} items deleted successfully`, deletedCount: result.deletedCount });
        } catch (err) {
            error(`Batch Delete Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };
}
