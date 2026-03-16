import mongoose, { Schema } from 'mongoose';
const holidaySchema = new Schema({
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
const Holiday = mongoose.model('Holiday', holidaySchema);
export default Holiday;
