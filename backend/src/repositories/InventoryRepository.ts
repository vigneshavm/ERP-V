import { injectable, singleton } from "tsyringe";
import Item from "../modules/inventory/models/Item.js";
import { IItem } from "../interfaces/IItem.js";

@injectable()
@singleton()
export class InventoryRepository {
    async create(itemData: Partial<IItem>): Promise<IItem> {
        return Item.create(itemData);
    }

    async findById(id: string, tenantId: string, session?: any): Promise<IItem | null> {
        return Item.findOne({ _id: id, tenantId }).session(session || null);
    }

    async findByName(name: string, tenantId: string): Promise<IItem | null> {
        return Item.findOne({ name, tenantId });
    }

    async findByNameExcludingId(name: string, tenantId: string, excludeId: string): Promise<IItem | null> {
        return Item.findOne({ name, tenantId, _id: { $ne: excludeId } });
    }

    async findAll(tenantId: string, query: any = {}): Promise<IItem[]> {
        return Item.find({ ...query, tenantId }).sort({ createdAt: -1 });
    }

    async findWithPagination(tenantId: string, query: any, skip: number, limit: number): Promise<[IItem[], number]> {
        const [items, total] = await Promise.all([
            Item.find({ ...query, tenantId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean() as unknown as IItem[],
            Item.countDocuments({ ...query, tenantId })
        ]);
        return [items, total];
    }

    async findAllLean(tenantId: string): Promise<any[]> {
        return Item.find({ tenantId }).select('name sku stockQty category unit costPrice sellingPrice').lean();
    }

    async getLowStockItems(tenantId: string): Promise<IItem[]> {
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

    async update(id: string, tenantId: string, updateData: Partial<IItem>, session?: any): Promise<IItem | null> {
        return Item.findOneAndUpdate(
            { _id: id, tenantId },
            updateData,
            { new: true, session }
        );
    }

    async delete(id: string, tenantId: string): Promise<IItem | null> {
        return Item.findOneAndDelete({ _id: id, tenantId });
    }

    async findByQuery(query: any): Promise<IItem[]> {
        return Item.find(query);
    }
}
