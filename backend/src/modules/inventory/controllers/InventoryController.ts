import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { singleton } from 'tsyringe';

import Item from '../models/Item.js';

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
                        namesToFind.push(nameLower); // Should we find by nameLower? MongoDB is case sensitive? 
                        // Note: Original code used existingItemsMap with .toLowerCase() keys.
                        // We will need case-insensitive regex search or assume names are stored/searched consistently.
                        // For better performance with indexes, we should rely on exact match or simplified regex.
                        // Let's stick to exact match or regex for now. Optimization: exact match if possible, but user might care about case.
                        // In original code: existingItemsMap.set(item.name.toLowerCase(), item);
                    }
                }
            });

            // 2. Fetch efficiently only potentially colliding items
            // We use regex for case-insensitive matching to match original logic behavior
            // Warning: Huge lists of regex might be slow, but better than loading all.
            // A better approach is to rely on Normalization if the app enforced it.
            // For now, let's fetch matching names/SKUs.

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
                        // Mark as error only once per group? No, every row that is a duplicate except the first one?
                        // Original logic: "Each SKU must be unique within the import".
                        // If I have row 1 and 2 with same SKU, both are duplicates? or just 2?
                        // Simple logic: if count > 1, abort this row? Or allow first one?
                        // Let's assume user wants to merge or clean data. 
                        // Existing logic: "SKU ... is duplicated... (rows: ...)"
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
                                    // Optional: Update name/sku if they differ in case but matched?
                                    // Let's keep existing name/sku to avoid confusion or accidental renames
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
            // If bulk write failed, some might have succeeded. 
            res.status(500).json({ message: 'Server Error during import', error: (err as Error).message });
        }
    };
}
