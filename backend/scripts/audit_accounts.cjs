const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env.local' });

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
const logFile = 'audit_accounts.log';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function run() {
    try {
        log("Audit Start: " + new Date().toISOString());
        await mongoose.connect(mongoURI);
        log("Connected.");

        // 1. Users
        const users = await User.find({});
        log(`Total Users: ${users.length}`);

        // Group by Tenant
        const usersByTenant = {};
        users.forEach(u => {
            if (!usersByTenant[u.tenantId]) usersByTenant[u.tenantId] = [];
            usersByTenant[u.tenantId].push(`${u.name} (${u.email})`);
        });

        Object.keys(usersByTenant).forEach(tid => {
            log(`Tenant [${tid}]:`);
            usersByTenant[tid].forEach(u => log(`  - User: ${u}`));
        });

        // 2. Accounts
        const accounts = await BankAccount.find({});
        log(`Total Accounts: ${accounts.length}`);

        // Group by Tenant
        const accountsByTenant = {};
        accounts.forEach(a => {
            if (!accountsByTenant[a.tenantId]) accountsByTenant[a.tenantId] = [];
            accountsByTenant[a.tenantId].push(`${a.bankName} (${a.accountType})`);
        });

        Object.keys(accountsByTenant).forEach(tid => {
            log(`Tenant [${tid}]:`);
            accountsByTenant[tid].forEach(a => log(`  - Account: ${a}`));
        });

        // Check for Orphans (Accounts with no Users or vice versa)
        log("--- Analysis ---");
        Object.keys(usersByTenant).forEach(tid => {
            if (!accountsByTenant[tid] || accountsByTenant[tid].length === 0) {
                log(`WARNING: Tenant [${tid}] has USERS but NO ACCOUNTS!`);
            }
        });

    } catch (error) {
        log("Error: " + error.message);
    } finally {
        await mongoose.disconnect();
    }
}

run();
