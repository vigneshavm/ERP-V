import { ObjectId } from 'mongodb';

export interface IBillItem {
    productId?: ObjectId | string;
    name: string;
    quantity: number;
    rate: number;
    taxRate: number;
    taxAmount: number;
    total: number;
}

export interface IBillTaxBreakdown {
    cgst: number;
    sgst: number;
    igst: number;
    other: number;
}

export interface IBill {
    _id?: ObjectId | string;
    billNo: string;
    vendorInvoiceNo: string;
    date: Date;
    supplier: ObjectId | string;
    amount: number;
    tenantId?: string;
    branchId?: string;

    items: IBillItem[];
    subTotal: number;
    discount: number;
    freight: number;
    roundOff: number;
    taxBreakdown: IBillTaxBreakdown;

    grnId?: ObjectId | string;
    purchaseOrderId?: ObjectId | string;

    dueDate?: Date;
    paymentTerms?: number;
    status: string;
    paymentMethod: string;
    paidAmount: number;
    discountReceived?: number;
    bankAccount?: ObjectId | string;
    paymentStatus: 'paid' | 'unpaid' | 'partial';
    description?: string;
    createdBy: ObjectId | string;

    gstReconciliationStatus?: string;
    itcStatus?: string;

    createdAt?: Date;
    updatedAt?: Date;
}
