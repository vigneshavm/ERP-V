var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable, singleton } from "tsyringe";
import Invoice from '@smarterp/core/modules/sales/models/Invoice.js';
let InvoiceRepository = class InvoiceRepository {
    async create(invoiceData) {
        return Invoice.create(invoiceData);
    }
    async findById(id, userId) {
        return Invoice.findOne({ _id: id, createdBy: userId })
            .populate("customer")
            .populate("items.item", "name sku");
    }
    async findAll(userId) {
        return Invoice.find({
            createdBy: userId,
            isDeleted: { $ne: true }
        })
            .populate("customer", "name phone")
            .sort({ createdAt: -1 });
    }
    async findAllPaginated(userId, page, limit, sort) {
        const skip = (page - 1) * limit;
        const query = {
            createdBy: userId,
            isDeleted: { $ne: true }
        };
        const [data, total] = await Promise.all([
            Invoice.find(query)
                .populate("customer", "name phone")
                .sort(sort)
                .skip(skip)
                .limit(limit),
            Invoice.countDocuments(query)
        ]);
        return { data, total };
    }
    async update(id, userId, updateData) {
        return Invoice.findOneAndUpdate({ _id: id, createdBy: userId }, updateData, { new: true });
    }
    async delete(id, userId) {
        // Soft delete logic is usually business logic, but repo supports update or direct delete
        // We'll use update for soft delete
        return Invoice.findOneAndUpdate({ _id: id, createdBy: userId }, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: userId
        }, { new: true });
    }
    async count(userId) {
        return Invoice.countDocuments({ createdBy: userId });
    }
};
InvoiceRepository = __decorate([
    injectable(),
    singleton()
], InvoiceRepository);
export { InvoiceRepository };
