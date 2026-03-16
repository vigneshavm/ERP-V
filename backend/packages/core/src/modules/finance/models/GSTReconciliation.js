import mongoose, { Schema } from "mongoose";
const gstReconciliationSchema = new Schema({
    tenantId: { type: String, required: true },
    branchId: { type: String },
    returnPeriod: { type: String, required: true }, // Index this for quick lookup
    importedRecords: [{
            invoiceNo: String,
            date: Date,
            gstin: String,
            supplierName: String,
            taxableAmount: Number,
            taxAmount: Number,
            source: { type: String, default: 'GSTR-2B' }
        }],
    results: [{
            billId: { type: Schema.Types.ObjectId, ref: 'Bill' },
            gstrReference: String,
            status: {
                type: String,
                enum: ['MATCHED', 'MISMATCH', 'MISSING_IN_GSTR2B', 'MISSING_IN_SYSTEM']
            },
            remarks: String,
            reconciledAt: { type: Date, default: Date.now }
        }],
    stats: {
        totalMatched: { type: Number, default: 0 },
        totalMismatch: { type: Number, default: 0 },
        totalMissingSystem: { type: Number, default: 0 },
        totalMissingGSTR: { type: Number, default: 0 }
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
gstReconciliationSchema.index({ tenantId: 1, returnPeriod: 1 }, { unique: true });
const GSTReconciliation = mongoose.model("GSTReconciliation", gstReconciliationSchema);
export default GSTReconciliation;
