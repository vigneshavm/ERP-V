import mongoose, { Schema, Document } from 'mongoose';

// Textilesoft's "agentdetail" -- a commission/sales agent, distinct from both a Supplier (a
// business the tenant buys from) and an Employee (someone on payroll). An agent can optionally
// be linked to a supplier they represent, but stands on its own as a directory entry with
// commission and bank-payout details.
export interface IAgent extends Document {
    tenantId: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    commissionPercent: number;
    linkedSupplierId?: mongoose.Types.ObjectId;
    bankAccountNumber?: string;
    bankName?: string;
    ifsc?: string;
    notes?: string;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

const AgentSchema: Schema = new Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String },
    commissionPercent: { type: Number, default: 0 },
    linkedSupplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    bankAccountNumber: { type: String },
    bankName: { type: String },
    ifsc: { type: String },
    notes: { type: String },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Compound index for unique agent name per tenant (mirrors SupplierGroup's uniqueness rule).
AgentSchema.index({ tenantId: 1, name: 1 }, { unique: true });

const Agent = mongoose.models.Agent || mongoose.model<IAgent>('Agent', AgentSchema);
export default Agent;
