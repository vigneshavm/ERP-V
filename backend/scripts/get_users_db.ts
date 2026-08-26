import dns from "dns";
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from "mongoose";
import { connectDB, disconnectDB } from "./utils/db.js";
import User from "../src/modules/core/models/User.js";
import Tenant from "../src/modules/core/models/Tenant.js";

async function fetchUserLoginDetails() {
    console.log("Connecting to MongoDB Atlas database...");
    await connectDB();

    try {
        const users = await User.find({}).lean();
        console.log(`Found ${users.length} user(s) in database:\n`);

        const tenants = await Tenant.find({}).lean();
        const tenantMap = new Map();
        tenants.forEach((t: any) => {
            tenantMap.set(t._id.toString(), t);
        });

        const formattedUsers = users.map((u: any) => {
            const tenantInfo = u.tenantId ? tenantMap.get(u.tenantId.toString()) : null;
            return {
                id: u._id.toString(),
                name: u.name,
                email: u.email,
                role: u.role,
                status: u.status || 'active',
                phone: u.phone || 'N/A',
                shopName: u.shopName || tenantInfo?.name || 'N/A',
                subdomain: u.subdomain || tenantInfo?.slug || 'N/A',
                tenantId: u.tenantId ? u.tenantId.toString() : 'N/A',
                lastLogin: u.lastLogin ? u.lastLogin.toISOString() : 'Never',
                createdAt: u.createdAt ? u.createdAt.toISOString() : 'N/A',
            };
        });

        console.table(formattedUsers);
        console.log("\nDetailed JSON Output:");
        console.log(JSON.stringify(formattedUsers, null, 2));

    } catch (err) {
        console.error("Error fetching users:", err);
    } finally {
        await disconnectDB();
    }
}

fetchUserLoginDetails();
