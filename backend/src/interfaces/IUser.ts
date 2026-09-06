import { Document, Types } from "mongoose";

export interface ILoginHistory {
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    success: boolean;
}

export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    password?: string; // Optional because we might select('-password')
    shopName?: string;
    gstNumber?: string;
    shopAddress?: string;
    phone?: string;
    sector?: string;
    subdomain?: string;
    // Per-user POS/billing screen language preference (Settings -> Personalization).
    language?: "en" | "ta";
    // NEW: Multi-tenancy
    tenantId?: Types.ObjectId;
    role: "owner" | "manager" | "staff" | "customer" | "superadmin";


    // Reset Password
    resetPasswordToken?: string | null;
    resetPasswordExpires?: Date | null;

    // Device Session
    activeDeviceId?: string | null;
    activeSessionCreatedAt?: Date | null;
    lastLoginIp?: string | null;
    lastLoginUserAgent?: string | null;

    // Security / Account Status
    status: "active" | "inactive" | "suspended";

    // Per-user discount permission: overrides the tenant's misConfig.maxDiscountPercent for
    // this specific user when set. Lets an owner grant a trusted cashier a higher (or lower)
    // discount ceiling than the shop-wide default without changing that default for everyone.
    // Undefined means "inherit the tenant's cap" -- see PosController.createInvoice.
    maxDiscountPercent?: number;

    lastLogin?: Date | null;
    loginHistory: ILoginHistory[];
    failedLoginAttempts: number;
    lastFailedLogin?: Date | null;
    accountLockedUntil?: Date | null;

    createdAt: Date;
    updatedAt: Date;

    // Methods
    matchPassword(enteredPassword: string): Promise<boolean>;
    isLocked(): boolean;
    incLoginAttempts(): Promise<IUser>;
    resetLoginAttempts(): Promise<IUser>;
    recordLogin(ipAddress: string, userAgent: string): Promise<IUser>;
    recordFailedLogin(ipAddress: string, userAgent: string): Promise<IUser>;
}
