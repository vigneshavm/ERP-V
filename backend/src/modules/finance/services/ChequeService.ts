import { injectable, inject } from "tsyringe";
import { ChequeRepository, IChequeFilter } from "../repositories/ChequeRepository.js";
import { CashBankRepository } from "../repositories/CashBankRepository.js";
import { ICheque } from "../../../interfaces/ICheque.js";
import { AppError } from "../../../utils/AppError.js";
import { info } from "../../../config/logger.js";

@injectable()
export class ChequeService {
    constructor(
        @inject(ChequeRepository) private chequeRepository: ChequeRepository,
        @inject(CashBankRepository) private cashBankRepository: CashBankRepository
    ) { }

    async getCheques(tenantId: string, filters?: IChequeFilter): Promise<ICheque[]> {
        return this.chequeRepository.findAll(tenantId, filters);
    }

    async createCheque(tenantId: string, userId: string, data: any): Promise<ICheque> {
        const { number, payee, amount, date, bankName, type, accountId, notes, sector } = data;

        if (!number || !payee || !amount || !date || !bankName || !type || !accountId || !sector) {
            throw new AppError("All required fields must be provided", 400);
        }

        const existing = await this.chequeRepository.findByNumberAndAccount(number, accountId, tenantId);
        if (existing) {
            throw new AppError("A cheque with this number already exists for this bank account", 400);
        }

        const cheque = await this.chequeRepository.create({
            number,
            payee,
            amount,
            date,
            bankName,
            type,
            accountId,
            sector,
            notes: notes || "",
            status: "PENDING",
            userId
        }, tenantId);

        info(`Cheque created: ${cheque.number} (${cheque.type}) for ₹${cheque.amount}`);
        return cheque;
    }

    async updateChequeStatus(
        id: string,
        tenantId: string,
        userId: string,
        newStatus: 'PENDING' | 'CLEARED' | 'BOUNCED'
    ): Promise<ICheque> {
        if (!["PENDING", "CLEARED", "BOUNCED"].includes(newStatus)) {
            throw new AppError("Invalid status", 400);
        }

        const cheque = await this.chequeRepository.findById(id, tenantId);
        if (!cheque) {
            throw new AppError("Cheque not found", 404);
        }

        const previousStatus = cheque.status;

        // If transitioning to CLEARED from PENDING
        if (newStatus === "CLEARED" && previousStatus !== "CLEARED") {
            const amount = cheque.amount;
            const accountId = (cheque.accountId as any)?._id ? (cheque.accountId as any)._id.toString() : cheque.accountId.toString();

            if (cheque.type === "RECEIVED") {
                await this.cashBankRepository.updateBalance(accountId, tenantId, amount);
                await this.cashBankRepository.createTransaction({
                    type: "in",
                    amount,
                    toAccount: accountId,
                    fromAccount: "cheque_clearance",
                    description: `Cheque Cleared: #${cheque.number} from ${cheque.payee}`,
                    date: new Date(),
                    reference: cheque.number,
                    userId
                }, tenantId);
            } else if (cheque.type === "ISSUED") {
                await this.cashBankRepository.updateBalance(accountId, tenantId, -amount);
                await this.cashBankRepository.createTransaction({
                    type: "out",
                    amount,
                    fromAccount: accountId,
                    toAccount: "cheque_clearance",
                    description: `Cheque Cleared: #${cheque.number} to ${cheque.payee}`,
                    date: new Date(),
                    reference: cheque.number,
                    userId
                }, tenantId);
            }
        }

        const updated = await this.chequeRepository.updateStatus(id, tenantId, newStatus);
        if (!updated) {
            throw new AppError("Failed to update cheque status", 500);
        }

        info(`Cheque ${cheque.number} status changed from ${previousStatus} to ${newStatus}`);
        return updated;
    }

    async getEffectiveBalance(accountId: string, tenantId: string): Promise<any> {
        const account = await this.cashBankRepository.findAccountById(accountId, tenantId);
        if (!account) {
            throw new AppError("Account not found", 404);
        }

        const unclearedCheques = await this.chequeRepository.getUnclearedCheques(tenantId, accountId);

        let unclearedIssued = 0;
        let unclearedReceived = 0;

        for (const chq of unclearedCheques) {
            if (chq.type === "ISSUED") unclearedIssued += chq.amount;
            else if (chq.type === "RECEIVED") unclearedReceived += chq.amount;
        }

        const currentBalance = account.currentBalance;
        const effectiveBalance = currentBalance - unclearedIssued + unclearedReceived;

        return {
            account: {
                _id: account._id,
                bankName: account.bankName,
                accountNumber: account.getDecryptedAccountNumber ? account.getDecryptedAccountNumber() : account.accountNumber,
                currentBalance
            },
            unclearedIssued,
            unclearedReceived,
            effectiveBalance,
            chequeCount: {
                issued: unclearedCheques.filter(c => c.type === "ISSUED").length,
                received: unclearedCheques.filter(c => c.type === "RECEIVED").length
            }
        };
    }
}
