import mongoose, { Schema, Document } from 'mongoose';

// Textilesoft's "SwipeMachineDetails" -- a registry of physical card/swipe terminals, so a
// terminal can be assigned to a counter/store and tracked as a payment-method device distinct
// from the abstract "Card" payment split already tracked per-sale.
export interface ICardTerminal extends Document {
    tenantId: string;
    terminalId: string;
    provider?: string;
    storeId?: mongoose.Types.ObjectId;
    isActive: boolean;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const cardTerminalSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    terminalId: { type: String, required: true },
    provider: { type: String },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
    isActive: { type: Boolean, default: true },
    notes: { type: String }
}, { timestamps: true });

cardTerminalSchema.index({ tenantId: 1, terminalId: 1 }, { unique: true });

const CardTerminal = mongoose.models.CardTerminal || mongoose.model<ICardTerminal>('CardTerminal', cardTerminalSchema);
export default CardTerminal;
