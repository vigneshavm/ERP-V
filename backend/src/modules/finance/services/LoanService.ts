import { injectable, inject } from "tsyringe";
import { LoanRepository } from "../repositories/LoanRepository.js";
import { CashBankRepository } from "../repositories/CashBankRepository.js";
import { ILoan } from "../../../interfaces/ILoan.js";
import { ILoanPayment } from "../../../interfaces/ILoanPayment.js";
import { AppError } from "../../../utils/AppError.js";
import { info } from "../../../config/logger.js";
import mongoose from "mongoose";

@injectable()
export class LoanService {
    constructor(
        @inject(LoanRepository) private loanRepository: LoanRepository,
        @inject(CashBankRepository) private cashBankRepository: CashBankRepository
    ) { }

    async createLoan(tenantId: string, userId: string, data: any): Promise<ILoan> {
        const { name, principalAmount, interestRate, termMonths, emiAmount, totalPendingAmount, startDate } = data;

        if (!name || !principalAmount || !interestRate || !termMonths || !emiAmount || !startDate) {
            throw new AppError("All required loan fields must be provided", 400);
        }

        const loan = await this.loanRepository.createLoan({
            name,
            principalAmount,
            interestRate,
            termMonths,
            emiAmount,
            totalPendingAmount: totalPendingAmount || principalAmount,
            startDate,
            userId,
        }, tenantId);

        info(`Loan created: ${loan.name} for ₹${loan.principalAmount}`);
        return loan;
    }

    async getLoans(tenantId: string): Promise<ILoan[]> {
        return this.loanRepository.findAllLoans(tenantId);
    }

    async getLoanById(id: string, tenantId: string): Promise<{ loan: ILoan; payments: ILoanPayment[] }> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid loan ID format", 400);
        }

        const loan = await this.loanRepository.findLoanById(id, tenantId);
        if (!loan) {
            throw new AppError("Loan not found", 404);
        }

        const payments = await this.loanRepository.findPaymentsByLoanId(loan._id.toString(), tenantId);
        return { loan, payments };
    }

    async recordEmiPayment(loanId: string, tenantId: string, userId: string, paymentData: any): Promise<{ payment: ILoanPayment; loan: ILoan }> {
        const { paymentDate, amountPaid, paymentMethod, bankAccountId, referenceNumber } = paymentData;

        if (!mongoose.Types.ObjectId.isValid(loanId)) {
            throw new AppError("Invalid loan ID format", 400);
        }

        const loan = await this.loanRepository.findLoanById(loanId, tenantId);
        if (!loan) {
            throw new AppError("Loan not found", 404);
        }

        if (loan.status === "closed") {
            throw new AppError("Cannot add payment to a closed loan", 400);
        }

        if ((paymentMethod === "BankTransfer" || paymentMethod === "Cheque") && !bankAccountId) {
            throw new AppError("Bank account is required for Bank Transfer or Cheque payments", 400);
        }

        // Deduct from bank account or cash
        if (paymentMethod === "BankTransfer" || paymentMethod === "Cheque") {
            const bankAccount = await this.cashBankRepository.findAccountById(bankAccountId, tenantId);
            if (!bankAccount) {
                throw new AppError("Bank account not found", 404);
            }

            await this.cashBankRepository.updateBalance(bankAccountId, tenantId, -amountPaid);

            await this.cashBankRepository.createTransaction({
                type: "out",
                amount: amountPaid,
                fromAccount: bankAccount._id.toString(),
                toAccount: "loan",
                description: `EMI Payment for Loan: ${loan.name}`,
                date: paymentDate || new Date(),
                userId
            }, tenantId);
        } else if (paymentMethod === "Cash") {
            await this.cashBankRepository.createTransaction({
                type: "out",
                amount: amountPaid,
                fromAccount: "cash",
                toAccount: "loan",
                description: `Cash EMI Payment for Loan: ${loan.name}`,
                date: paymentDate || new Date(),
                userId
            }, tenantId);
        }

        const payment = await this.loanRepository.createLoanPayment({
            loanId: loan._id,
            paymentDate: paymentDate || new Date(),
            amountPaid,
            paymentMethod,
            bankAccountId,
            referenceNumber,
            userId,
        }, tenantId);

        const newPending = loan.totalPendingAmount - amountPaid;
        const isClosed = newPending <= 0;

        const updatedLoan = await this.loanRepository.updateLoan(loanId, tenantId, {
            totalPendingAmount: isClosed ? 0 : newPending,
            status: isClosed ? "closed" : "active"
        });

        info(`Loan payment recorded: ₹${amountPaid} for ${loan.name}. Remaining: ₹${isClosed ? 0 : newPending}`);
        return { payment, loan: updatedLoan || loan };
    }
}
