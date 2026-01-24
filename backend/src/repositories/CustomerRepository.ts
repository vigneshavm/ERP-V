import { injectable, singleton } from "tsyringe";
import Customer from "../models/Customer.js";
import { ICustomer } from "../interfaces/ICustomer.js";

@injectable()
@singleton()
export class CustomerRepository {
    async create(customerData: Partial<ICustomer>): Promise<ICustomer> {
        return Customer.create(customerData);
    }

    async findById(id: string, userId: string): Promise<ICustomer | null> {
        return Customer.findOne({ _id: id, owner: userId }).populate("referredBy", "name phone");
    }

    async findByPhone(phone: string, userId: string): Promise<ICustomer | null> {
        return Customer.findOne({ phone, owner: userId });
    }

    async findByEmail(email: string, userId: string): Promise<ICustomer | null> {
        return Customer.findOne({ email, owner: userId });
    }

    async findByPhoneExcludingId(phone: string, userId: string, excludeId: string): Promise<ICustomer | null> {
        return Customer.findOne({ phone, owner: userId, _id: { $ne: excludeId } });
    }

    async findByEmailExcludingId(email: string, userId: string, excludeId: string): Promise<ICustomer | null> {
        return Customer.findOne({ email, owner: userId, _id: { $ne: excludeId } });
    }

    async findAll(userId: string): Promise<ICustomer[]> {
        return Customer.find({ owner: userId })
            .populate("referredBy", "name phone")
            .sort({ name: 1 });
    }

    async update(id: string, userId: string, updateData: Partial<ICustomer>): Promise<ICustomer | null> {
        return Customer.findOneAndUpdate(
            { _id: id, owner: userId },
            updateData,
            { new: true }
        );
    }

    async delete(id: string, userId: string): Promise<ICustomer | null> {
        return Customer.findOneAndDelete({ _id: id, owner: userId });
    }
}
