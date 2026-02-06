import { injectable, container } from "tsyringe";
import mongoose from "mongoose";
import PayrollRun from "../models/PayrollRun.js";
import Payslip from "../models/Payslip.js";
import SalaryStructure from "../models/SalaryStructure.js";
import Employee from "../models/Employee.js";
import AttendanceSummary from "../models/AttendanceSummary.js";
import CashbankTransaction from "../../finance/models/CashbankTransaction.js";
import BankAccount from "../../finance/models/BankAccount.js";
import JournalEntry from "../../finance/models/JournalEntry.js";
import SalaryComponent from "../models/SalaryComponent.js";
import { AppError } from "../../../utils/AppError.js";
import { sendEmail } from "../../../utils/emailService.js";

@injectable()
export class PayrollService {

    // 1. Generate Payroll (Draft)
    async generatePayroll(tenantId: string, month: number, year: number, userId: string, branchId?: string) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const periodStart = new Date(year, month, 1);
            const periodEnd = new Date(year, month + 1, 0);

            // Check if already exists (scoped by branch if provided)
            const query: any = {
                tenantId,
                periodStart: { $gte: periodStart, $lte: periodStart }
            };
            if (branchId) query.branchId = branchId;

            const existing = await PayrollRun.findOne(query);

            if (existing) {
                throw new AppError("Payroll for this period already exists", 400);
            }

            // 1. Get all active employees (filtered by branch)
            const empQuery: any = { tenantId, isActive: true };
            if (branchId) empQuery.branchId = branchId;

            const employees = await Employee.find(empQuery);
            if (employees.length === 0) throw new AppError("No active employees found to process", 400);

            const payslips = [];
            let totalAmount = 0;

            for (const emp of employees) {
                // Get Structure
                const structure = await SalaryStructure.findOne({ employeeId: emp._id, tenantId, isActive: true })
                    .populate('components.componentId');

                // Get Attendance
                const attendance = await AttendanceSummary.findOne({ employeeId: emp._id, month, year, tenantId });

                // Default to full month if no attendance record (Assumption for salaried)
                const daysInMonth = periodEnd.getDate();
                const workedDays = attendance ? attendance.workedDays : daysInMonth;
                const overtimeHours = attendance ? (attendance.overtimeHours || 0) : 0;

                // Advanced Attendance Config
                const holidays = attendance ? (attendance.holidays || 0) : 0;
                const weeklyOffs = attendance ? (attendance.weeklyOffs || 0) : 0;
                const paidLeaves = attendance ? (attendance.paidLeaves || 0) : 0;
                const halfDays = attendance ? (attendance.halfDays || 0) : 0;

                const regularHours = attendance ? (attendance.regularHours || 0) : 0;
                const incentive = attendance ? (attendance.incentiveAmount || 0) : 0;
                const commission = attendance ? (attendance.commissionAmount || 0) : 0;
                const bonus = attendance ? (attendance.bonusAmount || 0) : 0;
                const advanceRecovery = attendance ? (attendance.advanceRecoveryAmount || 0) : 0;

                // Payable Days Calculation
                let payableDays = workedDays + holidays + weeklyOffs + paidLeaves - (0.5 * halfDays);
                if (payableDays > daysInMonth) payableDays = daysInMonth;

                // Calc Pro-rata factor
                const proRataFactor = payableDays / daysInMonth;

                let basic = 0;
                const earnings = [];
                const deductions = [];

                // --- Wage Type Logic ---
                if (emp.wageType === 'DAILY') {
                    basic = (emp.dailyRate || 0) * workedDays;
                } else if (emp.wageType === 'HOURLY') {
                    // Basic = HourlyRate * RegularHours
                    const hourlyRate = (emp as any).hourlyRate || 0;
                    basic = hourlyRate * regularHours;
                } else if (emp.wageType === 'COMMISSION') {
                    basic = 0;
                } else {
                    // MONTHLY or HYBRID
                    if (structure) {
                        for (const comp of structure.components) {
                            const def: any = comp.componentId;
                            if (!def) continue;

                            let amount = comp.amount;

                            if (def.type === 'EARNING') {
                                amount = amount * proRataFactor;
                                if (def.name.toLowerCase().includes('basic')) basic = amount;
                                earnings.push({ name: def.name, amount, componentId: def._id });
                            } else {
                                // DEDUCTION
                                if (def.calculationType === 'PERCENTAGE_OF_BASIC') {
                                    amount = amount * proRataFactor;
                                } else {
                                    amount = amount * proRataFactor;
                                }
                                deductions.push({ name: def.name, amount, componentId: def._id });
                            }
                        }

                        if (basic === 0 && structure.grossSalary > 0) {
                            basic = structure.grossSalary * proRataFactor;
                        }
                    }
                }

                // --- Add Variable Pay from Attendance (Ad-hoc) ---
                if (incentive > 0) earnings.push({ name: 'Incentive', amount: incentive });
                if (commission > 0) earnings.push({ name: 'Commission', amount: commission });
                if (bonus > 0) earnings.push({ name: 'Bonus', amount: bonus });

                // --- Overtime ---
                let overtimePay = 0;
                if (overtimeHours > 0) {
                    let hourlyRate = 0;
                    if (emp.wageType === 'HOURLY') hourlyRate = (emp as any).hourlyRate || 0;
                    else if (emp.wageType === 'DAILY') hourlyRate = (emp.dailyRate || 0) / 8;
                    else hourlyRate = (basic / (workedDays || 1)) / 8;

                    overtimePay = hourlyRate * overtimeHours;
                    earnings.push({ name: 'Overtime Pay', amount: overtimePay });
                }

                // --- Variable Deductions ---
                if (advanceRecovery > 0) deductions.push({ name: 'Salary Advance Recovery', amount: advanceRecovery });

                // Calculate Net
                const baseForTotal = (['DAILY', 'HOURLY', 'COMMISSION'].includes(emp.wageType)) ? basic : 0;

                const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0) + baseForTotal;
                const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
                const netPay = totalEarnings - totalDeductions;

                totalAmount += netPay;

                payslips.push({
                    tenantId,
                    employeeId: emp._id,
                    basicSalary: Number(basic.toFixed(2)),
                    earnings,
                    deductions,
                    grossPay: Number(totalEarnings.toFixed(2)),
                    totalDeductions: Number(totalDeductions.toFixed(2)),
                    netPay: Number(netPay.toFixed(2)),
                    daysPresent: workedDays,
                    daysTotal: daysInMonth,
                    paymentStatus: 'PENDING',
                    bankDetailsSnapshot: (emp as any).bankDetails
                });
            }

            // Create Run
            const run = await PayrollRun.create([{
                tenantId,
                branchId,
                periodStart,
                periodEnd,
                status: 'DRAFT',
                totalAmount: Number(totalAmount.toFixed(2)),
                totalEmployees: employees.length,
                processedDate: new Date()
            }], { session });

            // Create Payslips
            const payslipsWithRunId = payslips.map(p => ({ ...p, payrollRunId: run[0]._id }));
            await Payslip.insertMany(payslipsWithRunId, { session });

            await session.commitTransaction();
            return run[0];

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // 2. Approve Payroll
    async approvePayroll(runId: string, tenantId: string, userId: string) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const run = await PayrollRun.findOne({ _id: runId, tenantId }).session(session);
            if (!run) throw new AppError("Payroll Run not found", 404);
            if (run.status !== 'DRAFT') throw new AppError("Run is not in Draft state", 400);

            run.status = 'APPROVED';
            run.approvedBy = new mongoose.Types.ObjectId(userId);
            await run.save({ session });

            // Post Accrual Journal Entry
            // Dr Salary Expense
            // Cr Salary Payable
            await JournalEntry.create([{
                tenantId,
                branchId: run.branchId || 'HEAD_OFFICE',
                date: new Date(),
                description: `Salary Accrual for ${run.periodStart.toLocaleString('default', { month: 'short', year: 'numeric' })}`,
                reference: `PAYROLL-${run._id}`,
                status: 'POSTED',
                createdBy: userId,
                entries: [
                    {
                        accountId: 'EXP-SALARY', // Placeholder until COA
                        accountName: 'Salary Expense',
                        debit: run.totalAmount,
                        credit: 0
                    },
                    {
                        accountId: 'LIA-SALARY-PAYABLE', // Placeholder
                        accountName: 'Salary Payable',
                        debit: 0,
                        credit: run.totalAmount
                    }
                ]
            }], { session });

            await session.commitTransaction();
            return run;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // 3. Pay Payroll (Finance Integration)
    async payPayroll(runId: string, accountId: string, paymentMode: 'BANK_TRANSFER' | 'CASH' | 'UPI' | 'CHEQUE', tenantId: string, userId: string) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const run = await PayrollRun.findOne({ _id: runId, tenantId }).session(session);
            if (!run) throw new AppError("Run not found", 404);
            if (run.status !== 'APPROVED') throw new AppError("Run must be Approved first", 400);

            // Fetch Source Account (Bank or Cash Drawer)
            const account = await BankAccount.findOne({ _id: accountId, tenantId }).session(session);
            if (!account) throw new AppError("Payment Account not found", 404);

            // Validation based on Mode
            if (paymentMode === 'CASH' && account.accountType !== 'Cash') {
                throw new AppError("Selected account is not a Cash Account", 400);
            }
            if (['BANK_TRANSFER', 'CHEQUE', 'UPI'].includes(paymentMode) && account.accountType === 'Cash') {
                // Warning or Error? Usually logical error.
                throw new AppError("Cannot process Bank/Cheque/UPI from a Cash Account", 400);
            }

            if (account.currentBalance < run.totalAmount && account.accountType !== 'Overdraft') {
                throw new AppError(`Insufficient Funds in ${account.bankName} (${account.accountType})`, 400);
            }

            // Create Finance Transaction (CASH BOOK)
            // Dr Salary Payable (Implied by category 'salary_payable' instead of expense, OR we post another Journal)
            // To stick to 'Journal' request from user:
            // "Salary Payment: Dr Salary Payable, Cr Bank"
            // The CashbankTransaction is strictly Single Entry (Bank side). 
            // We should ALSO post a Journal Entry to clear the Payable Liability.

            const transaction = await CashbankTransaction.create([{
                type: 'out', // Expense
                amount: run.totalAmount,
                fromAccount: account._id,
                toAccount: 'salary_payable', // Clearing liability
                description: `Payroll Payment (${paymentMode}) for ${run.periodStart.toLocaleString('default', { month: 'short', year: 'numeric' })}`,
                date: new Date(),
                reference: `PAYROLL-${run._id}`,
                reconciled: true,
                userId: userId,
            }], { session });

            // Post Payment Journal Entry (Clearing Liability)
            await JournalEntry.create([{
                tenantId,
                branchId: run.branchId || 'HEAD_OFFICE',
                date: new Date(),
                description: `Salary Payment (${paymentMode})`,
                reference: `PAYROLL-PAY-${run._id}`,
                status: 'POSTED',
                createdBy: userId,
                entries: [
                    {
                        accountId: 'LIA-SALARY-PAYABLE',
                        accountName: 'Salary Payable',
                        debit: run.totalAmount,
                        credit: 0
                    },
                    {
                        accountId: account._id.toString(),
                        accountName: account.bankName, // Source Asset (Bank/Cash)
                        debit: 0,
                        credit: run.totalAmount
                    }
                ]
            }], { session });

            // Update Account Balance
            account.currentBalance -= run.totalAmount;
            await account.save({ session });

            // Update Run Status
            run.status = 'PAID';
            run.paidDate = new Date();
            run.transactionId = transaction[0]._id.toString();
            run.paymentMode = paymentMode; // Save mode
            await run.save({ session });

            // Update Payslips
            await Payslip.updateMany(
                { payrollRunId: run._id },
                {
                    $set: {
                        paymentStatus: 'PAID',
                        paymentDate: new Date(),
                        transactionRef: transaction[0]._id.toString()
                    }
                },
                { session }
            );

            await session.commitTransaction();
            return run;

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // 4. Update Payslip (Correction/Review)
    async updatePayslip(payslipId: string, tenantId: string, updates: {
        earnings?: any[], deductions?: any[], basicSalary?: number
    }) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const payslip = await Payslip.findOne({ _id: payslipId, tenantId }).session(session);
            if (!payslip) throw new AppError("Payslip not found", 404);

            const run = await PayrollRun.findOne({ _id: payslip.payrollRunId, tenantId }).session(session);
            if (!run) throw new AppError("Run not found", 404);
            if (run.status !== 'DRAFT') throw new AppError("Cannot edit payslip. Run is locked.", 400);

            // Apply updates
            if (updates.basicSalary !== undefined) payslip.basicSalary = updates.basicSalary;
            if (updates.earnings) payslip.earnings = updates.earnings;
            if (updates.deductions) payslip.deductions = updates.deductions;

            // Recalculate Totals
            const totalEarnings = payslip.earnings.reduce((sum: number, e: any) => sum + Number(e.amount), 0) + payslip.basicSalary;
            const totalDeductions = payslip.deductions.reduce((sum: number, d: any) => sum + Number(d.amount), 0);

            const oldNet = payslip.netPay;
            payslip.grossPay = totalEarnings;
            payslip.totalDeductions = totalDeductions;
            payslip.netPay = totalEarnings - totalDeductions;

            await payslip.save({ session });

            // Update Run Total
            const diff = payslip.netPay - oldNet;
            run.totalAmount += diff;
            await run.save({ session });

            await session.commitTransaction();
            return payslip;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // 5. Delete Run (Rollback)
    async deleteRun(runId: string, tenantId: string) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const run = await PayrollRun.findOne({ _id: runId, tenantId }).session(session);
            if (!run) throw new AppError("Run not found", 404);
            if (run.status !== 'DRAFT') throw new AppError("Cannot delete processed run", 400);

            await Payslip.deleteMany({ payrollRunId: runId }).session(session);
            await PayrollRun.deleteOne({ _id: runId }).session(session);

            await session.commitTransaction();
            return { success: true };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // 6. Send Payslip (Delivery)
    async sendPayslip(payslipId: string, tenantId: string, channels: ('EMAIL' | 'WHATSAPP')[]) {
        const payslip = await Payslip.findOne({ _id: payslipId, tenantId }).populate('employeeId');
        if (!payslip) throw new AppError("Payslip not found", 404);

        const emp: any = payslip.employeeId;
        const results = [];

        if (channels.includes('EMAIL')) {
            if (emp.email) {
                // Formatting simple text for now. Ideal: HTML Template or PDF attachment.
                const subject = `Payslip for ${payslip.createdAt.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
                const message = `Dear ${emp.name},\n\nHere is your payslip summary:\n\nNet Pay: ${payslip.netPay}\nGross Pay: ${payslip.grossPay}\nDeductions: ${payslip.totalDeductions}\n\nThank you.`;

                // Assuming sendEmail(to, subject, text/html) signature
                await sendEmail(emp.email, subject, message);
                results.push({ channel: 'EMAIL', status: 'SENT' });
            } else {
                results.push({ channel: 'EMAIL', status: 'FAILED', reason: 'No email found' });
            }
        }

        if (channels.includes('WHATSAPP')) {
            // Placeholder
            results.push({ channel: 'WHATSAPP', status: 'SKIPPED', reason: 'Integration pending' });
        }

        return results;
    }
}
