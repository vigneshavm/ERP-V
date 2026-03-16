import mongoose, { Schema } from "mongoose";
const clearingParameterSchema = new Schema({
    sector: {
        type: String,
        required: [true, "Sector is required"],
        index: true,
    },
    type: {
        type: String,
        enum: ['Local', 'Outstation', 'HighValue'],
        required: true,
    },
    clearingDays: {
        type: Number,
        required: true,
        default: 1
    },
    holidaysIncluded: {
        type: Boolean,
        default: false
    },
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: "Tenant",
        required: true,
        index: true,
    },
    userId: {
        type: String,
        ref: "User",
        required: true,
    }
}, { timestamps: true });
// Ensure unique combination of sector and type per tenant
clearingParameterSchema.index({ tenantId: 1, sector: 1, type: 1 }, { unique: true });
const ClearingParameter = mongoose.model("ClearingParameter", clearingParameterSchema);
export default ClearingParameter;
