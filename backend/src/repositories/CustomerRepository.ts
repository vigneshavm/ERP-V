import { injectable, singleton } from "tsyringe";
import Customer from "../modules/crm/models/Customer.js";
import { ICustomer } from "../interfaces/ICustomer.js";
import type { TenantRef } from '../interfaces/TenantRef.js';

@injectable()
@singleton()
export class CustomerRepository {
    async create(customerData: Partial<ICustomer>): Promise<ICustomer> {
        return Customer.create(customerData);
    }

    /**
     * Find customer by ID for a tenant
     * @param id Customer ID
     * @param tenantId Tenant scope (also checks owner for backward compat)
     */
    async findById(id: string, tenantId: TenantRef): Promise<ICustomer | null> {
        return Customer.findOne({ 
            _id: id, 
            $or: [{ tenantId }, { owner: tenantId }]  // Support both tenantId and owner fields
        }).populate("referredBy", "name phone");
    }

    /**
     * Find customer by phone for a tenant
     */
    async findByPhone(phone: string, tenantId: TenantRef): Promise<ICustomer | null> {
        return Customer.findOne({ 
            phone, 
            $or: [{ tenantId }, { owner: tenantId }]
        });
    }

    /**
     * Find customer by email for a tenant
     */
    async findByEmail(email: string, tenantId: TenantRef): Promise<ICustomer | null> {
        return Customer.findOne({ 
            email, 
            $or: [{ tenantId }, { owner: tenantId }]
        });
    }

    /**
     * Find customer by phone excluding a specific ID for a tenant
     */
    async findByPhoneExcludingId(phone: string, tenantId: TenantRef, excludeId: string): Promise<ICustomer | null> {
        return Customer.findOne({ 
            phone, 
            $or: [{ tenantId }, { owner: tenantId }],
            _id: { $ne: excludeId } 
        });
    }

    /**
     * Find customer by email excluding a specific ID for a tenant
     */
    async findByEmailExcludingId(email: string, tenantId: TenantRef, excludeId: string): Promise<ICustomer | null> {
        return Customer.findOne({ 
            email, 
            $or: [{ tenantId }, { owner: tenantId }],
            _id: { $ne: excludeId } 
        });
    }

    /**
     * Find all customers for a tenant
     */
    async findAll(tenantId: TenantRef): Promise<ICustomer[]> {
        return Customer.find({ 
            $or: [{ tenantId }, { owner: tenantId }]
        })
            .populate("referredBy", "name phone")
            .sort({ name: 1 });
    }

    /**
     * Update customer for a tenant
     */
    async update(id: string, tenantId: TenantRef, updateData: Partial<ICustomer>): Promise<ICustomer | null> {
        return Customer.findOneAndUpdate(
            { 
                _id: id, 
                $or: [{ tenantId }, { owner: tenantId }]
            },
            updateData,
            { new: true }
        );
    }

    /**
     * Delete customer for a tenant
     */
    async delete(id: string, tenantId: TenantRef): Promise<ICustomer | null> {
        return Customer.findOneAndDelete({ 
            _id: id, 
            $or: [{ tenantId }, { owner: tenantId }]
        });
    }
}
