import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SubscriptionPlan from '../src/modules/core/models/SubscriptionPlan.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const plans = [
    {
        name: 'Free',
        code: 'FREE',
        description: 'Basic features for small shops',
        price: 0,
        billingCycle: 'lifetime',
        features: ['Up to 50 items', 'Basic reporting', 'Single user'],
        isActive: true
    },
    {
        name: 'Starter',
        code: 'STARTER',
        description: 'Perfect for growing businesses',
        price: 29,
        billingCycle: 'monthly',
        features: ['Up to 500 items', 'Standard reporting', 'Multi-user', 'E-commerce enabled'],
        isActive: true
    },
    {
        name: 'Professional',
        code: 'PRO',
        description: 'Advanced features for established shops',
        price: 99,
        billingCycle: 'monthly',
        features: ['Unlimited items', 'Advanced analytics', 'Custom domain', 'Priority support'],
        isActive: true
    },
    {
        name: 'Enterprise',
        code: 'ENTERPRISE',
        description: 'Custom solutions for large scale operations',
        price: 499,
        billingCycle: 'monthly',
        features: ['Dedicated account manager', 'Custom integrations', 'SLA guaranteed', 'On-premise option'],
        isActive: true
    }
];

const seedPlans = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        for (const plan of plans) {
            await SubscriptionPlan.findOneAndUpdate(
                { code: plan.code },
                plan,
                { upsert: true, new: true }
            );
            console.log(`   ✓ Seeded plan: ${plan.name}`);
        }

        console.log('✅ Subscription plans seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding subscription plans:', error);
        process.exit(1);
    }
};

seedPlans();
