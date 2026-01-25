import { injectable, singleton } from "tsyringe";
import Item from "../modules/inventory/models/Item.js";
import { IItem } from "../interfaces/IItem.js";

@injectable()
@singleton()
export class InventoryRepository {
    async create(itemData: Partial<IItem>): Promise<IItem> {
        return Item.create(itemData);
    }

    async findById(id: string, userId: string): Promise<IItem | null> {
        return Item.findOne({ _id: id, addedBy: userId });
    }

    async findByName(name: string, userId: string): Promise<IItem | null> {
        return Item.findOne({ name, addedBy: userId });
    }

    // For update check excluding current ID
    async findByNameExcludingId(name: string, userId: string, excludeId: string): Promise<IItem | null> {
        return Item.findOne({ name, addedBy: userId, _id: { $ne: excludeId } });
    }

    async findAll(userId: string): Promise<IItem[]> {
        return Item.find({ addedBy: userId }).sort({ createdAt: -1 });
    }

    async findAllLean(userId: string): Promise<any[]> {
        return Item.find({ addedBy: userId }).select('name sku stockQty category unit costPrice sellingPrice').lean();
    }

    async update(id: string, userId: string, updateData: Partial<IItem>): Promise<IItem | null> {
        return Item.findOneAndUpdate(
            { _id: id, addedBy: userId },
            updateData,
            { new: true }
        );
    }

    async delete(id: string, userId: string): Promise<IItem | null> {
        return Item.findOneAndDelete({ _id: id, addedBy: userId });
    }
}
