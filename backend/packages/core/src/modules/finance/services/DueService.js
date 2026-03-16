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
import { DueRepository } from '@smarterp/shared/repositories/DueRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { info } from '@smarterp/shared/config/logger.js';
import { ObjectId } from "mongodb";
let DueService = class DueService {
    dueRepository;
    constructor(dueRepository) {
        this.dueRepository = dueRepository;
    }
    async createDueAdjustment(data, userId, userName) {
        const { customerId, adjustmentAmount, adjustmentMethod, notes = '' } = data;
        if (!customerId || !adjustmentAmount || !adjustmentMethod) {
            throw new AppError("Customer ID, adjustment amount, and adjustment method are required", 400);
        }
        if (!ObjectId.isValid(customerId))
            throw new AppError("Invalid customer ID format", 400);
        if (adjustmentAmount <= 0)
            throw new AppError("Adjustment amount must be greater than zero", 400);
        const validMethods = ['cash', 'bank', 'credit', 'original_payment'];
        if (!validMethods.includes(adjustmentMethod))
            throw new AppError("Invalid adjustment method", 400);
        const customer = await this.dueRepository.findCustomer(customerId, userId);
        if (!customer)
            throw new AppError("Customer not found or unauthorized", 404);
        if (adjustmentAmount > customer.dues) {
            throw new AppError(`Adjustment amount (₹${adjustmentAmount}) cannot exceed outstanding due (₹${customer.dues})`, 400);
        }
        const previousDue = customer.dues;
        const updatedDue = previousDue - adjustmentAmount;
        if (updatedDue < 0)
            throw new AppError("Adjustment would result in negative balance", 400);
        const dueAdjustment = await this.dueRepository.createAdjustment({
            customer: customerId, relatedInvoice: null,
            adjustmentAmount, adjustmentMethod, previousDue, updatedDue,
            notes, createdBy: userId,
        });
        await this.dueRepository.updateCustomerDues(customerId, -adjustmentAmount);
        await this.dueRepository.createTransaction({
            type: 'due_adjustment', customer: customerId,
            dueAdjustment: dueAdjustment._id.toString(),
            amount: adjustmentAmount, paymentMethod: adjustmentMethod,
            description: `Due adjustment of ₹${adjustmentAmount} via ${adjustmentMethod}${notes ? ` - ${notes}` : ''}`,
        });
        info(`Due adjustment created by ${userName || 'Unknown'}: ₹${adjustmentAmount} for customer ${customer.name}`);
        const populatedAdjustment = await this.dueRepository.findAdjustmentById(dueAdjustment._id.toString());
        return populatedAdjustment;
    }
    async getDueAdjustments(userId) {
        return this.dueRepository.findAdjustments(userId);
    }
    async getCustomerDueAdjustments(customerId, userId) {
        if (!ObjectId.isValid(customerId))
            throw new AppError("Invalid customer ID format", 400);
        const customer = await this.dueRepository.findCustomer(customerId, userId);
        if (!customer)
            throw new AppError("Customer not found or unauthorized", 404);
        const adjustments = await this.dueRepository.findCustomerAdjustments(customerId, userId);
        return {
            customer: { name: customer.name, phone: customer.phone },
            adjustments,
        };
    }
};
DueService = __decorate([
    injectable(),
    __param(0, inject(DueRepository)),
    __metadata("design:paramtypes", [DueRepository])
], DueService);
export { DueService };
