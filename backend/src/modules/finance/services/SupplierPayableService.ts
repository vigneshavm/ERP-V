import { injectable } from "tsyringe";
import { ClientSession, Types } from "mongoose";
import Bill from "../models/Bill.js";
import JournalEntry from "../models/JournalEntry.js";
import type { IdRef } from "../../../interfaces/TenantRef.js";

export interface SupplierChargeInput {
    tenantId: Types.ObjectId;
    userId: IdRef;
    supplier: { _id: IdRef; businessName?: string; creditPeriod?: number };
    amount: number;
    /** Unique per creator: used as billNo and vendorInvoiceNo. */
    reference: string;
    description: string;
    date?: Date;
    session?: ClientSession;
}

/**
 * Adds to what we owe a supplier outside a normal purchase (e.g. an approved rate revision):
 * an unpaid supplier bill -- which is what the supplier ledger and payables read -- plus the
 * matching journal entry (Dr Purchase Account, Cr supplier), the same shape a purchase posts.
 */
@injectable()
export class SupplierPayableService {
    async postSupplierCharge(input: SupplierChargeInput): Promise<{ billId: Types.ObjectId }> {
        const date = input.date ?? new Date();
        const dueDate = new Date(date);
        dueDate.setDate(dueDate.getDate() + (input.supplier.creditPeriod || 30));

        const bill = new Bill({
            billNo: input.reference,
            vendorInvoiceNo: input.reference,
            date,
            supplier: input.supplier._id,
            amount: input.amount,
            status: "unpaid",
            paymentMethod: "credit",
            paymentStatus: "unpaid",
            paidAmount: 0,
            dueDate,
            description: input.description,
            createdBy: input.userId,
            tenantId: input.tenantId.toString(),
        });
        await bill.save({ session: input.session });

        await new JournalEntry({
            tenantId: input.tenantId,
            date,
            description: input.description,
            reference: input.reference,
            entries: [
                { accountId: "PURCHASE_ACCOUNT", accountName: "Purchase Account", debit: input.amount, credit: 0 },
                { accountId: String(input.supplier._id), accountName: input.supplier.businessName || "Supplier", debit: 0, credit: input.amount },
            ],
            status: "POSTED",
            createdBy: input.userId,
        }).save({ session: input.session });

        return { billId: bill._id as Types.ObjectId };
    }
}
