import { injectable, inject } from "tsyringe";
import { DueRepository } from "../../../repositories/DueRepository.js";
import { AppError } from "../../../utils/AppError.js";
import { info } from "../../../config/logger.js";
import { ObjectId } from "mongodb";

@injectable()
export class DueService {
    constructor(
        @inject(DueRepository) private dueRepository: DueRepository
    ) { }

    async createDueAdjustment(data: any, userId: string, userName?: string): Promise<any> {
        const { customerId, adjustmentAmount, adjustmentMethod, notes = '' } = data;

        if (!customerId || !adjustmentAmount || !adjustmentMethod) {
            throw new AppError("Customer ID, adjustment amount, and adjustment method are required", 400);
        }
        if (!ObjectId.isValid(customerId)) throw new AppError("Invalid customer ID format", 400);
        if (adjustmentAmount <= 0) throw new AppError("Adjustment amount must be greater than zero", 400);

        const validMethods = ['cash', 'bank', 'credit', 'original_payment'];
        if (!validMethods.includes(adjustmentMethod)) throw new AppError("Invalid adjustment method", 400);

        const customer = await this.dueRepository.findCustomer(customerId, userId);
        if (!customer) throw new AppError("Customer not found or unauthorized", 404);

        if (adjustmentAmount > customer.dues) {
            throw new AppError(`Adjustment amount (₹${adjustmentAmount}) cannot exceed outstanding due (₹${customer.dues})`, 400);
        }

        const previousDue = customer.dues;
        const updatedDue = previousDue - adjustmentAmount;
        if (updatedDue < 0) throw new AppError("Adjustment would result in negative balance", 400);

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

    async getDueAdjustments(userId: string): Promise<any[]> {
        return this.dueRepository.findAdjustments(userId);
    }

    async getCustomerDueAdjustments(customerId: string, userId: string): Promise<any> {
        if (!ObjectId.isValid(customerId)) throw new AppError("Invalid customer ID format", 400);

        const customer = await this.dueRepository.findCustomer(customerId, userId);
        if (!customer) throw new AppError("Customer not found or unauthorized", 404);

        const adjustments = await this.dueRepository.findCustomerAdjustments(customerId, userId);
        return {
            customer: { name: customer.name, phone: customer.phone },
            adjustments,
        };
    }
}
