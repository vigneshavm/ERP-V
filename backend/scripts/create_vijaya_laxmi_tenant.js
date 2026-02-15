import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Define Minimal schemas to avoid import logic issues in CJS-like execution if needed, 
// though project uses ESM. But project models have pre-save hooks which are better to use.
// I will try to import the actual models first.
import User from '../src/modules/core/models/User.js';
import Tenant from '../src/modules/core/models/Tenant.js';

const run = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI not found in .env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB.');

        const email = 'vijayalaxmi@bizzai.com';
        const tenantName = 'Vijaya Laxmi';
        const slug = 'vijaya-laxmi';

        // 1. Check if tenant already exists
        const existingTenant = await Tenant.findOne({ slug });
        if (existingTenant) {
            console.log(`Tenant with slug "${slug}" already exists.`);
            process.exit(0);
        }

        // 2. Create Owner User
        const owner = new User({
            name: 'Vijaya Laxmi', // User model has 'name' field
            fullName: 'Vijaya Laxmi', // User model has 'fullName' in some searches but schema says 'name'
            email: email,
            password: 'password123', // Will be hashed by pre-save hook
            role: 'owner',
            status: 'active'
        });

        const savedUser = await owner.save();
        console.log(`Created Owner: ${savedUser._id}`);

        // 3. Create Tenant
        const tenant = new Tenant({
            name: tenantName,
            slug: slug,
            ownerId: savedUser._id,
            status: 'ACTIVE',
            subscriptionPlan: new mongoose.Types.ObjectId('69763240b4e5b78d9a901076'), // STARTER
            config: {
                currency: 'INR',
                timezone: 'Asia/Kolkata',
                theme: { primaryColor: '#007bff', logoUrl: '' }
            }
        });

        const savedTenant = await tenant.save();
        console.log(`Created Tenant: ${savedTenant._id}`);

        // 4. Update User with TenantId
        savedUser.tenantId = savedTenant._id;
        await savedUser.save();
        console.log(`Linked User to Tenant.`);

        console.log('\n--- SUCCESS ---');
        console.log(`Tenant Name: ${savedTenant.name}`);
        console.log(`Owner Email: ${savedUser.email}`);

        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err);
        process.exit(1);
    }
};

run();
