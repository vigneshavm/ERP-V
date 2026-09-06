import mongoose, { Schema, Document } from "mongoose";
import { MASTER_TYPES, MasterType } from "../masterTypes.js";

// Generic "simple master" row. One collection backs every list-type in masterTypes.ts (customer
// groups, employee structure, transaction/cash/payment/booking groups, GST type/group, textile
// product descriptors) rather than a dedicated model+controller+routes per type -- these are all
// the same shape (name, optional description, optional parent, optional type-specific extras).
export interface IMasterEntry extends Document {
    tenantId: mongoose.Types.ObjectId;
    type: MasterType;
    name: string;
    description?: string;
    parentId?: mongoose.Types.ObjectId; // set for two-tier child types, see PARENT_TYPE_OF
    meta?: Record<string, any>; // type-specific extras, e.g. CUSTOMER_GROUP's discountPercent/creditLimit/paymentTermsDays/color
    isActive: boolean;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const masterEntrySchema = new Schema<IMasterEntry>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
        type: { type: String, enum: MASTER_TYPES, required: true, index: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        parentId: { type: Schema.Types.ObjectId, ref: "MasterEntry" },
        meta: { type: Schema.Types.Mixed, default: {} },
        isActive: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

// Name unique per tenant per type (case-sensitive at the index level -- MasterDataService does a
// case-insensitive check before insert, same approach as Category).
masterEntrySchema.index({ tenantId: 1, type: 1, name: 1 }, { unique: true });

const MasterEntry = mongoose.model<IMasterEntry>("MasterEntry", masterEntrySchema);
export default MasterEntry;
