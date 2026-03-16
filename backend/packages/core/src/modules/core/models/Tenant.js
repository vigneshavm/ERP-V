import mongoose, { Schema } from "mongoose";
const tenantSchema = new Schema({
    name: {
        type: String,
        required: [true, "Please enter business name"]
    },
    shopName: {
        type: String,
        required: false
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'],
        default: 'ACTIVE'
    },
    businessType: {
        type: String,
        required: false
    },
    gstNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    panNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String }, // Mapped to pincode
        country: { type: String, default: 'India' }
    },
    contact: {
        phone: { type: String },
        email: { type: String },
        website: { type: String }
    },
    config: {
        theme: {
            primaryColor: { type: String, default: '#007bff' },
            logoUrl: { type: String, default: '' }
        },
        currency: { type: String, default: 'USD' },
        timezone: { type: String, default: 'UTC' }
    },
    ecommerce: {
        enabled: { type: Boolean, default: false },
        domain: { type: String },
        theme: { type: String },
        settings: { type: Map, of: String }
    },
    subscriptionPlan: {
        type: Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: true
    },
    subscriptionStartDate: {
        type: Date
    },
    subscriptionEndDate: {
        type: Date
    }
}, { timestamps: true });
const Tenant = mongoose.model('Tenant', tenantSchema);
export default Tenant;
