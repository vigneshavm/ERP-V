import { Document, Types } from "mongoose";

export interface IInvoiceItem {
    item: string | Types.ObjectId; // SKU or Name? Schema says ObjectId ref to Item
    name?: string;       // Denormalized for display
    hsnCode?: string;    // HSN/SAC code
    gstRate?: number;    // e.g. 5, 12, 18, 28
    quantity: number;
    price: number;       // Unit price (inclusive or exclusive depending on taxMode)
    taxableAmount?: number; // price * qty (before tax)
    cgst?: number;       // CGST amount
    sgst?: number;       // SGST amount (intra-state)
    igst?: number;       // IGST amount (inter-state)
    tax: number;         // Total tax (cgst+sgst or igst) — kept for backward compat
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
    tenantId: string | Types.ObjectId; // ObjectId
    storeId?: string | Types.ObjectId; // ObjectId

    // Soft Delete
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string | Types.ObjectId; // ObjectId

    // GST Compliance
    taxMode?: 'INCLUSIVE' | 'EXCLUSIVE'; // Inclusive = price includes tax
    isInterState?: boolean;              // true → IGST, false → CGST+SGST
    taxBreakdown?: {
        cgst: number;
        sgst: number;
        igst: number;
        total: number;
    };

    createdAt: Date;
    updatedAt: Date;
}
