import { injectable, inject } from "tsyringe";
import { CustomerRepository } from "../../../repositories/CustomerRepository.js";
import { AppError } from "../../../utils/AppError.js";
import { ICustomer } from "../../../interfaces/ICustomer.js";
import { info } from "../../../config/logger.js";
import { invalidateUserCache } from "../../../config/cache.js"; // Added import for invalidateUserCache
import Transaction from "../../sales/models/Transaction.js"; // Using Mongoose model directly for mock/simple access

@injectable()
export class CustomerService {
    constructor(
        @inject(CustomerRepository) private customerRepository: CustomerRepository
    ) { }

    private async invalidateCustomerCache(userId: string): Promise<void> {
        await invalidateUserCache(userId, '/api/crm/customers*');
        await invalidateUserCache(userId, '/api/reports*');
    }

    async addCustomer(customerData: any, userId: string, userName: string): Promise<ICustomer> {
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

    async getAllCustomers(userId: string): Promise<ICustomer[]> {
        return this.customerRepository.findAll(userId);
    }

    async getCustomerById(customerId: string, userId: string): Promise<ICustomer> {
        const customer = await this.customerRepository.findById(customerId, userId);
        if (!customer) {
            throw new AppError("Customer not found or unauthorized", 404);
        }
        return customer;
    }

    async updateCustomer(customerId: string, userId: string, updateData: any, userName: string): Promise<ICustomer> {
        const customer = await this.customerRepository.findById(customerId, userId);
        if (!customer) {
            throw new AppError("Customer not found or unauthorized", 404);
        }

        // Duplicate checks
        if (updateData.phone && updateData.phone !== customer.phone) {
            const existingPhone = await this.customerRepository.findByPhoneExcludingId(updateData.phone, userId, customerId);
            if (existingPhone) throw new AppError("Phone number already exists", 400);
        }

        if (updateData.email && updateData.email !== customer.email) {
            const existingEmail = await this.customerRepository.findByEmailExcludingId(updateData.email, userId, customerId);
            if (existingEmail) throw new AppError("Email already exists", 400);
        }

        const updated = await this.customerRepository.update(customerId, userId, updateData);
        if (!updated) throw new AppError("Update failed", 500);

        info(`Customer updated by ${userName}: ${updated.name} (${updated.email || "no email"})`);
        
        await this.invalidateCustomerCache(userId);
        
        return updated;
    }

    async deleteCustomer(customerId: string, userId: string, userName: string): Promise<ICustomer> {
        const customer = await this.customerRepository.delete(customerId, userId);
        if (!customer) {
            throw new AppError("Customer not found or unauthorized", 404);
        }
        info(`Customer deleted by ${userName}: ${customer.name}`);
        
        await this.invalidateCustomerCache(userId);
        
        return customer;
    }

    async getCustomerTransactions(customerId: string, userId: string): Promise<{ customer: { name: string, phone: string }, transactions: any[] }> {
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
}
