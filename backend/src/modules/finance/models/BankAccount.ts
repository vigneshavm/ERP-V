import mongoose, { Schema } from "mongoose";
import crypto from "crypto";
import { IBankAccount } from "../../../interfaces/IBankAccount.js";

const bankAccountSchema = new Schema<IBankAccount>(
    {
        bankName: {
            type: String,
            required: [true, "Please enter bank name"],
        },
        accountNumber: {
            type: String,
            required: [true, "Please enter account number"],
        },
        accountType: {
            type: String,
            enum: ["Savings", "Current", "Overdraft", "Loan", "Cash"],
            default: "Savings",
        },
        branch: {
            type: String,
            default: "",
        },
        ifsc: {
            type: String,
            required: [true, "Please enter IFSC code"],
        },
        openingBalance: {
            type: Number,
            default: 0,
        },
        currentBalance: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        userId: {
            type: String, // Keeping as String for consistency, can be ObjectId
            ref: "User",
            required: true,
        },
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },
        transactions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "CashbankTransaction",
        }],
    },
    { timestamps: true }
);

// Encrypt account number before save
bankAccountSchema.pre("save", function (next) {
    if (!this.isModified("accountNumber")) return next();

    // Use a proper 32-byte key derived from secret (using COOKIE_SECRET as fallback/base)
    const algorithm = "aes-256-cbc";
    // Ensure the key is 32 bytes (256 bits). Use a specific ENCRYPTION_KEY env var if available, else derive from COOKIE_SECRET
    const secret = process.env.ENCRYPTION_KEY || process.env.COOKIE_SECRET || "default_fallback_secret_must_be_long";
    const key = crypto.scryptSync(secret, "salt", 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(this.accountNumber as string, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Store IV : EncryptedData
    this.accountNumber = (iv.toString("hex") + ":" + encrypted) as any;
    next();
});

// Decrypt account number method
bankAccountSchema.methods.getDecryptedAccountNumber = function () {
    const parts = this.accountNumber.split(":");
    if (parts.length < 2) return this.accountNumber;

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const algorithm = "aes-256-cbc";
    const secret = process.env.ENCRYPTION_KEY || process.env.COOKIE_SECRET || "default_fallback_secret_must_be_long";
    const key = crypto.scryptSync(secret, "salt", 32);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};

const BankAccount = mongoose.model<IBankAccount>("BankAccount", bankAccountSchema);
export default BankAccount;
