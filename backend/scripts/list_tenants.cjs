const mongoose = require('mongoose');
require('dotenv').config();

const TenantSchema = new mongoose.Schema({
    name: String,
    // other fields...
}, { strict: false });

const Tenant = mongoose.model('Tenant', TenantSchema);

async function listTenants() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        const tenants = await Tenant.find({});
        console.log("Tenants found:", tenants.length);
        tenants.forEach(t => {
            console.log(`ID: ${t._id}, Name: ${t.name}, Code: ${t.code || 'N/A'}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

listTenants();
