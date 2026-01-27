import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tenant from '../src/modules/core/models/Tenant.js';
import SubscriptionPlan from '../src/modules/core/models/SubscriptionPlan.js';

dotenv.config();

const verifyLogic = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Ensure Plans exist
        const starter = await SubscriptionPlan.findOne({ code: 'STARTER' });
        const pro = await SubscriptionPlan.findOne({ code: 'PROFESSIONAL' });

        if (!starter || !pro) {
            console.error('❌ Starter or Pro plans not found. Please run seedPlans.ts first.');
            process.exit(1);
        }

        // 2. Clear/Create Test Tenant
        await Tenant.deleteMany({ slug: 'test-subscription' });
        const tenant = await Tenant.create({
            name: 'Test Business',
            shopName: 'Test Shop',
            slug: 'test-subscription',
            ownerId: new mongoose.Types.ObjectId(),
            status: 'ACTIVE',
            subscriptionPlan: pro._id,
            subscriptionStartDate: new Date(),
            subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            config: {
                theme: { primaryColor: '#000', logoUrl: '' },
                currency: 'USD',
                timezone: 'UTC'
            }
        });
        console.log('✅ Created test tenant with active PRO plan (Price: ' + pro.price + ')');

        // Mocking the Controller logic for verification
        const checkDowngrade = (currentPlan, targetPlan, endDate) => {
            const now = new Date();
            const isActive = endDate && endDate > now;
            if (isActive && targetPlan.price < currentPlan.price) {
                return { success: false, message: 'Downgrades not allowed' };
            }
            return { success: true };
        };

        const resultDowngrade = checkDowngrade(pro, starter, tenant.subscriptionEndDate);
        console.log('   - Testing Downgrade (PRO -> STARTER):', resultDowngrade.success ? 'FAIL (Allowed)' : 'PASS (Blocked: ' + resultDowngrade.message + ')');

        // Test Upgrade
        tenant.subscriptionPlan = starter._id;
        tenant.subscriptionEndDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days left on Starter
        console.log('✅ Updated test tenant to STARTER with 15 days left (Price: ' + starter.price + ')');

        const calculateUpgrade = (currentPlan, targetPlan, endDate) => {
            const now = new Date();
            const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const cycleDays = 30;
            const dailyRateDiff = (targetPlan.price - currentPlan.price) / cycleDays;
            return Math.max(0, dailyRateDiff * remainingDays);
        };

        const upgradeAmount = calculateUpgrade(starter, pro, tenant.subscriptionEndDate);
        console.log('   - Testing Upgrade (STARTER -> PRO):');
        console.log('     Remaining Days:', Math.ceil((tenant.subscriptionEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        console.log('     Estimated Balance to Pay:', upgradeAmount.toFixed(2));

        await Tenant.deleteMany({ slug: 'test-subscription' });
        console.log('✅ Cleaned up test data');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during verification:', error);
        process.exit(1);
    }
};

verifyLogic();
