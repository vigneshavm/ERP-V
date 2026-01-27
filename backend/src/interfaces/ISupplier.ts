import { Document, Types } from "mongoose";

export interface ISupplier extends Document {
    tenantId: string | Types.ObjectId;
    supplierId: string;
    businessName: string;
    contactPersonName: string;
    contactNo: string;
    email: string;
    physicalAddress: string;
    gstNo: string;
    supplierType: "manufacturer" | "wholesaler" | "distributor";
    openingBalance: number;
    balanceType: "payable" | "receivable";
    creditPeriod: number;
    status: "active" | "inactive";
    itemsSupplied: (string | Types.ObjectId)[]; // references Item IDs
    owner?: string | Types.ObjectId; // references User ID (optional, tracks creator)

    createdAt: Date;
    updatedAt: Date;
}
