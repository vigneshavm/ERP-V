import { Document, Types } from "mongoose";

export interface ICustomer extends Document {
    name: string;
    phone: string;
    email: string;
    address: string;
    dues: number;
    transactionHistory: (string | Types.ObjectId)[]; // references Transaction IDs
    referredBy?: string | Types.ObjectId | null; // references Customer ID
    owner: string | Types.ObjectId; // references User ID
    points: number;
    tier: string;

    createdAt: Date;
    updatedAt: Date;
}
