import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import Loan from "./src/modules/finance/models/Loan.js";
import LoanPayment from "./src/modules/finance/models/LoanPayment.js";
import BankAccount from "./src/modules/finance/models/BankAccount.js";
import CashbankTransaction from "./src/modules/finance/models/CashbankTransaction.js";

dotenv.config();

async function runTest() {
    console.log("Starting Loan Module Tests...");
    let mongoServer;

    try {
        // Start MongoMemoryServer
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        await mongoose.connect(uri);
        console.log("Connected to in-memory database.");

        const dummyTenantId = new mongoose.Types.ObjectId();
        const dummyUserId = new mongoose.Types.ObjectId().toString();

        // 1. Create a dummy Bank Account
        const bankAccount = await BankAccount.create({
            bankName: "HDFC Bank",
            accountNumber: "1234567890",
            ifsc: "HDFC0001234",
            currentBalance: 500000, // 5 Lakhs
            tenantId: dummyTenantId,
            userId: dummyUserId,
            accountType: "Savings"
        });
        console.log(`[OK] Created Bank Account: ${bankAccount.bankName}, Balance: ${bankAccount.currentBalance}`);

        // 2. Create a Loan
        const loan = await Loan.create({
            name: "Business Expansion Loan",
            principalAmount: 1000000,
            interestRate: 10, // 10% pa
            termMonths: 60,
            emiAmount: 21247, // Rough EMI approximation
            totalPendingAmount: 1274820, // Total to pay
            startDate: new Date(),
            tenantId: dummyTenantId,
            userId: dummyUserId
        });
        console.log(`[OK] Created Loan: ${loan.name}, Pending Amount: ${loan.totalPendingAmount}`);

        // 3. Process an EMI Payment
        const paymentAmount = 21247;
        console.log(`\nProcessing EMI Payment of ${paymentAmount}...`);

        // Simulate controller logic (deducting from bank and creating payment)
        const bankAcc = await BankAccount.findById(bankAccount._id);
        bankAcc.currentBalance -= paymentAmount;
        await bankAcc.save();

        await CashbankTransaction.create({
            type: "out",
            amount: paymentAmount,
            fromAccount: bankAcc._id,
            toAccount: "loan",
            description: `EMI Payment for Loan: ${loan.name}`,
            date: new Date(),
            userId: dummyUserId,
        });

        const payment = await LoanPayment.create({
            loanId: loan._id,
            paymentDate: new Date(),
            amountPaid: paymentAmount,
            paymentMethod: "BankTransfer",
            bankAccountId: bankAcc._id,
            referenceNumber: "TXN12345",
            tenantId: dummyTenantId,
            userId: dummyUserId,
        });

        loan.totalPendingAmount -= paymentAmount;
        await loan.save();

        console.log(`[OK] Payment successfully recorded with ref: ${payment.referenceNumber}`);
        console.log(`[OK] Bank Account New Balance: ${bankAcc.currentBalance}`);
        console.log(`[OK] Loan New Pending Amount: ${loan.totalPendingAmount}`);

        if (loan.totalPendingAmount === (1274820 - 21247)) {
            console.log("✅ Math verification passed: Pending amount updated correctly.");
        } else {
            console.log("❌ Verification Failed: Math is incorrect.");
        }

    } catch (err) {
        console.error("Test failed: ", err);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
        console.log("Finished and cleaned up.");
    }
}

runTest();
