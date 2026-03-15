import { Document, Types } from "mongoose";

export interface ILoanPayment extends Document {
    loanId: Types.ObjectId; // Reference to Loan
    paymentDate: Date;
    amountPaid: number;
    paymentMethod: "Cash" | "BankTransfer" | "Cheque";
    bankAccountId?: Types.ObjectId; // Reference to BankAccount if BankTransfer/Cheque
    referenceNumber?: string;
    tenantId: Types.ObjectId; // Reference to Tenant
    userId: string; // Reference to User
    createdAt: Date;
    updatedAt: Date;
}
