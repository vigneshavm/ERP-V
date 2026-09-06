import { injectable } from "tsyringe";
import { AppError } from "../../../utils/AppError.js";
import { IComboOffer } from "../../../interfaces/IComboOffer.js";
import { info } from "../../../config/logger.js";
import ComboOffer from "../models/ComboOffer.js";
import Item from "../../inventory/models/Item.js";

interface ComboOfferInput {
    name: string;
    comboCode?: string;
    description?: string;
    items: { itemId: string; quantity: number }[];
    offerPrice: number;
    validFrom?: string | Date;
    validTo?: string | Date;
    isActive?: boolean;
}

@injectable()
export class ComboOfferService {

    /** Sum of each linked item's current sellingPrice * quantity -- what the bundle would cost bought separately. */
    private async computeRegularPrice(items: { itemId: string; quantity: number }[], tenantId: string): Promise<number> {
        const itemIds = items.map(i => i.itemId);
        const foundItems = await Item.find({ _id: { $in: itemIds }, tenantId });

        if (foundItems.length !== itemIds.length) {
            throw new AppError("One or more items in this combo were not found in your inventory", 400);
        }

        const priceById = new Map(foundItems.map(i => [String(i._id), i.sellingPrice]));
        return items.reduce((sum, line) => sum + (priceById.get(line.itemId) || 0) * line.quantity, 0);
    }

    private generateComboBarcode(comboCode: string): string {
        // Deterministic prefix (so the barcode is traceable back to the offer) plus a short
        // time-based suffix for uniqueness -- combo barcodes are printed once per offer, not
        // per unit, so collision risk is low and a full UUID would be unreadable on a label.
        const suffix = Date.now().toString(36).toUpperCase().slice(-6);
        return `CMB-${comboCode}-${suffix}`;
    }

    async createComboOffer(data: ComboOfferInput, tenantId: string, userId: string): Promise<IComboOffer> {
        if (!data.name || !data.items || data.items.length === 0 || !data.offerPrice) {
            throw new AppError("Name, at least one item, and an offer price are required", 400);
        }

        const comboCode = (data.comboCode || data.name).trim().toUpperCase().replace(/\s+/g, "-").slice(0, 24);

        const existing = await ComboOffer.findOne({ comboCode, tenantId });
        if (existing) {
            throw new AppError(`Combo code "${comboCode}" already exists`, 400);
        }

        const regularPrice = await this.computeRegularPrice(data.items, tenantId);
        if (data.offerPrice > regularPrice) {
            throw new AppError("Offer price cannot exceed the combined regular price of the items", 400);
        }

        const combo = await ComboOffer.create({
            name: data.name,
            comboCode,
            description: data.description,
            items: data.items,
            offerPrice: data.offerPrice,
            regularPrice,
            barcode: this.generateComboBarcode(comboCode),
            validFrom: data.validFrom,
            validTo: data.validTo,
            isActive: data.isActive ?? true,
            tenantId,
            createdBy: userId,
        });

        info(`Combo offer created: ${combo.comboCode} (${combo.name})`);
        return combo;
    }

    async getAllComboOffers(tenantId: string, queryParams: Record<string, any>): Promise<{ combos: IComboOffer[]; total: number; page: number; pages: number }> {
        const page = parseInt(queryParams.page) || 1;
        const limit = parseInt(queryParams.limit) || 20;
        const skip = (page - 1) * limit;

        const query: Record<string, any> = { tenantId };
        if (queryParams.search) {
            query.$or = [
                { name: { $regex: queryParams.search, $options: "i" } },
                { comboCode: { $regex: queryParams.search, $options: "i" } },
            ];
        }
        if (queryParams.isActive !== undefined) {
            query.isActive = queryParams.isActive === "true";
        }

        const [combos, total] = await Promise.all([
            ComboOffer.find(query)
                .populate("items.itemId", "name sku sellingPrice barcode")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ComboOffer.countDocuments(query),
        ]);

        return { combos, total, page, pages: Math.ceil(total / limit) || 1 };
    }

    async getComboOfferById(id: string, tenantId: string): Promise<IComboOffer> {
        const combo = await ComboOffer.findOne({ _id: id, tenantId }).populate("items.itemId", "name sku sellingPrice barcode stockQty");
        if (!combo) {
            throw new AppError("Combo offer not found", 404);
        }
        return combo;
    }

    async updateComboOffer(id: string, tenantId: string, data: Partial<ComboOfferInput>): Promise<IComboOffer> {
        const combo = await ComboOffer.findOne({ _id: id, tenantId });
        if (!combo) {
            throw new AppError("Combo offer not found", 404);
        }

        if (data.items && data.items.length > 0) {
            combo.regularPrice = await this.computeRegularPrice(data.items, tenantId);
            combo.items = data.items as any;
        }

        const nextOfferPrice = data.offerPrice ?? combo.offerPrice;
        if (nextOfferPrice > combo.regularPrice) {
            throw new AppError("Offer price cannot exceed the combined regular price of the items", 400);
        }

        if (data.name !== undefined) combo.name = data.name;
        if (data.description !== undefined) combo.description = data.description;
        if (data.offerPrice !== undefined) combo.offerPrice = data.offerPrice;
        if (data.validFrom !== undefined) combo.validFrom = data.validFrom as Date;
        if (data.validTo !== undefined) combo.validTo = data.validTo as Date;
        if (data.isActive !== undefined) combo.isActive = data.isActive;

        await combo.save();
        info(`Combo offer updated: ${combo.comboCode}`);
        return combo;
    }

    async deleteComboOffer(id: string, tenantId: string): Promise<void> {
        const combo = await ComboOffer.findOneAndDelete({ _id: id, tenantId });
        if (!combo) {
            throw new AppError("Combo offer not found", 404);
        }
        info(`Combo offer deleted: ${combo.comboCode}`);
    }
}
