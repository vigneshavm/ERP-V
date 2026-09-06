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
    // Wholesale/Retail (WR) Billing: which billing track this invoice was raised through.
    // Minimal flag-based split (matches Item.wholesaleRate's existing convention) rather than a
    // separate invoice collection -- 'WHOLESALE' invoices get their own "WR-" invoiceNo series
    // (see PosController.ts's createInvoice) and are what the WR Sales Bill View / WR Sales
    // Report / WR Stock Report filter on. counterName is the billing counter selected on the
    // WR Counter Picker screen before entry (optional -- POS sales never set it).
    saleChannel?: 'RETAIL' | 'WHOLESALE';
    counterName?: string;
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
    fulfillmentStatus?: 'UNFULFILLED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
    shippedAt?: Date;
    deliveredAt?: Date;
    courierName?: string;
    trackingNumber?: string;

    // Invoice Billing: MRP-Pending flag. Textilesoft's "Invoice Billing" mode lets a bill be
    // raised at a provisional price before the final MRP for that stock is confirmed (e.g. goods
    // received but not yet priced by the supplier/head office). Minimal deferred-pricing
    // capability: a boolean flag + note, set at creation and cleared once someone confirms the
    // final price is correct -- not a separate invoice document type, and not automatic
    // re-pricing (that's the general invoice-edit endpoint's job, tracked separately).
    isMrpPending?: boolean;
    mrpPendingNote?: string;
    mrpFinalizedAt?: Date;
    mrpFinalizedBy?: string | Types.ObjectId;

    // POS sale/invoice edit: lets an owner/co-owner/manager correct a completed bill's
    // quantities/prices/discount after the fact (e.g. a cashier mis-keyed a quantity), with the
    // corresponding stock adjustment applied in the same transaction. See PosController.ts's
    // editInvoice. Adding/removing line items is out of scope -- only existing lines can be
    // corrected -- and payment fields are untouched.
    isEdited?: boolean;
    lastEditedAt?: Date;
    lastEditedBy?: string | Types.ObjectId;
    lastEditReason?: string;

    createdAt: Date;
    updatedAt: Date;
}
