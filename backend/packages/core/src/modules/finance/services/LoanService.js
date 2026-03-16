var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { injectable, inject } from "tsyringe";
import { LoanRepository } from '@smarterp/shared/repositories/LoanRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
let LoanService = class LoanService {
    loanRepository;
    constructor(loanRepository) {
        this.loanRepository = loanRepository;
    }
    async createLoan(data, tenantId, userId) {
        const { name, principalAmount, interestRate, termMonths, emiAmount, totalPendingAmount, startDate } = data;
        const loan = await this.loanRepository.createLoan({
            name, principalAmount, interestRate, termMonths, emiAmount,
            totalPendingAmount: totalPendingAmount || principalAmount,
            startDate, tenantId, userId,
        });
        return loan;
    }
    async getLoans(tenantId) {
        return this.loanRepository.findLoans(tenantId);
    }
    async getLoanById(id, tenantId) {
        const loan = await this.loanRepository.findLoanById(id, tenantId);
        if (!loan)
            throw new AppError("Loan not found", 404);
        const payments = await this.loanRepository.findLoanPayments(loan._id.toString(), tenantId);
        return { loan, payments };
    }
    async recordEmiPayment(loanId, data, tenantId, userId) {
        const { paymentDate, amountPaid, paymentMethod, bankAccountId, referenceNumber } = data;
        const loan = await this.loanRepository.findLoanById(loanId, tenantId);
        if (!loan)
            throw new AppError("Loan not found", 404);
        if (loan.status === "closed")
            throw new AppError("Cannot add payment to a closed loan", 400);
        if ((paymentMethod === "BankTransfer" || paymentMethod === "Cheque") && !bankAccountId) {
            throw new AppError("Bank account is required for Bank Transfer or Cheque payments", 400);
        }
        return this.loanRepository.executeInTransaction(async (session) => {
            // Deduct from bank if applicable
            if (paymentMethod === "BankTransfer" || paymentMethod === "Cheque") {
                const bankAccount = await this.loanRepository.findBankAccount(bankAccountId, tenantId, session);
                if (!bankAccount)
                    throw new AppError("Bank account not found", 404);
                await this.loanRepository.updateBankAccountBalance(bankAccountId, -amountPaid, session);
                await this.loanRepository.createCashbankTransaction({
                    type: "out", amount: amountPaid,
                    fromAccount: bankAccount._id.toString(), toAccount: "loan",
                    description: `EMI Payment for Loan: ${loan.name}`,
                    date: paymentDate || new Date(), userId,
                }, session);
            }
            else if (paymentMethod === "Cash") {
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
            const updates = { totalPendingAmount: Math.max(newPending, 0) };
            if (newPending <= 0)
                updates.status = "closed";
            const updatedLoan = await this.loanRepository.updateLoan(loanId, tenantId, updates, session);
            return { payment, loan: updatedLoan };
        });
    }
};
LoanService = __decorate([
    injectable(),
    __param(0, inject(LoanRepository)),
    __metadata("design:paramtypes", [LoanRepository])
], LoanService);
export { LoanService };
