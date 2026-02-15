import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Fix for __dirname in ESM
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const RoleSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, trim: true },
    systemRole: { type: String, required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },
    isSystem: { type: Boolean, default: false },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Composite index
RoleSchema.index({ tenantId: 1, code: 1 }, { unique: true });

const Role = mongoose.model('Role', RoleSchema);

const SYSTEM_ROLES = [
    {
        name: 'Owner',
        code: 'OWNER',
        description: 'Business Owner with full access',
        systemRole: 'owner',
        isSystem: true
    },
    {
        name: 'Co-Owner',
        code: 'CO_OWNER',
        description: 'Partner with near-full access',
        systemRole: 'co-owner',
        isSystem: true
    },
    {
        name: 'Admin',
        code: 'ADMIN',
        description: 'Administrator with management access',
        systemRole: 'admin',
        isSystem: true
    },
    {
        name: 'Manager',
        code: 'MANAGER',
        description: 'Store Manager',
        systemRole: 'manager',
        isSystem: true
    },
    {
        name: 'Senior Staff',
        code: 'SENIOR_STAFF',
        description: 'Experienced staff member',
        systemRole: 'staff',
        isSystem: true
    },
    {
        name: 'Staff',
        code: 'STAFF',
        description: 'Standard staff member',
        systemRole: 'staff',
        isSystem: true
    },
    {
        name: 'Junior Staff',
        code: 'JUNIOR_STAFF',
        description: 'Junior staff member',
        systemRole: 'staff',
        isSystem: true
    },
    {
        name: 'Biller',
        code: 'BILLER',
        description: 'Staff focused on billing and POS',
        systemRole: 'staff',
        isSystem: true
    },
    {
        name: 'New Joiner',
        code: 'NEW_JOINER',
        description: 'Probationary staff member',
        systemRole: 'staff',
        isSystem: true
    }
];

const seedRoles = async () => {
    try {
        console.log('Connecting to MongoDB...');
        // console.log('URI:', process.env.MONGO_URI); // Debug only

        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from environment variables");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        for (const role of SYSTEM_ROLES) {
            await Role.findOneAndUpdate(
                { code: role.code, isSystem: true },
                role,
                { upsert: true, new: true }
            );
            console.log(`Seeded role: ${role.name}`);
        }

        console.log('Role seeding completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding roles:', error);
        process.exit(1);
    }
};

seedRoles();
