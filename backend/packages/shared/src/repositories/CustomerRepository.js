var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable, singleton } from "tsyringe";
import Customer from '@smarterp/core/modules/crm/models/Customer.js';
let CustomerRepository = class CustomerRepository {
    async create(customerData) {
        return Customer.create(customerData);
    }
    async findById(id, userId) {
        return Customer.findOne({ _id: id, owner: userId }).populate("referredBy", "name phone");
    }
    async findByPhone(phone, userId) {
        return Customer.findOne({ phone, owner: userId });
    }
    async findByEmail(email, userId) {
        return Customer.findOne({ email, owner: userId });
    }
    async findByPhoneExcludingId(phone, userId, excludeId) {
        return Customer.findOne({ phone, owner: userId, _id: { $ne: excludeId } });
    }
    async findByEmailExcludingId(email, userId, excludeId) {
        return Customer.findOne({ email, owner: userId, _id: { $ne: excludeId } });
    }
    async findAll(userId) {
        return Customer.find({ owner: userId })
            .populate("referredBy", "name phone")
            .sort({ name: 1 });
    }
    async update(id, userId, updateData) {
        return Customer.findOneAndUpdate({ _id: id, owner: userId }, updateData, { new: true });
    }
    async delete(id, userId) {
        return Customer.findOneAndDelete({ _id: id, owner: userId });
    }
};
CustomerRepository = __decorate([
    injectable(),
    singleton()
], CustomerRepository);
export { CustomerRepository };
