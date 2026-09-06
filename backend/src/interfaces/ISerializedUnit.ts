import { Document, Types } from "mongoose";

export type SerializedUnitStatus = "IN_STOCK" | "SOLD" | "RETURNED" | "DAMAGED";

/**
 * A single physical, individually-trackable unit of an Item -- e.g. one phone, one appliance
 * with a serial plate. Item.stockQty stays the aggregate count; this collection is where a
 * unit's own identity (IMEI/serial) and lifecycle (in stock -> sold -> returned) live, since a
 * single Item document can't cleanly hold hundreds of independently-mutable per-unit records.
 */
export interface ISerializedUnit extends Document {
    itemId: Types.ObjectId | string;
    serialNumber: string;
    imei1?: string;
    imei2?: string;
    modelNo?: string;
    configuration?: string; // e.g. "128GB / 8GB RAM / Midnight Black"
    warrantyMonths?: number;
    warrantyStartDate?: Date;
    status: SerializedUnitStatus;
    grnId?: Types.ObjectId | string; // which goods-receipt this unit came in on, if any
    soldInvoiceId?: Types.ObjectId | string; // which sales invoice sold it, if any
    tenantId: Types.ObjectId | string;
    addedBy: string;

    createdAt: Date;
    updatedAt: Date;
}
