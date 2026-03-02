import { Request, Response } from "express";
import Loan from "../models/Loan.js";
import LoanPayment from "../models/LoanPayment.js";
import BankAccount from "../models/BankAccount.js";
import CashbankTransaction from "../models/CashbankTransaction.js";

// Define AuthenticatedRequest inline to prevent type errors
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
        [key: string]: any;
    };
    tenantId?: string;
}

// @desc    Create new Loan
// @route   POST /api/loans
export const createLoan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { name, principalAmount, interestRate, termMonths, emiAmount, totalPendingAmount, startDate } = req.body;

        const loan = await Loan.create({
            name,
            principalAmount,
            interestRate,
            termMonths,
            emiAmount,
            totalPendingAmount: totalPendingAmount || principalAmount,
            startDate,
            tenantId: req.tenantId || req.user?._id, // fallback to user _id if no tenantId middleware
            userId: req.user?._id,
        });

        res.status(201).json(loan);
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Server Error" });
    }
};

// @desc    Get all loans for tenant
// @route   GET /api/loans
export const getLoans = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.user?._id;
        const loans = await Loan.find({ tenantId }).sort("-createdAt");
        res.json(loans);
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Server Error" });
    }
};

// @desc    Get single loan and its payments
// @route   GET /api/loans/:id
export const getLoanById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.user?._id;
        const loan = await Loan.findOne({ _id: req.params.id, tenantId });

        if (!loan) {
            res.status(404).json({ message: "Loan not found" });
            return;
        }

        const payments = await LoanPayment.find({ loanId: loan._id, tenantId })
            .populate("bankAccountId", "bankName accountNumber")
            .sort("-paymentDate");

        res.json({ loan, payments });
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Server Error" });
    }
};

// @desc    Record an EMI payment for a loan
// @route   POST /api/loans/:id/payments
export const recordEmiPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { paymentDate, amountPaid, paymentMethod, bankAccountId, referenceNumber } = req.body;
        const loanId = req.params.id;
        const tenantId = req.tenantId || req.user?._id;

        const loan = await Loan.findOne({ _id: loanId, tenantId });
        if (!loan) {
            res.status(404).json({ message: "Loan not found" });
            return;
        }

        if (loan.status === "closed") {
            res.status(400).json({ message: "Cannot add payment to a closed loan" });
            return;
        }

        if ((paymentMethod === "BankTransfer" || paymentMethod === "Cheque") && !bankAccountId) {
            res.status(400).json({ message: "Bank account is required for Bank Transfer or Cheque payments" });
            return;
        }

        // Deduct from bank account if applicable
        if (paymentMethod === "BankTransfer" || paymentMethod === "Cheque") {
            const bankAccount = await BankAccount.findOne({ _id: bankAccountId, tenantId });
            if (!bankAccount) {
                res.status(404).json({ message: "Bank account not found" });
                return;
            }

            bankAccount.currentBalance -= amountPaid;
            await bankAccount.save();

            // Create a cashbank transaction
            await CashbankTransaction.create({
                type: "out",
                amount: amountPaid,
                fromAccount: bankAccount._id,
                toAccount: "loan",
                description: `EMI Payment for Loan: ${loan.name}`,
                date: paymentDate || new Date(),
                userId: req.user?._id,
            });
        } else if (paymentMethod === "Cash") {
            await CashbankTransaction.create({
                type: "out",
                amount: amountPaid,
                fromAccount: "cash",
                toAccount: "loan",
                description: `Cash EMI Payment for Loan: ${loan.name}`,
                date: paymentDate || new Date(),
                userId: req.user?._id,
            });
        }

        const payment = await LoanPayment.create({
            loanId,
            paymentDate: paymentDate || new Date(),
            amountPaid,
            paymentMethod,
            bankAccountId,
            referenceNumber,
            tenantId,
            userId: req.user?._id,
        });

        // Calculate new pending amount
        loan.totalPendingAmount -= amountPaid;

        if (loan.totalPendingAmount <= 0) {
            loan.status = "closed";
            loan.totalPendingAmount = 0;
        }

        await loan.save();

        res.status(201).json({ payment, loan });
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Server Error" });
    }
};
