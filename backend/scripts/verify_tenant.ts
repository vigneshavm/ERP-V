import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import Tenant from '../src/modules/core/models/Tenant.js';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        const tenant = await Tenant.findById('67a746536098056f34e366fd');
        console.log('Result for 67a746536098056f34e366fd:');
        console.log(JSON.stringify(tenant, null, 2));

        const allTenants = await Tenant.find({}, '_id name');
        console.log('\nAll Tenants:');
        console.log(JSON.stringify(allTenants, null, 2));

        process.exit(0);
    } catch (err: any) {
        console.error(err);
        process.exit(1);
    }
};

run();
