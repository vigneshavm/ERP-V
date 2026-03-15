import { Document, Types } from "mongoose";

export interface IStockLog extends Document {
    itemId: Types.ObjectId;
    tenantId: Types.ObjectId;
    type: 'ADD' | 'SUBTRACT' | 'SET' | 'SALE' | 'PURCHASE' | 'INIT';
    delta: number;
    finalQty: number;
    reason?: string;
    performedBy: string; // User ID
    createdAt: Date;
    updatedAt: Date;
}
