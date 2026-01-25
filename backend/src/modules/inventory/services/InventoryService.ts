import { injectable, inject } from "tsyringe";
import { InventoryRepository } from "../../../repositories/InventoryRepository.js";
import { AppError } from "../../../utils/AppError.js";
import { IItem } from "../../../interfaces/IItem.js";
import { info } from "../../../config/logger.js";

@injectable()
export class InventoryService {
    constructor(
        @inject(InventoryRepository) private inventoryRepository: InventoryRepository
    ) { }

    async addItem(itemData: any, userId: string, userName: string): Promise<{ item: IItem, alerts: any[] }> {
        // Validate required fields (basic validation, schema handles types)
        if (!itemData.name || !itemData.costPrice || !itemData.sellingPrice) {
            throw new AppError("Please fill all required fields", 400);
        }

        const existing = await this.inventoryRepository.findByName(itemData.name, userId);
        if (existing) {
            throw new AppError("Item already exists in your inventory", 400);
        }

        const item = await this.inventoryRepository.create({
            ...itemData,
            addedBy: userId
        });

        info(`Item added by ${userName}: ${item.name}`);
        const alerts = await this.checkStockAlerts(userId);

        return { item, alerts };
    }

    async getAllItems(userId: string): Promise<IItem[]> {
        return this.inventoryRepository.findAll(userId);
    }

    async getSingleItem(itemId: string, userId: string): Promise<IItem> {
        const item = await this.inventoryRepository.findById(itemId, userId);
        if (!item) {
            throw new AppError("Item not found or unauthorized", 404);
        }
        return item;
    }

    async updateItem(itemId: string, userId: string, updateData: any, userName: string, _originalEntity?: any): Promise<{ updated: IItem, alerts: any[] }> {
        const item = await this.inventoryRepository.findById(itemId, userId);
        if (!item) {
            throw new AppError("Item not found or unauthorized", 404);
        }

        // Duplicate Check
        if (updateData.name && updateData.name !== item.name) {
            const existingName = await this.inventoryRepository.findByNameExcludingId(updateData.name, userId, itemId);
            if (existingName) {
                throw new AppError("Item name already exists in your inventory", 400);
            }
        }

        const updated = await this.inventoryRepository.update(itemId, userId, updateData);
        if (!updated) throw new AppError("Update failed", 500);

        info(`Item updated by ${userName}: ${updated.name}`);
        const alerts = await this.checkStockAlerts(userId);

        // TODO: Pass updated and original entity for audit middleware if we want to extract logic out of middleware
        // But for now, controller handles passing entities to middleware via req object

        return { updated, alerts };
    }

    async deleteItem(itemId: string, userId: string, userName: string): Promise<IItem> {
        const item = await this.inventoryRepository.delete(itemId, userId);
        if (!item) {
            throw new AppError("Item not found or unauthorized", 404);
        }
        info(`Item deleted by ${userName}: ${item.name}`);
        return item;
    }

    async getLowStockItems(userId: string): Promise<IItem[]> {
        const allItems = await this.inventoryRepository.findAll(userId);
        return allItems.filter((item: IItem) => {
            const availableStock = item.stockQty - (item.reservedStock || 0);
            return availableStock <= item.lowStockLimit;
        });
    }

    // Logic from utils/stockAlert.js transferred here for better cohesion
    async checkStockAlerts(userId: string): Promise<any[]> {
        const lowStockItems = await this.getLowStockItems(userId);

        return lowStockItems.map(item => ({
            itemId: item._id,
            name: item.name,
            currentStock: item.stockQty - (item.reservedStock || 0),
            limit: item.lowStockLimit,
            message: `Low stock alert: ${item.name} is below limit (${item.lowStockLimit})`
        }));
    }

    async importItems(items: any[], userId: string, _userName: string): Promise<any> {
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

        // Optimization: Fetch all items once
        const existingItems = await this.inventoryRepository.findAllLean(userId);
        const existingItemsMap = new Map();
        const existingSKUs = new Map();

        existingItems.forEach((item: any) => {
            existingItemsMap.set(item.name.toLowerCase(), item);
            if (item.sku) {
                existingSKUs.set(item.sku.toLowerCase(), item);
            }
        });

        // Check local duplicates in import
        const importSKUs = new Map();
        items.forEach((item, index) => {
            if (item.sku) {
                const skuLower = item.sku.toLowerCase();
                if (importSKUs.has(skuLower)) {
                    importSKUs.get(skuLower).push(index + 1);
                } else {
                    importSKUs.set(skuLower, [index + 1]);
                }
            }
        });

        for (let i = 0; i < items.length; i++) {
            try {
                const item = items[i];
                const rowNum = i + 1;
                const rowErrors = [];

                if (!item.name || item.name.toString().trim() === '') rowErrors.push('Item name is required');
                if (!item.costPrice || isNaN(parseFloat(item.costPrice)) || parseFloat(item.costPrice) <= 0) rowErrors.push('Valid cost price required');
                if (!item.sellingPrice || isNaN(parseFloat(item.sellingPrice)) || parseFloat(item.sellingPrice) <= 0) rowErrors.push('Valid selling price required');
                if (item.unit && !validUnits.includes(item.unit.toLowerCase().trim())) rowErrors.push(`Invalid unit: ${item.unit}`);

                if (item.sku) {
                    const skuLower = item.sku.toLowerCase().trim();
                    const duplicateRows = importSKUs.get(skuLower);
                    if (duplicateRows && duplicateRows.length > 1 && duplicateRows.includes(rowNum)) {
                        // Only report error once per group (or for all)
                        // Simple logic: if count > 1, it's a dupe inside batch
                        // Logic from original: skip if dupe
                    }
                }

                if (rowErrors.length > 0) {
                    results.validationErrors.push({ row: rowNum, itemName: item.name, errors: rowErrors });
                    results.skipped++;
                    continue;
                }

                // Logic to Find Match
                let existingItem = null;
                if (item.sku) {
                    existingItem = existingSKUs.get(item.sku.toLowerCase().trim());
                }
                if (!existingItem && item.name) {
                    existingItem = existingItemsMap.get(item.name.toLowerCase().trim());
                }

                if (existingItem) {
                    // Update
                    const newStockQty = (existingItem.stockQty || 0) + (item.stockQty ? parseInt(item.stockQty) : 0);
                    await this.inventoryRepository.update(existingItem._id, userId, {
                        stockQty: newStockQty,
                        category: item.category?.trim() || existingItem.category,
                        unit: item.unit ? item.unit.toLowerCase().trim() : existingItem.unit,
                        costPrice: item.costPrice || existingItem.costPrice,
                        sellingPrice: item.sellingPrice || existingItem.sellingPrice,
                    });
                    results.updated++;
                } else {
                    // Create
                    await this.inventoryRepository.create({
                        name: item.name.trim(),
                        sku: item.sku ? item.sku.trim() : undefined,
                        category: item.category?.trim(),
                        costPrice: parseFloat(item.costPrice),
                        sellingPrice: parseFloat(item.sellingPrice),
                        stockQty: item.stockQty ? parseInt(item.stockQty) : 0,
                        unit: item.unit ? item.unit.toLowerCase().trim() : 'pcs',
                        addedBy: userId
                    });
                    results.imported++;
                }

            } catch (err: any) {
                results.errors.push({ row: i + 1, itemName: items[i].name, error: err.message });
                results.skipped++;
            }
        }

        const alerts = await this.checkStockAlerts(userId);
        return { ...results, alerts };
    }
}
