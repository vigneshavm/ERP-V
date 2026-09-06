import mongoose, { Schema, Document } from "mongoose";

export interface ITaxMaster extends Document {
    tenantId: mongoose.Types.ObjectId | string;
    taxCode: string;
    taxName: string;
    percentage: number;
    effectiveDate: Date;
    endDate?: Date;
    isActive: boolean;
    // Organizational GST hierarchy (Textilesoft: GSTType/GSTGroup), additive only -- these link a
    // tax rate row to an admin-managed type/group for reporting and setup screens. Live tax
    // computation (Item.gstRate, invoice/GSTR calculations) is untouched by this; it keeps
    // reading Item.gstRate exactly as before.
    gstTypeId?: mongoose.Types.ObjectId; // references a MasterEntry of type GST_TYPE
    gstGroupId?: mongoose.Types.ObjectId; // references a MasterEntry of type GST_GROUP
    createdAt: Date;
    updatedAt: Date;
}

const taxMasterSchema = new Schema<ITaxMaster>(
    {
        tenantId: { type: Schema.Types.Mixed, required: true, index: true },
        taxCode: { type: String, required: true },
        taxName: { type: String, required: true },
        percentage: { type: Number, required: true, min: 0, max: 100 },
        effectiveDate: { type: Date, default: Date.now, required: true },
        endDate: { type: Date },
        isActive: { type: Boolean, default: true },
        gstTypeId: { type: Schema.Types.ObjectId, ref: "MasterEntry" },
        gstGroupId: { type: Schema.Types.ObjectId, ref: "MasterEntry" }
    },
    { timestamps: true }
);

taxMasterSchema.index({ tenantId: 1, taxCode: 1 });

const TaxMaster = mongoose.models.TaxMaster || mongoose.model<ITaxMaster>("TaxMaster", taxMasterSchema);
export default TaxMaster;
