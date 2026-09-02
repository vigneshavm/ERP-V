import mongoose, { Schema, Document } from "mongoose";

export interface ITaxMaster extends Document {
    tenantId: mongoose.Types.ObjectId | string;
    taxCode: string;
    taxName: string;
    percentage: number;
    effectiveDate: Date;
    endDate?: Date;
    isActive: boolean;
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
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

taxMasterSchema.index({ tenantId: 1, taxCode: 1 });

const TaxMaster = mongoose.models.TaxMaster || mongoose.model<ITaxMaster>("TaxMaster", taxMasterSchema);
export default TaxMaster;
