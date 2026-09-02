import mongoose, { Schema, Document } from "mongoose";

export interface ILoyaltyTransaction extends Document {
    tenantId: mongoose.Types.ObjectId | string;
    customerId: mongoose.Types.ObjectId | string;
    type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUSTMENT' | 'REFUND_REVERSAL' | 'PROMOTIONAL_BONUS';
    points: number;
    balanceAfter: number;
    invoiceId?: mongoose.Types.ObjectId | string;
    referenceNo?: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

const loyaltyTransactionSchema = new Schema<ILoyaltyTransaction>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
        customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
        type: {
            type: String,
            enum: ['EARN', 'REDEEM', 'EXPIRE', 'ADJUSTMENT', 'REFUND_REVERSAL', 'PROMOTIONAL_BONUS'],
            required: true
        },
        points: { type: Number, required: true },
        balanceAfter: { type: Number, required: true },
        invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
        referenceNo: { type: String },
        description: { type: String, required: true }
    },
    { timestamps: true }
);

loyaltyTransactionSchema.index({ tenantId: 1, customerId: 1, createdAt: -1 });

const LoyaltyTransaction = mongoose.models.LoyaltyTransaction || mongoose.model<ILoyaltyTransaction>("LoyaltyTransaction", loyaltyTransactionSchema);
export default LoyaltyTransaction;
