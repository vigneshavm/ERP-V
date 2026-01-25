import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const SubscriptionPlanSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: String,
    price: { type: Number, default: 0 },
    billingCycle: { type: String, enum: ['monthly', 'yearly', 'lifetime'], default: 'monthly' },
    features: [String],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);

const seedPlans = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MONGO_URI is not defined');

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected.');

        const plans = [
            {
                name: 'Free',
                code: 'FREE',
                description: 'Basic features for small shops',
                price: 0,
                billingCycle: 'monthly',
                features: ['Basic POS', 'Inventory Management', '1 User'],
                isActive: true
            },
            {
                name: 'Starter',
                code: 'STARTER',
                description: 'More power for growing businesses',
                price: 29,
                billingCycle: 'monthly',
                features: ['All Free features', 'Sales Analytics', '3 Users'],
                isActive: true
            },
            {
                name: 'Professional',
                code: 'PRO',
                description: 'Advanced tools for large retailers',
                price: 99,
                billingCycle: 'monthly',
                features: ['All Starter features', 'HRM', 'Multiple Branches', 'Unlimited Users'],
                isActive: true
            },
            {
                name: 'Enterprise',
                code: 'ENTERPRISE',
                description: 'Custom solutions for chains',
                price: 499,
                billingCycle: 'yearly',
                features: ['All Pro features', 'Dedicated Support', 'Custom Integrations'],
                isActive: true
            }
        ];

        console.log('Seeding SubscriptionPlans...');
        for (const plan of plans) {
            await SubscriptionPlan.updateOne(
                { code: plan.code },
                { $set: plan },
                { upsert: true }
            );
            console.log(`- Upserted ${plan.name} (${plan.code})`);
        }

        console.log('Seeding completed successfully.');
    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
};

seedPlans();
