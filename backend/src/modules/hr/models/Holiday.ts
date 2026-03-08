import mongoose, { Document, Schema } from 'mongoose';

export interface IHoliday extends Document {
    tenantId: mongoose.Types.ObjectId;
    name: string;
    date: Date;
    description?: string;
    type: 'PUBLIC' | 'OPTIONAL' | 'INTERNAL';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const holidaySchema = new Schema<IHoliday>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['PUBLIC', 'OPTIONAL', 'INTERNAL'],
        default: 'PUBLIC'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for tenant scoping and date sorting
holidaySchema.index({ tenantId: 1, date: 1 });

const Holiday = mongoose.model<IHoliday>('Holiday', holidaySchema);

export default Holiday;
