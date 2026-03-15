import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../../../interfaces/IUser.js";

// Extend the interface if needed, or assume IUser will be updated separately. 
// For Mongoose schema, we define fields explicitly.


const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, "Please enter your name"],
        },
        email: {
            type: String,
            required: [true, "Please enter email"],
            // unique: true, // REMOVED for Multi-tenancy. Uniqueness is now scoped by { email, tenantId }
            lowercase: true,
        },
        password: {
            type: String,
            required: [true, "Please enter password"],
        },
        shopName: {
            type: String,
            default: "",
        },
        gstNumber: {
            type: String,
            default: "",
        },
        shopAddress: {
            type: String,
            default: "",
        },
        phone: {
            type: String,
            default: "",
        },
        sector: {
            type: String,
            default: "",
        },
        subdomain: {
            type: String,
            default: "",
        },
        // NEW: Multi-tenancy link
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'Tenant',
            // required: true, // TODO: Make required after migration. For now optional to prevent breaking existing users immediately if not migrating
            index: true
        },
        role: {
            type: String,
            enum: ["owner", "co-owner", "manager", "staff", "customer", "superadmin"], // Expanded roles
            default: "owner",
        },
        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
        },
        // Device session tracking for single device login enforcement
        activeDeviceId: {
            type: String,
            default: null,
            index: true,
        },
        activeSessionCreatedAt: {
            type: Date,
            default: null,
        },
        lastLoginIp: {
            type: String,
            default: null,
        },
        lastLoginUserAgent: {
            type: String,
            default: null,
        },
        // Security tracking fields
        status: {
            type: String,
            enum: ["active", "inactive", "suspended"],
            default: "active",
        },
        lastLogin: {
            type: Date,
            default: null,
        },
        loginHistory: [
            {
                timestamp: { type: Date, default: Date.now },
                ipAddress: String,
                userAgent: String,
                success: { type: Boolean, default: true },
                _id: false // Disable _id for subdocuments if not needed
            },
        ],
        failedLoginAttempts: {
            type: Number,
            default: 0,
        },
        lastFailedLogin: {
            type: Date,
            default: null,
        },
        accountLockedUntil: {
            type: Date,
            default: null,
        },
        personalFinanceSettings: {
            monthStartDay: {
                type: Number,
                default: 1,
                min: 1,
                max: 31
            }
        }
    },
    { timestamps: true }
);

// Compound Index: Email must be unique PER TENANT
// This replaces the global unique index on email if we want to allow same email in different tenants.
// However, existing `unique: true` on email (line 14) enforces global uniqueness.
// DESIGN DECISION: To allow B2C (same email in multiple shops), we must DROP the global index and use this compound one.
// For now, I will add this index. The global unique constraint on `email` field above needs to be removed to fully enable multi-tenancy B2C.
// Removing `unique: true` from email field requires dropping index in DB.
userSchema.index({ email: 1, tenantId: 1 }, { unique: true, sparse: true });

// Password encryption before save
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
    // this.password might be undefined if not selected, but generally is present for auth methods
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function (): boolean {
    return !!(this.accountLockedUntil && this.accountLockedUntil.getTime() > Date.now());
};

// Increment failed login attempts
userSchema.methods.incLoginAttempts = async function (): Promise<IUser> {
    // Lock account after 5 failed attempts for 15 minutes
    if (this.failedLoginAttempts + 1 >= 5) {
        this.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    this.failedLoginAttempts += 1;
    this.lastFailedLogin = new Date();
    return this.save();
};

// Reset failed attempts on successful login
userSchema.methods.resetLoginAttempts = async function (): Promise<IUser> {
    if (this.failedLoginAttempts === 0 && !this.accountLockedUntil) return this as any;
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = null;
    return this.save();
};

// Record successful login
userSchema.methods.recordLogin = async function (ipAddress: string, userAgent: string): Promise<IUser> {
    this.lastLogin = new Date();
    this.loginHistory.push({
        timestamp: new Date(),
        ipAddress,
        userAgent,
        success: true,
    });

    // Keep only last 50 login records
    if (this.loginHistory.length > 50) {
        this.loginHistory = this.loginHistory.slice(-50);
    }

    return this.save();
};

// Record failed login
userSchema.methods.recordFailedLogin = async function (ipAddress: string, userAgent: string): Promise<IUser> {
    this.loginHistory.push({
        timestamp: new Date(),
        ipAddress,
        userAgent,
        success: false,
    });

    // Keep only last 50 login records
    if (this.loginHistory.length > 50) {
        this.loginHistory = this.loginHistory.slice(-50);
    }

    return this.save();
};

const User = mongoose.model<IUser>("User", userSchema);
export default User;
