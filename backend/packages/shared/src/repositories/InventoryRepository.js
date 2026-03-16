var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable, singleton } from "tsyringe";
import Item from '@smarterp/core/modules/inventory/models/Item.js';
let InventoryRepository = class InventoryRepository {
    async create(itemData) {
        return Item.create(itemData);
    }
    async findById(id, tenantId) {
        return Item.findOne({ _id: id, tenantId });
    }
    async findByName(name, tenantId) {
        return Item.findOne({ name, tenantId });
    }
    async findByNameExcludingId(name, tenantId, excludeId) {
        return Item.findOne({ name, tenantId, _id: { $ne: excludeId } });
    }
    async findAll(tenantId, query = {}) {
        return Item.find({ ...query, tenantId }).sort({ createdAt: -1 });
    }
    async findWithPagination(tenantId, query, skip, limit) {
        const [items, total] = await Promise.all([
            Item.find({ ...query, tenantId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Item.countDocuments({ ...query, tenantId })
        ]);
        return [items, total];
    }
    async findAllLean(tenantId) {
        return Item.find({ tenantId }).select('name sku stockQty category unit costPrice sellingPrice').lean();
    }
    async getLowStockItems(tenantId) {
        return Item.find({
            tenantId,
            $expr: {
                $lte: [
                    { $subtract: ["$stockQty", { $ifNull: ["$reservedStock", 0] }] },
                    "$lowStockLimit"
                ]
            }
        });
    }
    async update(id, tenantId, updateData) {
        return Item.findOneAndUpdate({ _id: id, tenantId }, updateData, { new: true });
    }
    async delete(id, tenantId) {
        return Item.findOneAndDelete({ _id: id, tenantId });
    }
    async findByParentId(parentId, tenantId) {
        return Item.find({ parentId, tenantId }).sort({ createdAt: -1 });
    }
    async findByQuery(query) {
        return Item.find(query);
    }
};
InventoryRepository = __decorate([
    injectable(),
    singleton()
], InventoryRepository);
export { InventoryRepository };
