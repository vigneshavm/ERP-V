import mongoose, { Schema, Document } from "mongoose";

export interface ICounter {
    id: string;
    name: string;
    lastBillNumber: string;
}

export interface IStore extends Document {
    tenantId: mongoose.Types.ObjectId;
    name: string;
    address?: string;
    city?: string;
    gstin?: string;
    managerUserId?: mongoose.Types.ObjectId;
    counters: ICounter[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const counterSchema = new Schema<ICounter>({
    id: { type: String, required: true },
    name: { type: String, required: true },
    lastBillNumber: { type: String, default: '0' }
});

const storeSchema = new Schema<IStore>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        name: { type: String, required: true },
        address: { type: String },
        city: { type: String },
        gstin: { type: String },
        managerUserId: { type: Schema.Types.ObjectId, ref: 'User' },
        counters: [counterSchema],
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

export default mongoose.model<IStore>("Store", storeSchema);
