import { injectable, inject } from "tsyringe";
import { LoanRepository } from '@smarterp/shared/repositories/LoanRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';

@injectable()
export class LoanService {
    constructor(
        @inject(LoanRepository) private loanRepository: LoanRepository
    ) { }

    async createLoan(data: any, tenantId: string, userId: string): Promise<any> {
        const { name, principalAmount, interestRate, termMonths, emiAmount, totalPendingAmount, startDate } = data;

        const loan = await this.loanRepository.createLoan({
            name, principalAmount, interestRate, termMonths, emiAmount,
            totalPendingAmount: totalPendingAmount || principalAmount,
            startDate, tenantId, userId,
        });
        return loan;
    }

    async getLoans(tenantId: string): Promise<any[]> {
        return this.loanRepository.findLoans(tenantId);
    }

    async getLoanById(id: string, tenantId: string): Promise<any> {
        const loan = await this.loanRepository.findLoanById(id, tenantId);
        if (!loan) throw new AppError("Loan not found", 404);

        const payments = await this.loanRepository.findLoanPayments(loan._id.toString(), tenantId);
        return { loan, payments };
    }

    async recordEmiPayment(loanId: string, data: any, tenantId: string, userId: string): Promise<any> {
        const { paymentDate, amountPaid, paymentMethod, bankAccountId, referenceNumber } = data;

        const loan = await this.loanRepository.findLoanById(loanId, tenantId);
        if (!loan) throw new AppError("Loan not found", 404);
        if (loan.status === "closed") throw new AppError("Cannot add payment to a closed loan", 400);

        if ((paymentMethod === "BankTransfer" || paymentMethod === "Cheque") && !bankAccountId) {
            throw new AppError("Bank account is required for Bank Transfer or Cheque payments", 400);
        }

        return this.loanRepository.executeInTransaction(async (session) => {
            // Deduct from bank if applicable
            if (paymentMethod === "BankTransfer" || paymentMethod === "Cheque") {
                const bankAccount = await this.loanRepository.findBankAccount(bankAccountId, tenantId, session);
                if (!bankAccount) throw new AppError("Bank account not found", 404);

                await this.loanRepository.updateBankAccountBalance(bankAccountId, -amountPaid, session);
                await this.loanRepository.createCashbankTransaction({
                    type: "out", amount: amountPaid,
                    fromAccount: bankAccount._id.toString(), toAccount: "loan",
                    description: `EMI Payment for Loan: ${loan.name}`,
                    date: paymentDate || new Date(), userId,
                }, session);
            } else if (paymentMethod === "Cash") {
                await this.loanRepository.createCashbankTransaction({
                    type: "out", amount: amountPaid,
                    fromAccount: "cash", toAccount: "loan",
                    description: `Cash EMI Payment for Loan: ${loan.name}`,
                    date: paymentDate || new Date(), userId,
                }, session);
            }

            const payment = await this.loanRepository.createLoanPayment({
                loanId, paymentDate: paymentDate || new Date(),
                amountPaid, paymentMethod, bankAccountId,
                referenceNumber, tenantId, userId,
            }, session);

            // Update pending amount
            let newPending = loan.totalPendingAmount - amountPaid;
            const updates: any = { totalPendingAmount: Math.max(newPending, 0) };
            if (newPending <= 0) updates.status = "closed";

            const updatedLoan = await this.loanRepository.updateLoan(loanId, tenantId, updates, session);
            return { payment, loan: updatedLoan };
        });
    }
}
