import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from '../modules/core/models/Role.js';

dotenv.config();

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
        console.log('Connecting to MongoDB...', process.env.MONGO_URI ? 'URI Found' : 'URI Missing');
        await mongoose.connect(process.env.MONGO_URI as string);
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
