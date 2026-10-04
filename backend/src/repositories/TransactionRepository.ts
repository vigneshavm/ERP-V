import { injectable, singleton } from "tsyringe";
import {
    createTransaction,
    listTransactionsByCustomer,
    type TransactionEntry,
    type TransactionType,
} from "../integrations/textilesoft/erpTransaction.js";

@injectable()
@singleton()
export class TransactionRepository {
    async create(transactionData: {
        type: TransactionType;
        customer?: string;
        invoice?: string;
        return?: string;
        dueAdjustment?: string;
        amount: number;
        paymentMethod?: string;
        description?: string;
    }): Promise<TransactionEntry> {
        return createTransaction(transactionData);
    }

    async findByCustomer(customerId: string): Promise<TransactionEntry[]> {
        return listTransactionsByCustomer(customerId);
    }

    // Add other queries as needed
}
