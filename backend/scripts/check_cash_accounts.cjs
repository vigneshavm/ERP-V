const mongoose = require('mongoose');
require('dotenv').config();

const BankAccountSchema = new mongoose.Schema({
    tenantId: String,
    bankName: String,
    accountType: String, // 'Cash', 'Savings', 'Current', 'Overdraft'
    currentBalance: Number
}, { timestamps: true });

const BankAccount = mongoose.model('BankAccount', BankAccountSchema);

async function checkAccounts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const accounts = await BankAccount.find({});
        console.log(`Found ${accounts.length} accounts.`);

        accounts.forEach(acc => {
            console.log(`- ${acc.bankName} (${acc.accountType}): ${acc.currentBalance}`);
        });

        if (accounts.length === 0) {
            console.log("No accounts found. Creating default Office Cash account...");
            const newAccount = await BankAccount.create({
                tenantId: 'default-tenant-id', // We generally need the real tenantId, but for this script we might need to find it or use a placeholder if the app is single-tenant in dev
                bankName: 'Office Cash',
                accountType: 'Cash',
                currentBalance: 0
            });
            console.log("Created:", newAccount);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkAccounts();
