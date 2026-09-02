import Item from '../models/Item.js';
import Category from '../models/Category.js';
import ProductCategoryModel from '../models/ProductCategory.js';
import BusinessSector from '../../core/models/BusinessSector.js';
import { SHORT_CODE_TO_FULL_NAME } from '../../core/data/sectorCategorySeedData.js';
import { ICategory, IQueryFilters, IStats } from '../interfaces/category.types.js';
import { AppError } from '../../../utils/AppError.js';
import mongoose from 'mongoose';

// Escapes regex metacharacters in user-supplied text before it's dropped into
// a $regex filter, so a name like "1+1" or "(sale)" can't break the query or
// be used to smuggle in an unintended pattern.
const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class CategoryService {
    public async findAll(tenantId: string, filters: IQueryFilters): Promise<{ data: ICategory[]; total: number }> {
        const { page = 1, limit = 25, search = '', sortBy = 'name', sortOrder = 'asc', sector } = filters;

        const matchStage: any = { tenantId: new mongoose.Types.ObjectId(tenantId) };
        if (search) {
            matchStage.category = { $regex: escapeRegex(search), $options: 'i' };
        }

        // 1. Categories derived from items actually in stock (existing behavior).
        const itemDerived = await Item.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$category",
                    itemCount: { $sum: 1 },
                    stockValue: { $sum: { $multiply: ["$stockQty", { $ifNull: ["$costPrice", 0] }] } },
                    gstRate: { $avg: { $ifNull: ["$gstRate", 5] } },
                    isActive: { $max: "$isActive" }, // If any item is active, category is considered active for UI
                    totalQty: { $sum: "$stockQty" }
                }
            }
        ]);

        // 2. Categories registered via "New Category" that may not have any
        // items yet (or ever) — these don't show up in the aggregation above
        // at all, since it only groups over existing Item documents.
        const registryQuery: any = { tenantId };
        if (search) {
            registryQuery.name = { $regex: escapeRegex(search), $options: 'i' };
        }
        const registered = await Category.find(registryQuery).lean();
        // Every name backed by an actual Category document for this tenant --
        // used below so the merged response can tell a caller (e.g. Settings'
        // "already added" check) apart from a name that only shows up because
        // an Item uses it or because it's sector master data.
        const registeredNames = new Set(registered.map(doc => doc.name.toLowerCase()));

        // 2b. Categories mapped to the tenant's business sector via the
        // Business Sector -> Product Category settings feature (e.g.
        // "Textile & Garments Retail"'s full Product Type list). These are
        // sector-wide master data with no tenantId of their own, matched
        // through BusinessSector.shortCode against the short Sector code
        // (Tenant.sector, e.g. 'Textile') that the frontend sends as
        // `filters.sector` - NOT the long BusinessSector.name.
        let sectorMapped: Array<{ name: string; description?: string; gstRate?: number; defaultUnit?: string; status?: string; createdAt?: Date }> = [];
        if (sector && sector !== 'General') {
            const fullSectorName = SHORT_CODE_TO_FULL_NAME[sector] || sector;
            const businessSector = await BusinessSector.findOne({
                $or: [
                    { shortCode: sector },
                    { name: fullSectorName },
                    { name: sector }
                ],
                status: 'ACTIVE'
            }).lean();
            if (businessSector) {
                const sectorCatQuery: any = { businessSectorId: businessSector._id, status: 'ACTIVE' };
                if (search) {
                    sectorCatQuery.name = { $regex: escapeRegex(search), $options: 'i' };
                }
                sectorMapped = await ProductCategoryModel.find(sectorCatQuery).lean();
            }
        }

        // 3. Merge by name (case-insensitive) — a category can exist in both
        // places (registered ahead of time, then items were added to it).
        // Item-derived stats win when both exist; registry-only categories
        // report zero stock since nothing has been added to them yet.
        const merged = new Map<string, ICategory>();
        for (const r of itemDerived) {
            const name = r._id || 'Uncategorized';
            merged.set(name.toLowerCase(), {
                id: name,
                name,
                itemCount: r.itemCount,
                stockValue: r.stockValue,
                gstRate: Math.round(r.gstRate || 5),
                status: r.isActive ? 'ACTIVE' : 'ARCHIVED',
                health: r.stockValue > 100000 ? 'OVERSTOCKED' : 'HEALTHY',
                created_at: new Date(),
                isActive: r.isActive,
                isRegistered: registeredNames.has(name.toLowerCase())
            } as ICategory);
        }
        for (const doc of registered) {
            const key = doc.name.toLowerCase();
            const existing = merged.get(key);
            if (existing) {
                // Enrich the item-derived row with registry metadata that the
                // aggregation has no way to know (description/color/unit).
                existing.description = doc.description;
                existing.color = doc.color;
                existing.defaultUnit = doc.defaultUnit;
                existing.isRegistered = true;
            } else {
                merged.set(key, {
                    id: doc.name,
                    name: doc.name,
                    itemCount: 0,
                    stockValue: 0,
                    gstRate: doc.gstRate ?? 5,
                    status: doc.isActive ? 'ACTIVE' : 'ARCHIVED',
                    health: 'HEALTHY',
                    created_at: (doc as any).createdAt || new Date(),
                    description: doc.description,
                    color: doc.color,
                    defaultUnit: doc.defaultUnit,
                    isActive: doc.isActive,
                    isRegistered: true
                } as ICategory);
            }
        }
        // Sector-mapped master categories fill in names not already covered
        // by real tenant data (item-derived or manually registered) — they
        // never overwrite an existing entry, since actual stock/registration
        // is always more authoritative than the sector's generic mapping.
        for (const cat of sectorMapped) {
            const key = cat.name.toLowerCase();
            if (!merged.has(key)) {
                merged.set(key, {
                    id: cat.name,
                    name: cat.name,
                    itemCount: 0,
                    stockValue: 0,
                    gstRate: cat.gstRate ?? 5,
                    status: cat.status === 'INACTIVE' ? 'ARCHIVED' : 'ACTIVE',
                    health: 'HEALTHY',
                    created_at: cat.createdAt || new Date(),
                    description: cat.description,
                    // Sector-mapped master categories have no registered color of
                    // their own (unlike Category docs created via "New Category");
                    // fall back to a neutral swatch instead of leaving it
                    // undefined, since the UI's color chip expects a real value.
                    color: '#94a3b8',
                    defaultUnit: cat.defaultUnit,
                    isActive: cat.status !== 'INACTIVE',
                    isRegistered: registeredNames.has(key),
                    sector
                } as ICategory);
            }
        }

        let data = Array.from(merged.values());
        const total = data.length;

        // 4. Sort + paginate the merged set in application code. Category
        // counts are small (tens, not thousands) for a real tenant, so this
        // is cheap — and it's the only way to sort/paginate correctly across
        // two different data sources without a much heavier aggregation.
        const sortField: keyof ICategory = sortBy === 'stockValue' ? 'stockValue' : (sortBy === 'itemCount' ? 'itemCount' : 'name');
        data.sort((a, b) => {
            const av = a[sortField];
            const bv = b[sortField];
            let cmp = 0;
            if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
            else cmp = String(av ?? '').localeCompare(String(bv ?? ''));
            return sortOrder === 'asc' ? cmp : -cmp;
        });

        const skip = (page - 1) * limit;
        data = data.slice(skip, skip + limit);

        return { data, total };
    }

    public async createCategory(tenantId: string, payload: {
        name: string;
        description?: string;
        color?: string;
        gstRate?: number;
        defaultUnit?: string;
    }): Promise<ICategory> {
        const name = (payload.name || '').trim();
        if (!name) {
            throw new AppError('Category name is required', 400);
        }

        const existing = await Category.findOne({
            tenantId,
            name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' }
        });
        if (existing) {
            throw new AppError('A category with this name already exists', 400);
        }

        // Also guard against an item-derived category of the same name — the
        // two lists are merged case-insensitively in findAll, so allowing a
        // duplicate here would just silently vanish behind the existing row.
        const existingOnItems = await Item.findOne({
            tenantId,
            category: { $regex: `^${escapeRegex(name)}$`, $options: 'i' }
        });
        if (existingOnItems) {
            throw new AppError('A category with this name already exists on your items', 400);
        }

        const doc = await Category.create({
            name,
            description: payload.description?.trim() || undefined,
            color: payload.color || '#6366f1',
            gstRate: payload.gstRate ?? 5,
            defaultUnit: payload.defaultUnit?.trim() || 'pcs',
            isActive: true,
            tenantId,
        });

        return {
            id: doc.name,
            name: doc.name,
            itemCount: 0,
            stockValue: 0,
            gstRate: doc.gstRate,
            status: 'ACTIVE',
            health: 'HEALTHY',
            created_at: (doc as any).createdAt || new Date(),
            description: doc.description,
            color: doc.color,
            defaultUnit: doc.defaultUnit,
            isActive: doc.isActive
        } as ICategory;
    }

    public async getStats(tenantId: string, sector?: string): Promise<IStats> {
        const stats = await Item.aggregate([
            { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
            {
                $group: {
                    _id: null,
                    totalItems: { $sum: 1 },
                    totalStockValue: { $sum: { $multiply: ["$stockQty", { $ifNull: ["$costPrice", 0] }] } },
                    categories: { $addToSet: "$category" }
                }
            }
        ]);

        const registeredNames = await Category.distinct('name', { tenantId });

        let sectorMappedNames: string[] = [];
        if (sector && sector !== 'General') {
            const fullSectorName = SHORT_CODE_TO_FULL_NAME[sector] || sector;
            const businessSector = await BusinessSector.findOne({
                $or: [
                    { shortCode: sector },
                    { name: fullSectorName },
                    { name: sector }
                ],
                status: 'ACTIVE'
            }).lean();
            if (businessSector) {
                sectorMappedNames = await ProductCategoryModel.distinct('name', { businessSectorId: businessSector._id, status: 'ACTIVE' });
            }
        }

        const itemCategoryNames: string[] = stats.length > 0 ? (stats[0].categories || []).filter(Boolean) : [];
        const distinctNames = new Set([
            ...itemCategoryNames.map(n => n.toLowerCase()),
            ...registeredNames.map(n => n.toLowerCase()),
            ...sectorMappedNames.map(n => n.toLowerCase())
        ]);
        const totalCategories = distinctNames.size;

        if (stats.length === 0) {
            return {
                totalCategories,
                totalItems: 0,
                totalStockValue: 0,
                avgItemsPerCategory: 0
            };
        }

        const s = stats[0];

        return {
            totalCategories,
            totalItems: s.totalItems,
            totalStockValue: s.totalStockValue,
            avgItemsPerCategory: totalCategories > 0 ? Math.round(s.totalItems / totalCategories) : 0
        };
    }
}
