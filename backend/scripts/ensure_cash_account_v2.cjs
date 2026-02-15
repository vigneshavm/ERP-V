const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env.local' }); // Try pointing to the env file explicitly, adapting relative path as needed

// If that doesn't work, we can fallback to process.env or just hardcode for this script if we knew it, but we don't.
// Let's assume standard local connection if not found: 'mongodb://localhost:27017/bizzai'

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bizzai';

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    tenantId: String
}, { strict: false });

const BankAccountSchema = new mongoose.Schema({
    tenantId: String,
    bankName: String,
    accountType: String,
    currentBalance: Number
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const BankAccount = mongoose.model('BankAccount', BankAccountSchema);

const fs = require('fs');
const logFile = 'debug_cash_account.log';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function run() {
    try {
        log("Starting script..." + new Date().toISOString());
        log("Connecting to: " + mongoURI);
        await mongoose.connect(mongoURI);
        log("Connected.");

        // 1. Find a valid Tenant ID from Users
        const users = await User.find({}).limit(5);
        if (users.length === 0) {
            log("No users found! Cannot determine Tenant ID.");
            return;
        }

        log("Found Users:");
        users.forEach(u => log(`- ${u.name} (${u.email}) -> Tenant: ${u.tenantId}`));

        // Pick one - let's say the first one, or look for specific one
        const tenantId = users[0].tenantId;
        log(`Using Tenant ID: ${tenantId}`);

        // 2. Check/Create Account
        const existing = await BankAccount.findOne({ tenantId, accountType: 'Cash' });
        if (existing) {
            log(`Cash Account found for tenant ${tenantId}: ${existing.bankName}`);
        } else {
            log(`No Cash Account for tenant ${tenantId}. Creating...`);
            await BankAccount.create({
                tenantId,
                bankName: 'Office Cash',
                accountType: 'Cash',
                currentBalance: 0
            });
            log("Created 'Office Cash' account.");
        }

    } catch (error) {
        log("Error: " + error.message);
    } finally {
        await mongoose.disconnect();
    }
}

run();
