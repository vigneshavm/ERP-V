import { injectable, inject } from "tsyringe";
import { SupplierRepository } from "../repositories/SupplierRepository.js";
import { AppError } from "../utils/AppError.js";
import { ISupplier } from "../interfaces/ISupplier.js";
import { info } from "../config/logger.js";

@injectable()
export class SupplierService {
    constructor(
        @inject(SupplierRepository) private supplierRepository: SupplierRepository
    ) { }

    async generateSupplierId(userId: string): Promise<string> {
        const lastSupplier = await this.supplierRepository.findLatest(userId);
        let nextId = 1;
        if (lastSupplier && lastSupplier.supplierId) {
            const lastNum = parseInt(lastSupplier.supplierId.split('-')[1]);
            nextId = lastNum + 1;
        }
        return `SUP-${nextId.toString().padStart(5, '0')}`;
    }

    async addSupplier(supplierData: any, userId: string, userName: string): Promise<ISupplier> {
        const { businessName, contactPersonName, contactNo, email, physicalAddress, gstNo, supplierType, status } = supplierData;

        // Required field validation (simplified, detailed validation via schema/zod usually)
        if (!businessName || !contactPersonName || !contactNo || !email || !physicalAddress || !gstNo || !supplierType || !status) {
            throw new AppError("All required fields must be provided", 400);
        }

        // Duplicate checks
        const existingContact = await this.supplierRepository.findByContactNo(contactNo, userId);
        if (existingContact) throw new AppError("Contact number already exists in your supplier list", 400);

        const existingEmail = await this.supplierRepository.findByEmail(email, userId);
        if (existingEmail) throw new AppError("Email already exists in your supplier list", 400);

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

    async getAllSuppliers(userId: string): Promise<ISupplier[]> {
        return this.supplierRepository.findAll(userId);
    }

    async getSupplierById(supplierId: string, userId: string): Promise<ISupplier> {
        const supplier = await this.supplierRepository.findById(supplierId, userId);
        if (!supplier) {
            throw new AppError("Supplier not found or unauthorized", 404);
        }
        return supplier;
    }

    async updateSupplier(supplierId: string, userId: string, updateData: any, userName: string): Promise<ISupplier> {
        const supplier = await this.supplierRepository.findById(supplierId, userId);
        if (!supplier) {
            throw new AppError("Supplier not found or unauthorized", 404);
        }

        // Duplicate checks
        if (updateData.contactNo && updateData.contactNo !== supplier.contactNo) {
            const existingContact = await this.supplierRepository.findByContactNoExcludingId(updateData.contactNo, userId, supplierId);
            if (existingContact) throw new AppError("Contact number already exists", 400);
        }

        if (updateData.email && updateData.email !== supplier.email) {
            const existingEmail = await this.supplierRepository.findByEmailExcludingId(updateData.email, userId, supplierId);
            if (existingEmail) throw new AppError("Email already exists", 400);
        }

        const updated = await this.supplierRepository.update(supplierId, userId, updateData);
        if (!updated) throw new AppError("Update failed", 500);

        info(`Supplier updated by ${userName}: ${updated.businessName} (${updated.supplierId})`);
        return updated;
    }

    async deleteSupplier(supplierId: string, userId: string, userName: string): Promise<ISupplier> {
        const supplier = await this.supplierRepository.delete(supplierId, userId);
        if (!supplier) {
            throw new AppError("Supplier not found or unauthorized", 404);
        }
        info(`Supplier deleted by ${userName}: ${supplier.businessName}`);
        return supplier;
    }
}
