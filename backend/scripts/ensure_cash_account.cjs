const mongoose = require('mongoose');
require('dotenv').config();

const BankAccountSchema = new mongoose.Schema({
    tenantId: String,
    bankName: String,
    accountType: String, // 'Cash', 'Savings', 'Current', 'Overdraft'
    currentBalance: Number
}, { timestamps: true });

const BankAccount = mongoose.model('BankAccount', BankAccountSchema);

async function ensureAccount() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        const count = await BankAccount.countDocuments({ accountType: 'Cash' });
        console.log(`Current Cash Accounts: ${count}`);

        if (count === 0) {
            console.log("Creating default Office Cash account...");
            await BankAccount.create({
                tenantId: 'default-tenant-id', // Using a placeholder/default
                bankName: 'Office Cash',
                accountType: 'Cash',
                currentBalance: 0
            });
            console.log("Created 'Office Cash' account.");
        } else {
            console.log("Cash account already exists.");
        }
        console.log("Done.");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

ensureAccount();
