import { Document, Types } from "mongoose";

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
export type AccountSubtype = 
    | 'Cash' | 'Bank' | 'Accounts Receivable' | 'Inventory' | 'Fixed Asset' | 'Current Asset' // Assets
    | 'Accounts Payable' | 'Credit Card' | 'Current Liability' | 'Long Term Liability' // Liabilities
    | 'Equity' // Equity
    | 'Income' | 'Other Income' // Income
    | 'Expense' | 'Cost of Goods Sold' | 'Other Expense'; // Expenses

export interface IChartOfAccount extends Document {
    tenantId: Types.ObjectId;
    code: string; // e.g., "1001"
    name: string; // e.g., "Cash in Hand"
    type: AccountType;
    subtype: AccountSubtype;
    description?: string;
    parentAccount?: Types.ObjectId; // For hierarchical COA
    isSystem: boolean; // Protect system accounts from deletion
    isActive: boolean;
    currentBalance: number;
    createdAt: Date;
    updatedAt: Date;
}
