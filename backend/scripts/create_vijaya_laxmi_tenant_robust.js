import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'owner' },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    status: { type: String, default: 'active' }
}, { timestamps: true });

const TenantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, default: 'ACTIVE' },
    subscriptionPlan: { type: mongoose.Schema.Types.ObjectId, required: true },
    config: {
        currency: { type: String, default: 'INR' },
        timezone: { type: String, default: 'Asia/Kolkata' },
        theme: {
            primaryColor: { type: String, default: '#007bff' },
            logoUrl: { type: String, default: '' }
        }
    }
}, { timestamps: true });

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

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
            name: 'Vijaya Laxmi',
            email: email,
            password: 'password123',
            role: 'owner',
            status: 'active'
        });

        const savedUser = await owner.save();
        console.log(`Created Owner User: ${savedUser._id}`);

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
