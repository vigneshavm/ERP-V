var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable, singleton } from "tsyringe";
import Supplier from '@smarterp/core/modules/crm/models/Supplier.js';
let SupplierRepository = class SupplierRepository {
    async create(supplierData) {
        return Supplier.create(supplierData);
    }
    async findById(id, userId) {
        return Supplier.findOne({ _id: id, owner: userId });
    }
    async findByContactNo(contactNo, userId) {
        return Supplier.findOne({ contactNo, owner: userId });
    }
    async findByEmail(email, userId) {
        return Supplier.findOne({ email, owner: userId });
    }
    async findByContactNoExcludingId(contactNo, userId, excludeId) {
        return Supplier.findOne({ contactNo, owner: userId, _id: { $ne: excludeId } });
    }
    async findByEmailExcludingId(email, userId, excludeId) {
        return Supplier.findOne({ email, owner: userId, _id: { $ne: excludeId } });
    }
    async findAll(userId) {
        return Supplier.find({ owner: userId }).sort({ businessName: 1 });
    }
    async findLatest(userId) {
        return Supplier.findOne({ owner: userId }).sort({ supplierId: -1 });
    }
    async update(id, userId, updateData) {
        return Supplier.findOneAndUpdate({ _id: id, owner: userId }, updateData, { new: true });
    }
    async delete(id, userId) {
        return Supplier.findOneAndDelete({ _id: id, owner: userId });
    }
};
SupplierRepository = __decorate([
    injectable(),
    singleton()
], SupplierRepository);
export { SupplierRepository };
