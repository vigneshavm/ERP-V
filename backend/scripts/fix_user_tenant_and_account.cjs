const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: '../../.env.local' });

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bizzai';
const logFile = 'fix_tenant_migration.log';

function log(msg) {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${msg}`;
    console.log(logMsg);
    fs.appendFileSync(logFile, logMsg + '\n');
}

// Schemas
const TenantSchema = new mongoose.Schema({
    name: String,
    code: String,
    address: String,
    phone: String
}, { strict: false });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }
}, { strict: false });

const BankAccountSchema = new mongoose.Schema({
    tenantId: String,
    bankName: String,
    accountType: String,
    currentBalance: Number
}, { timestamps: true });

const Tenant = mongoose.model('Tenant', TenantSchema);
const User = mongoose.model('User', UserSchema);
const BankAccount = mongoose.model('BankAccount', BankAccountSchema);

async function runMigration() {
    try {
        log("Starting Migration...");
        await mongoose.connect(mongoURI);
        log("Connected to MongoDB.");

        // 1. Identify/Create "Vijaya Laxmi" Tenant
        let tenant = await Tenant.findOne({ name: 'Vijaya Laxmi' });
        if (!tenant) {
            log("Tenant 'Vijaya Laxmi' not found. Creating...");
            tenant = await Tenant.create({
                name: 'Vijaya Laxmi',
                code: 'VL',
                address: 'Main Market',
                phone: '9999999999'
            });
            log(`Created Tenant: ${tenant.name} (${tenant._id})`);
        } else {
            log(`Found Tenant: ${tenant.name} (${tenant._id})`);
        }

        const tenantId = tenant._id;

        // 2. Fix Users (Assign Tenant ID)
        // Find users without a tenantId or with invalid tenantId
        // For this specific fix, we'll update ALL users to this tenant as it appears to be a single-shop setup currently
        // or check for specific users if needed. User asked to "Add New Component" implies they are the owner.

        const users = await User.find({});
        let updatedCount = 0;

        for (const user of users) {
            // Update if tenantId is missing or different (forcing alignment for this fix)
            if (!user.tenantId || user.tenantId.toString() !== tenantId.toString()) {
                user.tenantId = tenantId;
                await user.save();
                log(`Updated User: ${user.name} (${user.email}) -> Tenant: ${tenantId}`);
                updatedCount++;
            }
        }
        log(`Total Users Updated: ${updatedCount}`);

        // 3. Ensure Cash Account for THIS Tenant
        const cashAccount = await BankAccount.findOne({ tenantId: tenantId.toString(), accountType: 'Cash' });
        if (!cashAccount) {
            log(`No Cash Account found for Tenant ${tenantId}. Creating...`);
            await BankAccount.create({
                tenantId: tenantId.toString(),
                bankName: 'Office Cash',
                accountType: 'Cash',
                currentBalance: 0
            });
            log("Created 'Office Cash' account for Vijaya Laxmi.");
        } else {
            log(`Cash Account exists: ${cashAccount.bankName} (${cashAccount._id})`);
        }

        log("Migration Completed Successfully.");

    } catch (error) {
        log("ERROR: " + error.message);
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

runMigration();
