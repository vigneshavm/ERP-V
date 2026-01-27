
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const SubscriptionPlanSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    description: String,
    price: { type: Number, default: 0 },
    billingCycle: { type: String, enum: ['monthly', 'yearly', 'lifetime'], default: 'monthly' },
    features: [String],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);

const seedPlans = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const plans = [
            {
                name: 'Starter',
                code: 'STARTER',
                description: 'Perfect for small shops',
                price: 499,
                billingCycle: 'monthly',
                features: ['Up to 50 products', 'Basic theme', 'Email support', 'Standard Analytics'],
                isActive: true
            },
            {
                name: 'Professional',
                code: 'PRO',
                description: 'Best for growing businesses',
                price: 999,
                billingCycle: 'monthly',
                features: ['Unlimited products', 'Premium themes', 'Priority support', 'Custom domain', 'Advanced Analytics'],
                isActive: true
            },
            {
                name: 'Enterprise',
                code: 'ENTERPRISE',
                description: 'For large scale operations',
                price: 1999,
                billingCycle: 'monthly',
                features: ['Everything in Pro', 'Multi-store', 'API access', 'Dedicated manager', 'White-labeling'],
                isActive: true
            },
            {
                name: 'Free',
                code: 'FREE',
                description: 'Try it out',
                price: 0,
                billingCycle: 'monthly',
                features: ['Up to 5 products', 'Basic theme'],
                isActive: true
            }
        ];

        for (const plan of plans) {
            await SubscriptionPlan.updateOne(
                { code: plan.code },
                { $set: plan },
                { upsert: true }
            );
        }

        console.log("Subscription plans seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding plans:", error);
        process.exit(1);
    }
};

seedPlans();
