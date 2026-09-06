import mongoose, { Schema, Document } from 'mongoose';

// Textilesoft's "EMIMasterEntry" -- an installment plan against a sale, tracked separately
// from a normal credit-sale ledger entry (Customer.dues) because each installment has its own
// due date/amount/status rather than one lump balance.
export interface IEMIInstallment {
    dueDate: Date;
    amount: number;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
    paidDate?: Date;
    paidAmount?: number;
}

export interface IEMIPlan extends Document {
    tenantId: string;
    invoiceId: mongoose.Types.ObjectId;
    customerId: mongoose.Types.ObjectId;
    totalAmount: number;
    numberOfInstallments: number;
    installmentAmount: number;
    startDate: Date;
    frequency: 'MONTHLY' | 'WEEKLY';
    installments: IEMIInstallment[];
    status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED';
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const emiInstallmentSchema = new Schema({
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['PENDING', 'PAID', 'OVERDUE'], default: 'PENDING' },
    paidDate: { type: Date },
    paidAmount: { type: Number }
}, { _id: false });

const emiPlanSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    numberOfInstallments: { type: Number, required: true, min: 1 },
    installmentAmount: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    frequency: { type: String, enum: ['MONTHLY', 'WEEKLY'], default: 'MONTHLY' },
    installments: { type: [emiInstallmentSchema], required: true, validate: (v: any[]) => v.length > 0 },
    status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'DEFAULTED'], default: 'ACTIVE' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

emiPlanSchema.index({ tenantId: 1, status: 1 });

const EMIPlan = mongoose.models.EMIPlan || mongoose.model<IEMIPlan>('EMIPlan', emiPlanSchema);
export default EMIPlan;
