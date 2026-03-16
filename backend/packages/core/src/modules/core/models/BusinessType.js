import mongoose, { Schema } from 'mongoose';
const businessTypeSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
const BusinessType = mongoose.model('BusinessType', businessTypeSchema);
export default BusinessType;
