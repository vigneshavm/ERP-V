import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionPlan extends Document {
    name: string;
    code: string; // e.g., 'FREE', 'STARTER', 'PRO', 'ENTERPRISE'
    description?: string;
    price: number;
    billingCycle: 'monthly' | 'yearly' | 'lifetime';
    features: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String
    },
    price: {
        type: Number,
        default: 0
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly', 'lifetime'],
        default: 'monthly'
    },
    features: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);

export default SubscriptionPlan;
