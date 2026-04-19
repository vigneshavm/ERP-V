import { connectDB, disconnectDB } from './db.js';
import User from '../../src/modules/core/models/User.js';
import Tenant from '../../src/modules/core/models/Tenant.js';

async function listAll() {
    await connectDB();
    try {
        console.log('Fetching data...');
        const tenants = await Tenant.find({}).lean();
        const users = await User.find({}).lean();

        console.log(`Total Tenants: ${tenants.length}`);
        console.log(`Total Users: ${users.length}`);

        const tenantsMap: Record<string, string> = {};
        tenants.forEach((t: any) => {
            tenantsMap[t._id.toString()] = t.name || t.shopName || 'Unnamed Tenant';
        });

        const usersByTenant: Record<string, any[]> = {};
        users.forEach((u: any) => {
            const tId = u.tenantId ? u.tenantId.toString() : 'No Tenant';
            if (!usersByTenant[tId]) usersByTenant[tId] = [];
            usersByTenant[tId].push({
                name: u.name,
                email: u.email,
                role: u.role
            });
        });

        console.log('\n--- Users by Tenant ---');
        for (const tId in usersByTenant) {
            const tenantName = tenantsMap[tId] || `Tenant (${tId})`;
            console.log(`\nTenant: ${tenantName}`);
            usersByTenant[tId].forEach(u => {
                console.log(`  - ${u.name} <${u.email}> (${u.role})`);
            });
        }
    } catch (err) {
        console.error('Error during list operation:', err);
    } finally {
        await disconnectDB();
    }
}

listAll();
