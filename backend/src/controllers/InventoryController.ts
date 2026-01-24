import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { singleton } from 'tsyringe';

import Item from '../models/Item.js';

import { checkStockAlerts } from '../utils/stockAlert.js';
import { info, error } from '../config/logger.js';

/**
 * Request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
        [key: string]: any;
    };
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
     * @desc Add new item to inventory
     * @route POST /api/inventory
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

            // Check if item already exists for this user
            const existing = await Item.findOne({ name, addedBy: authReq.user?._id });
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
     * @desc Get all items (only for current owner)
     * @route GET /api/inventory
     */
    public getAllItems = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as AuthenticatedRequest;
        try {
            const items = await Item.find({ addedBy: authReq.user?._id }).sort({ createdAt: -1 });
            res.status(200).json(items);
        } catch (err) {
            error(`Get All Items Error: ${(err as Error).message}`);
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };

    /**
     * @desc Get single item by ID
     * @route GET /api/inventory/:id
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
     * @desc Update item
     * @route PUT /api/inventory/:id
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
                    addedBy: authReq.user?._id,
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
     * @desc Delete item
     * @route DELETE /api/inventory/:id
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
     * @desc Get low-stock items (only for current owner)
     * @route GET /api/inventory/low-stock
     */
    public getLowStockItems = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as AuthenticatedRequest;
        try {
            // Get all items and filter by available stock (stockQty - reservedStock)
            const allItems = await Item.find({ addedBy: authReq.user?._id });

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
     * @desc Bulk import items from file
     * @route POST /api/inventory/import
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

            // Pre-fetch all existing items for this user to optimize duplicate checks
            const existingItems = await Item.find({ addedBy: authReq.user?._id }).select('name sku stockQty');
            const existingItemsMap = new Map<string, any>();
            const existingSKUs = new Map<string, any>();

            existingItems.forEach((item: any) => {
                existingItemsMap.set(item.name.toLowerCase(), item);
                if (item.sku) {
                    existingSKUs.set(item.sku.toLowerCase(), item);
                }
            });

            // Check for duplicate SKUs within the import batch
            const importSKUs = new Map<string, number[]>();
            items.forEach((item: ImportItem, index: number) => {
                if (item.sku) {
                    const skuLower = item.sku.toLowerCase();
                    if (importSKUs.has(skuLower)) {
                        importSKUs.get(skuLower)!.push(index + 1);
                    } else {
                        importSKUs.set(skuLower, [index + 1]);
                    }
                }
            });

            for (let i = 0; i < items.length; i++) {
                try {
                    const item: ImportItem = items[i];
                    const rowNum = i + 1;
                    const rowErrors: string[] = [];

                    // Validate required fields
                    if (!item.name || item.name.toString().trim() === '') {
                        rowErrors.push('Item name is required and cannot be blank');
                    }

                    if (!item.costPrice || item.costPrice === '') {
                        rowErrors.push('Cost price is required');
                    } else if (isNaN(Number(item.costPrice)) || parseFloat(String(item.costPrice)) <= 0) {
                        rowErrors.push('Cost price must be a positive number');
                    }

                    if (!item.sellingPrice || item.sellingPrice === '') {
                        rowErrors.push('Selling price is required');
                    } else if (isNaN(Number(item.sellingPrice)) || parseFloat(String(item.sellingPrice)) <= 0) {
                        rowErrors.push('Selling price must be a positive number');
                    }

                    // Validate category - must not be blank
                    if (!item.category || item.category.toString().trim() === '') {
                        rowErrors.push('Category is required and cannot be left blank');
                    }

                    // Validate unit label
                    if (item.unit && item.unit.toString().trim() !== '') {
                        const unitLower = item.unit.toLowerCase().trim();
                        if (!validUnits.includes(unitLower)) {
                            rowErrors.push(
                                `Invalid unit "${item.unit}". Valid units: ${validUnits.join(', ')}`
                            );
                        }
                    }

                    // Check for duplicate SKU within the import batch only if stock is being added
                    if (item.sku && item.sku.toString().trim() !== '') {
                        const skuLower = item.sku.toLowerCase().trim();
                        const duplicateRows = importSKUs.get(skuLower);
                        if (duplicateRows && duplicateRows.length > 1) {
                            const otherRows = duplicateRows.filter(r => r !== rowNum);
                            if (otherRows.length > 0) {
                                rowErrors.push(
                                    `SKU "${item.sku}" is duplicated in this import file (rows: ${duplicateRows.join(', ')}). Each SKU must be unique within the import`
                                );
                            }
                        }
                    }

                    // If there are validation errors, skip this item
                    if (rowErrors.length > 0) {
                        results.validationErrors.push({
                            row: rowNum,
                            itemName: item.name || 'Unknown',
                            sku: item.sku || 'N/A',
                            errors: rowErrors
                        });
                        results.skipped++;
                        continue;
                    }

                    // Check if item already exists by SKU (if SKU provided) or by name
                    let existingItem = null;
                    if (item.sku && item.sku.toString().trim() !== '') {
                        const skuLower = item.sku.toLowerCase().trim();
                        existingItem = existingSKUs.get(skuLower);
                    }

                    // Fallback to name if no SKU match
                    if (!existingItem && item.name) {
                        const nameLower = item.name.toLowerCase().trim();
                        existingItem = existingItemsMap.get(nameLower);
                    }

                    if (existingItem) {
                        // Item exists - UPDATE stock quantity by adding new quantity to existing
                        const newStockQty = (existingItem.stockQty || 0) + (item.stockQty ? parseInt(String(item.stockQty)) : 0);

                        await Item.findByIdAndUpdate(
                            existingItem._id,
                            {
                                stockQty: newStockQty,
                                // Update other fields if they are better/more recent
                                category: (item.category as string).trim() || existingItem.category,
                                unit: item.unit ? item.unit.toLowerCase().trim() : existingItem.unit,
                                costPrice: item.costPrice || existingItem.costPrice,
                                sellingPrice: item.sellingPrice || existingItem.sellingPrice,
                            },
                            { new: true }
                        );

                        info(`Item stock updated by ${authReq.user?.name}: ${existingItem.name} - Added ${item.stockQty || 0} units (Total: ${newStockQty})`);
                        results.updated++;
                    } else {
                        // Item doesn't exist - CREATE new item
                        await Item.create({
                            name: (item.name as string).trim(),
                            sku: item.sku ? item.sku.trim() : undefined,
                            category: (item.category as string).trim(),
                            costPrice: parseFloat(String(item.costPrice)),
                            sellingPrice: parseFloat(String(item.sellingPrice)),
                            stockQty: item.stockQty ? parseInt(String(item.stockQty)) : 0,
                            unit: item.unit ? item.unit.toLowerCase().trim() : 'pcs',
                            addedBy: authReq.user?._id
                        });

                        info(`Item created by ${authReq.user?.name}: ${item.name}`);
                        results.imported++;
                    }
                } catch (itemError) {
                    results.errors.push({
                        row: i + 1,
                        itemName: items[i].name || 'Unknown',
                        error: (itemError as Error).message
                    });
                    results.skipped++;
                }
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
            res.status(500).json({ message: 'Server Error', error: (err as Error).message });
        }
    };
}
