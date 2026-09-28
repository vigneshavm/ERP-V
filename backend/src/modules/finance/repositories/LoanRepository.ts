import { injectable, singleton } from "tsyringe";
import { ClientSession } from "mongoose";
import Loan from "../models/Loan.js";
import LoanPayment from "../models/LoanPayment.js";
import { ILoan } from "../../../interfaces/ILoan.js";
import { ILoanPayment } from "../../../interfaces/ILoanPayment.js";

@injectable()
@singleton()
export class LoanRepository {
    async createLoan(data: Partial<ILoan>, tenantId: string, session?: ClientSession): Promise<ILoan> {
        const payload = { ...data, tenantId };
        if (session) {
            return (await Loan.create([payload], { session }))[0];
        }
        return Loan.create(payload);
    }

    async findLoanById(id: string, tenantId: string, session?: ClientSession): Promise<ILoan | null> {
        const query = Loan.findOne({ _id: id, tenantId });
        if (session) {
            return query.session(session);
        }
        return query;
    }

    async findAllLoans(tenantId: string): Promise<ILoan[]> {
        return Loan.find({ tenantId }).sort("-createdAt");
    }

    async updateLoan(id: string, tenantId: string, updates: Partial<ILoan>, session?: ClientSession): Promise<ILoan | null> {
        const query = Loan.findOneAndUpdate(
            { _id: id, tenantId },
            updates,
            { new: true, runValidators: true }
        );
        if (session) {
            return query.session(session);
        }
        return query;
    }

    async createLoanPayment(data: Partial<ILoanPayment>, tenantId: string, session?: ClientSession): Promise<ILoanPayment> {
        const payload = { ...data, tenantId };
        if (session) {
            return (await LoanPayment.create([payload], { session }))[0];
        }
        return LoanPayment.create(payload);
    }

    async findPaymentsByLoanId(loanId: string, tenantId: string): Promise<ILoanPayment[]> {
        return LoanPayment.find({ loanId, tenantId })
            .populate("bankAccountId", "bankName accountNumber")
            .sort("-paymentDate");
    }
}
