import Item from '../models/Item.js';
import { ICategory, IQueryFilters, IStats } from '../interfaces/category.types.js';
import mongoose from 'mongoose';

export class CategoryService {
    public async findAll(tenantId: string, filters: IQueryFilters): Promise<{ data: ICategory[]; total: number }> {
        const { page = 1, limit = 25, search = '', sortBy = 'name', sortOrder = 'asc' } = filters;

        const skip = (page - 1) * limit;

        const matchStage: any = { tenantId: new mongoose.Types.ObjectId(tenantId) };
        if (search) {
            matchStage.category = { $regex: search, $options: 'i' };
        }

        const aggregation: any[] = [
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
        ];

        // 1. Get total categories count
        const countResult = await Item.aggregate([...aggregation, { $count: "total" }]);
        const total = countResult[0]?.total || 0;

        // 2. Sorting and Pagination
        const sortField = sortBy === 'stockValue' ? 'stockValue' : (sortBy === 'itemCount' ? 'itemCount' : '_id');
        aggregation.push({ $sort: { [sortField]: sortOrder === 'asc' ? 1 : -1 } });
        aggregation.push({ $skip: skip });
        aggregation.push({ $limit: limit });

        const results = await Item.aggregate(aggregation);

        const data: ICategory[] = results.map(r => ({
            id: r._id || 'Uncategorized',
            name: r._id || 'Uncategorized',
            itemCount: r.itemCount,
            stockValue: r.stockValue,
            gstRate: Math.round(r.gstRate || 5),
            status: r.isActive ? 'ACTIVE' : 'ARCHIVED',
            health: r.stockValue > 100000 ? 'OVERSTOCKED' : 'HEALTHY',
            created_at: new Date(),
            isActive: r.isActive
        } as ICategory));

        return { data, total };
    }

    public async getStats(tenantId: string): Promise<IStats> {
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

        if (stats.length === 0) {
            return {
                totalCategories: 0,
                totalItems: 0,
                totalStockValue: 0,
                avgItemsPerCategory: 0
            };
        }

        const s = stats[0];
        const totalCategories = s.categories.length;

        return {
            totalCategories,
            totalItems: s.totalItems,
            totalStockValue: s.totalStockValue,
            avgItemsPerCategory: totalCategories > 0 ? Math.round(s.totalItems / totalCategories) : 0
        };
    }
}
