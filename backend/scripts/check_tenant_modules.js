
import mongoose from 'mongoose';

// Correct Cloud URI
const MONGODB_URI = "mongodb+srv://avmvignesh0207_db_user:XB5qPLz5l08d6FvL@cluster0.kxzqtht.mongodb.net/bizzai?retryWrites=true&w=majority";

const TenantSchema = new mongoose.Schema({
    name: String,
    modules: [String],
    subscriptionPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' }
}, { strict: false });

const Tenant = mongoose.model('Tenant', TenantSchema);

async function checkModules() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const tenant = await Tenant.findOne({ name: /Vijaya Laxmi/i });
        if (!tenant) {
            console.log('Tenant not found.');
        } else {
            console.log(`Tenant: ${tenant.name}`);
            console.log(`Modules: ${JSON.stringify(tenant.modules)}`);

            // Check if PURCHASE is present
            if (!tenant.modules || !tenant.modules.includes('PURCHASE')) {
                console.log('❌ PURCHASE module is MISSING!');
                // Fix it
                if (!tenant.modules) tenant.modules = [];
                tenant.modules.push('PURCHASE');
                // Add other likely needed modules
                ['INVENTORY', 'POS', 'FINANCE', 'HR', 'REPORTS', 'CUSTOMERS', 'SUPPLIERS', 'EXPENSES'].forEach(m => {
                    if (!tenant.modules.includes(m)) tenant.modules.push(m);
                });

                await tenant.save();
                console.log('✅ Added missing modules (incl. PURCHASE).');
                console.log(`New Modules: ${JSON.stringify(tenant.modules)}`);
            } else {
                console.log('✅ PURCHASE module is enabled.');
            }
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkModules();
