import { injectable, singleton } from "tsyringe";
import Transaction from "../modules/sales/models/Transaction.js";
import { ITransaction } from "../interfaces/ITransaction.js";

@injectable()
@singleton()
export class TransactionRepository {
    async create(transactionData: Partial<ITransaction>): Promise<ITransaction> {
        return Transaction.create(transactionData);
    }

    async findByCustomer(customerId: string): Promise<ITransaction[]> {
        return Transaction.find({ customer: customerId })
            .sort({ createdAt: -1 })
            .populate("invoice", "invoiceNo totalAmount paymentStatus");
    }

    // Add other queries as needed
}
