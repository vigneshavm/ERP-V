
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
        console.log('Connecting...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB.');

        const tenant = await Tenant.findOne({ name: /Vijaya Laxmi/i });
        if (!tenant) {
            console.log('Tenant "Vijaya Laxmi" not found.');
        } else {
            console.log(`Tenant: ${tenant.name}`);
            console.log(`Current Modules: ${JSON.stringify(tenant.modules)}`);

            let modules = [...(tenant.modules || [])];
            let modified = false;

            // Check for Purchase and others
            const required = ['PURCHASE', 'INVENTORY', 'POS', 'FINANCE', 'HR', 'REPORTS', 'CUSTOMERS', 'SUPPLIERS', 'EXPENSES'];

            required.forEach(m => {
                if (!modules.includes(m)) {
                    console.log(`Adding missing module: ${m}`);
                    modules.push(m);
                    modified = true;
                }
            });

            if (modified) {
                // Need to update directly
                await Tenant.updateOne({ _id: tenant._id }, { $set: { modules: modules } });
                console.log('✅ Updated tenant modules.');
                console.log(`New Modules: ${JSON.stringify(modules)}`);
            } else {
                console.log('✅ All required modules present.');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Done.');
        process.exit(0);
    }
}

checkModules();
