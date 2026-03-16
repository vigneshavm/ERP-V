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
import { SupplierRepository } from '@smarterp/shared/repositories/SupplierRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { info } from '@smarterp/shared/config/logger.js';
let SupplierService = class SupplierService {
    supplierRepository;
    constructor(supplierRepository) {
        this.supplierRepository = supplierRepository;
    }
    async generateSupplierId(userId) {
        const lastSupplier = await this.supplierRepository.findLatest(userId);
        let nextId = 1;
        if (lastSupplier && lastSupplier.supplierId) {
            const lastNum = parseInt(lastSupplier.supplierId.split('-')[1]);
            nextId = lastNum + 1;
        }
        return `SUP-${nextId.toString().padStart(5, '0')}`;
    }
    async addSupplier(supplierData, userId, userName) {
        const { businessName, contactPersonName, contactNo, email, physicalAddress, gstNo, supplierType, status } = supplierData;
        // Required field validation (simplified, detailed validation via schema/zod usually)
        if (!businessName || !contactPersonName || !contactNo || !email || !physicalAddress || !gstNo || !supplierType || !status) {
            throw new AppError("All required fields must be provided", 400);
        }
        // Duplicate checks
        const existingContact = await this.supplierRepository.findByContactNo(contactNo, userId);
        if (existingContact)
            throw new AppError("Contact number already exists in your supplier list", 400);
        const existingEmail = await this.supplierRepository.findByEmail(email, userId);
        if (existingEmail)
            throw new AppError("Email already exists in your supplier list", 400);
        const supplierId = await this.generateSupplierId(userId);
        const supplier = await this.supplierRepository.create({
            ...supplierData,
            supplierId,
            openingBalance: supplierData.openingBalance || 0,
            balanceType: supplierData.balanceType || "payable",
            creditPeriod: supplierData.creditPeriod || 0,
            owner: userId
        });
        info(`New supplier added by ${userName}: ${businessName} (${supplierId})`);
        return supplier;
    }
    async getAllSuppliers(userId) {
        return this.supplierRepository.findAll(userId);
    }
    async getSupplierById(supplierId, userId) {
        const supplier = await this.supplierRepository.findById(supplierId, userId);
        if (!supplier) {
            throw new AppError("Supplier not found or unauthorized", 404);
        }
        return supplier;
    }
    async updateSupplier(supplierId, userId, updateData, userName) {
        const supplier = await this.supplierRepository.findById(supplierId, userId);
        if (!supplier) {
            throw new AppError("Supplier not found or unauthorized", 404);
        }
        // Duplicate checks
        if (updateData.contactNo && updateData.contactNo !== supplier.contactNo) {
            const existingContact = await this.supplierRepository.findByContactNoExcludingId(updateData.contactNo, userId, supplierId);
            if (existingContact)
                throw new AppError("Contact number already exists", 400);
        }
        if (updateData.email && updateData.email !== supplier.email) {
            const existingEmail = await this.supplierRepository.findByEmailExcludingId(updateData.email, userId, supplierId);
            if (existingEmail)
                throw new AppError("Email already exists", 400);
        }
        const updated = await this.supplierRepository.update(supplierId, userId, updateData);
        if (!updated)
            throw new AppError("Update failed", 500);
        info(`Supplier updated by ${userName}: ${updated.businessName} (${updated.supplierId})`);
        return updated;
    }
    async deleteSupplier(supplierId, userId, userName) {
        const supplier = await this.supplierRepository.delete(supplierId, userId);
        if (!supplier) {
            throw new AppError("Supplier not found or unauthorized", 404);
        }
        info(`Supplier deleted by ${userName}: ${supplier.businessName}`);
        return supplier;
    }
};
SupplierService = __decorate([
    injectable(),
    __param(0, inject(SupplierRepository)),
    __metadata("design:paramtypes", [SupplierRepository])
], SupplierService);
export { SupplierService };
