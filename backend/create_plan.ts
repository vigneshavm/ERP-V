import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import SubscriptionPlan from './src/modules/core/models/SubscriptionPlan.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        let plan = await SubscriptionPlan.findOne({ code: 'FREE' });
        if (!plan) {
            plan = await SubscriptionPlan.create({
                name: 'Free Plan',
                code: 'FREE',
                price: 0,
                billingCycle: 'lifetime',
                features: ['Basic POS', 'Inventory Management'],
                isActive: true
            });
            console.log('Created FREE plan:', plan._id);
        } else {
            console.log('FREE plan already exists:', plan._id);
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
