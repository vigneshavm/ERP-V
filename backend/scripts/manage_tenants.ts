import { connectDB, disconnectDB } from "./utils/db.js";
import Tenant from "../src/modules/core/models/Tenant.js";
import User from "../src/modules/core/models/User.js";
import mongoose from "mongoose";

async function listTenants() {
    await connectDB();
    try {
        const tenants = await Tenant.find({}).lean();
        console.log(`\nTotal Tenants: ${tenants.length}`);
        const summary = tenants.map(t => ({
            ID: t._id,
            Name: t.name,
            Slug: t.slug,
            Status: (t as any).status
        }));
        console.table(summary);
    } catch (err: any) {
        console.error("Error listing tenants:", err.message);
    } finally {
        await disconnectDB();
    }
}

async function checkTenantUsers(slug: string) {
    await connectDB();
    try {
        const tenant = await Tenant.findOne({ slug });
        if (!tenant) throw new Error(`Tenant ${slug} not found`);

        const users = await User.find({ tenantId: tenant._id }).lean();
        console.log(`\nUsers for Tenant: ${tenant.name} (${slug})`);
        const summary = users.map(u => ({
            Name: u.name,
            Email: u.email,
            Role: u.role,
            Status: u.status
        }));
        console.table(summary);
    } catch (err: any) {
        console.error("Error checking tenant users:", err.message);
    } finally {
        await disconnectDB();
    }
}

async function createTenant(name: string, slug: string, ownerEmail: string) {
    await connectDB();
    try {
        const user = await User.findOne({ email: ownerEmail });
        if (!user) throw new Error(`User ${ownerEmail} not found`);

        const existing = await Tenant.findOne({ slug });
        if (existing) {
            console.log(`Tenant with slug ${slug} already exists.`);
            return;
        }

        const tenant = await Tenant.create({
            name,
            slug,
            ownerId: user._id,
            status: 'ACTIVE',
            config: {
                currency: 'INR'
            }
        });

        user.tenantId = tenant._id as mongoose.Types.ObjectId;
        await user.save();

        console.log(`Successfully created tenant: ${name} (${slug}) and linked to ${ownerEmail}`);
    } catch (err: any) {
        console.error("Error creating tenant:", err.message);
    } finally {
        await disconnectDB();
    }
}

// CLI Routing
const [command, arg1, arg2, arg3] = process.argv.slice(2);

switch (command) {
    case 'list':
        listTenants();
        break;
    case 'users':
        checkTenantUsers(arg1 || 'vijaya-laxmi');
        break;
    case 'create':
        createTenant(arg1 || 'New Tenant', arg2 || 'new-tenant', arg3 || 'admin@example.com');
        break;
    default:
        console.log('Usage: npx tsx scripts/manage_tenants.ts [list|users|create] [arg1] [arg2] [arg3]');
}
