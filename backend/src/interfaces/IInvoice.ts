import { Document, Types } from "mongoose";

export interface IInvoiceItem {
    item: string | Types.ObjectId; // SKU or Name? Schema says ObjectId ref to Item
    quantity: number;
    price: number;
    tax: number;
    discount: number;
    total: number;
}

export interface ISplitPaymentDetail {
    method: "cash" | "upi" | "card" | "due" | "split" | "bank_transfer" | "cheque";
    amount: number;
}

export interface IInvoice extends Document {
    invoiceNo: string;
    customer?: string | Types.ObjectId; // ObjectId
    salesOrder?: string | Types.ObjectId; // ObjectId
    items: IInvoiceItem[];
    subtotal: number;
    tax: number;
    discount: number;
    totalAmount: number;
    paidAmount: number;
    creditApplied: number;
    previousDueAmount: number;
    paymentStatus: "paid" | "unpaid" | "partial";
    paymentMethod: "cash" | "upi" | "card" | "due" | "split" | "bank_transfer" | "cheque" | "credit";
    paidViaMethod?: "cash" | "upi" | "card" | "due" | "split" | "bank_transfer" | "cheque" | "credit" | null;
    splitPaymentDetails: ISplitPaymentDetail[];
    bankAccount?: string | Types.ObjectId; // ObjectId
    returnedAmount: number;
    hasReturns: boolean;
    createdBy: string | Types.ObjectId; // ObjectId

    // Soft Delete
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string | Types.ObjectId; // ObjectId

    createdAt: Date;
    updatedAt: Date;
}
