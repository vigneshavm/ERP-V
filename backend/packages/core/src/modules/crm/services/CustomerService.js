var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { injectable, inject } from "tsyringe";
import { CustomerRepository } from '@smarterp/shared/repositories/CustomerRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { info } from '@smarterp/shared/config/logger.js';
import { invalidateUserCache } from '@smarterp/shared/config/cache.js'; // Added import for invalidateUserCache
import Transaction from '@smarterp/core/modules/sales/models/Transaction.js'; // Using Mongoose model directly for mock/simple access
let CustomerService = class CustomerService {
    customerRepository;
    constructor(customerRepository) {
        this.customerRepository = customerRepository;
    }
    async invalidateCustomerCache(userId) {
        await invalidateUserCache(userId, '/api/crm/customers*');
        await invalidateUserCache(userId, '/api/reports*');
    }
    async addCustomer(customerData, userId, userName) {
        const { name, phone, email, address, referredBy } = customerData;
        if (!name || !phone) {
            throw new AppError("Name and phone are required", 400);
        }
        // Basic phone validation (as per original code: check length and if number)
        if (phone.length !== 10 || !/^\d+$/.test(phone)) {
            throw new AppError("Phone is not valid (must be 10 digits)", 400);
        }
        // Check duplicates
        const existingPhone = await this.customerRepository.findByPhone(phone, userId);
        if (existingPhone) {
            throw new AppError("Phone number already exists in your customer list", 400);
        }
        if (email) {
            const existingEmail = await this.customerRepository.findByEmail(email, userId);
            if (existingEmail) {
                throw new AppError("Email already exists in your customer list", 400);
            }
        }
        const customer = await this.customerRepository.create({
            name, phone, email, address, referredBy: referredBy || null,
            owner: userId
        });
        info(`New customer added by ${userName}: ${name} (${email || "no email"})`);
        await this.invalidateCustomerCache(userId);
        return customer;
    }
    async getAllCustomers(userId) {
        return this.customerRepository.findAll(userId);
    }
    async getCustomerById(customerId, userId) {
        const customer = await this.customerRepository.findById(customerId, userId);
        if (!customer) {
            throw new AppError("Customer not found or unauthorized", 404);
        }
        return customer;
    }
    async updateCustomer(customerId, userId, updateData, userName) {
        const customer = await this.customerRepository.findById(customerId, userId);
        if (!customer) {
            throw new AppError("Customer not found or unauthorized", 404);
        }
        // Duplicate checks
        if (updateData.phone && updateData.phone !== customer.phone) {
            const existingPhone = await this.customerRepository.findByPhoneExcludingId(updateData.phone, userId, customerId);
            if (existingPhone)
                throw new AppError("Phone number already exists", 400);
        }
        if (updateData.email && updateData.email !== customer.email) {
            const existingEmail = await this.customerRepository.findByEmailExcludingId(updateData.email, userId, customerId);
            if (existingEmail)
                throw new AppError("Email already exists", 400);
        }
        const updated = await this.customerRepository.update(customerId, userId, updateData);
        if (!updated)
            throw new AppError("Update failed", 500);
        info(`Customer updated by ${userName}: ${updated.name} (${updated.email || "no email"})`);
        await this.invalidateCustomerCache(userId);
        return updated;
    }
    async deleteCustomer(customerId, userId, userName) {
        const customer = await this.customerRepository.delete(customerId, userId);
        if (!customer) {
            throw new AppError("Customer not found or unauthorized", 404);
        }
        info(`Customer deleted by ${userName}: ${customer.name}`);
        await this.invalidateCustomerCache(userId);
        return customer;
    }
    async getCustomerTransactions(customerId, userId) {
        const customer = await this.customerRepository.findById(customerId, userId);
        if (!customer) {
            throw new AppError("Customer not found or unauthorized", 404);
        }
        const transactions = await Transaction.find({ customer: customerId })
            .sort({ createdAt: -1 })
            .populate("invoice", "invoiceNo totalAmount paymentStatus");
        return {
            customer: { name: customer.name, phone: customer.phone },
            transactions: transactions.length ? transactions : []
        };
    }
};
CustomerService = __decorate([
    injectable(),
    __param(0, inject(CustomerRepository)),
    __metadata("design:paramtypes", [CustomerRepository])
], CustomerService);
export { CustomerService };
