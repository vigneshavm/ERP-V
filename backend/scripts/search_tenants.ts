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
        const tenants = await Tenant.find({ name: /Default Organization/i });
        console.log(JSON.stringify(tenants, null, 2));
        process.exit(0);
    } catch (err: any) {
        console.error(err);
        process.exit(1);
    }
};

run();
