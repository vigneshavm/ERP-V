import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Tenant from '../src/modules/core/models/Tenant.js';
import SubscriptionPlan from '../src/modules/core/models/SubscriptionPlan.js';

// Setup __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const testUpdate = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MONGO_URI not defined');

        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected.');

        // 1. Find the default tenant
        const tenant = await Tenant.findOne({ slug: 'default-tenant' }).populate('subscriptionPlan');
        if (!tenant) throw new Error('Default tenant not found');

        const initialPlanName = (tenant.subscriptionPlan as any)?.name || 'Unknown';
        console.log(`\n📊 Initial Plan: ${initialPlanName}`);

        // 2. Find a different plan to switch to (e.g., Professional or PRO)
        const targetPlan = await SubscriptionPlan.findOne({ code: 'PRO' });
        if (!targetPlan) throw new Error('Target plan (PRO) not found');
        console.log(`🎯 Target Plan: ${targetPlan.name} (ID: ${targetPlan._id})`);

        // 3. Simulate the update logic (same as in ShopController)
        console.log('\n🔄 Simulating update to "Professional"...');

        // Find by name like the controller does
        const planToUpdateTo = "Professional";
        const matchedPlan = await SubscriptionPlan.findOne({
            $or: [{ name: planToUpdateTo }, { code: planToUpdateTo }]
        });

        if (!matchedPlan) throw new Error('Plan lookup failed');

        tenant.subscriptionPlan = matchedPlan._id as any;
        await tenant.save();
        console.log('✅ Tenant saved with new plan.');

        // 4. Verify the update
        const updatedTenant = await Tenant.findById(tenant._id).populate('subscriptionPlan');
        const finalPlanName = (updatedTenant?.subscriptionPlan as any)?.name;
        const finalPlanId = (updatedTenant?.subscriptionPlan as any)?._id.toString();

        console.log(`\n✅ Final Plan: ${finalPlanName}`);

        if (finalPlanName === targetPlan.name && finalPlanId === targetPlan._id.toString()) {
            console.log('\n🎉 SUCCESS: Subscription update verified!');
        } else {
            console.log('\n❌ FAILURE: Plan naming or ID mismatch.');
        }

        // 5. Cleanup: Reset to FREE if needed or leave it (it's a test organization)
        console.log('\n🔄 Resetting to FREE plan...');
        const freePlan = await SubscriptionPlan.findOne({ code: 'FREE' });
        if (freePlan) {
            updatedTenant!.subscriptionPlan = freePlan._id as any;
            await updatedTenant!.save();
            console.log('✅ Reset to FREE successfully.');
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected.');
    }
};

testUpdate();
