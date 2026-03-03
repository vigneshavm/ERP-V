import { injectable } from "tsyringe";
import mongoose from "mongoose";
import PayrollRun from "../models/PayrollRun.js";
import Payslip from "../models/Payslip.js";
import SalaryStructure from "../models/SalaryStructure.js";
import Employee from "../models/Employee.js";
import AttendanceSummary from "../models/AttendanceSummary.js";
import SalaryAdvance from "../models/SalaryAdvance.js";
import CashbankTransaction from "../../finance/models/CashbankTransaction.js";
import BankAccount from "../../finance/models/BankAccount.js";
import JournalEntry from "../../finance/models/JournalEntry.js";
import SalaryComponent from "../models/SalaryComponent.js";
import { AppError } from "../../../utils/AppError.js";
import { sendEmail } from "../../../utils/emailService.js";

@injectable()
export class PayrollService {

    // 1. Generate Payroll (Draft)
    async generatePayroll(tenantId: string, month: number, year: number, _userId: string, branchId?: string) {
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

                // Advanced Attendance Config (Unused logic kept for reference if needed later but variables removed to fix build)
                const regularHours = attendance ? (attendance.regularHours || 0) : 0;

                // --- ADVANCE RECOVERY ---
                // Fetch all pending advances for this employee
                const pendingAdvances = await SalaryAdvance.find({
                    employeeId: emp._id,
                    tenantId,
                    status: 'PENDING'
                });
                const totalAdvancePending = pendingAdvances.reduce((sum, adv) => sum + adv.amount, 0);
                const advanceRecovery = attendance ? (attendance.advanceRecoveryAmount || 0) : totalAdvancePending;

                // --- CALCULATION LOGIC ---
                let basic = 0;
                const earnings: any[] = [];
                const deductions: any[] = [];

                // 1. Calculate Prorated Basic Salary
                if (emp.wageType === 'MONTHLY') {
                    // Prorate by days present
                    basic = (emp.baseSalary / daysInMonth) * workedDays;
                } else if (emp.wageType === 'DAILY') {
                    basic = emp.dailyRate * workedDays;
                } else if (emp.wageType === 'HOURLY') {
                    basic = emp.hourlyRate * regularHours;
                } else {
                    basic = emp.baseSalary; // Fallback
                }

                // --- DYNAMIC COMPONENTS (from Structure) ---
                if (structure && structure.components) {
                    for (const sc of structure.components) {
                        const component = sc.componentId as any;
                        if (!component) continue;

                        let amount = 0;
                        const value = sc.amount || component.defaultValue || 0;

                        if (component.calculationType === 'PERCENTAGE') {
                            amount = (basic * value) / 100;
                        } else {
                            // FLAT
                            // Special Check for Tea Allowance
                            if (component.name === 'Tea Allowance') {
                                amount = value * workedDays;
                            } else {
                                // Standard Flat Amount (Prorated)
                                amount = (value / daysInMonth) * workedDays;
                            }
                        }

                        const entry = {
                            name: component.name,
                            amount: Number(amount.toFixed(2)),
                            componentId: component._id
                        };

                        if (component.type === 'EARNING') earnings.push(entry);
                        else deductions.push(entry);
                    }
                }

                // Fallback for Tea Allowance if not in structure (Default Rate: 15 per day)
                const hasTea = earnings.find(e => e.name === 'Tea Allowance');
                if (!hasTea) {
                    const teaRate = 15;
                    const teaAllowance = teaRate * workedDays;
                    if (teaAllowance > 0) {
                        earnings.push({
                            name: 'Tea Allowance',
                            amount: Number(teaAllowance.toFixed(2))
                        });
                    }
                }

                // --- Overtime ---
                let overtimePay = 0;
                if (overtimeHours > 0) {
                    let hourlyRate = 0;
                    if (emp.wageType === 'HOURLY') hourlyRate = emp.hourlyRate || 0;
                    else if (emp.wageType === 'DAILY') hourlyRate = (emp.dailyRate || 0) / 8;
                    else hourlyRate = (basic / (workedDays || 1)) / 8;

                    overtimePay = hourlyRate * overtimeHours;
                    earnings.push({ name: 'Overtime Pay', amount: Number(overtimePay.toFixed(2)) });
                }

                // --- Variable Deductions ---
                if (advanceRecovery > 0) deductions.push({ name: 'Salary Advance Recovery', amount: advanceRecovery });

                // Calculate Net
                const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0) + basic;
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

            // Mark recovery for advances
            const payslips = await Payslip.find({ payrollRunId: runId }).session(session);
            for (const slip of payslips) {
                const advanceRecovery = slip.deductions.find(d => d.name === 'Salary Advance Recovery');
                if (advanceRecovery && advanceRecovery.amount > 0) {
                    // Update PENDING advances to RECOVERED
                    await SalaryAdvance.updateMany(
                        { employeeId: slip.employeeId, tenantId, status: 'PENDING' },
                        { $set: { status: 'RECOVERED', payrollRunId: runId } },
                        { session }
                    );
                }
            }

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
            if (paymentMode === 'CASH' && (account.accountType as string) !== 'Cash') {
                throw new AppError("Selected account is not a Cash Account", 400);
            }
            if (['BANK_TRANSFER', 'CHEQUE', 'UPI'].includes(paymentMode) && (account.accountType as string) === 'Cash') {
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
    // 7. Bulk Update Structure (e.g. Tea Allowance for All)
    async bulkUpdateStructure(tenantId: string, componentId: string, amount: number) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            console.log(`[PayrollService] Bulk Update - Finding Component ${componentId} for Tenant ${tenantId}`);
            // Validate Component
            const component = await SalaryComponent.findOne({ _id: componentId, tenantId }).session(session);
            if (!component) {
                console.error(`[PayrollService] Component not found!`);
                throw new AppError("Component not found", 404);
            }
            console.log(`[PayrollService] Component found: ${component.name}`);

            // Find All Active Employees
            const employees = await Employee.find({ tenantId, isActive: true }).session(session);
            let updatedCount = 0;

            for (const emp of employees) {
                // Find or Create Active Structure
                let structure = await SalaryStructure.findOne({
                    tenantId,
                    employeeId: emp._id,
                    isActive: true
                }).session(session);

                if (!structure) {
                    // Create new if generic structure doesn't exist
                    structure = new SalaryStructure({
                        tenantId,
                        employeeId: emp._id,
                        components: [],
                        isActive: true,
                        effectiveFrom: new Date(),
                        grossSalary: 0,
                        netSalaryEstimate: 0
                    });
                }

                // Check if component exists
                const existingCompIndex = structure.components.findIndex((c: any) => c.componentId.toString() === componentId);

                if (existingCompIndex >= 0) {
                    // Update existing
                    structure.components[existingCompIndex].amount = amount;
                } else {
                    // Add new
                    structure.components.push({
                        componentId: component._id,
                        amount: amount
                    });
                }

                await structure.save({ session });
                updatedCount++;
            }

            await session.commitTransaction();
            return { success: true, updatedCount, message: `Updated ${updatedCount} employees with ${component.name}` };

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // 8. Process Individual Payout (Immediate)
    async processIndividualPayout(tenantId: string, employeeId: string, month: number, year: number, userId: string, paymentMode: 'BANK_TRANSFER' | 'CASH' | 'UPI' | 'CHEQUE', accountId: string, overrideWorkedDays?: number, force: boolean = false) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const periodStart = new Date(year, month, 1);
            const periodEnd = new Date(year, month + 1, 0);

            // 1. Check if already processed (SKIP if FORCE is true)
            if (!force) {
                const existingPayslip = await Payslip.findOne({
                    tenantId,
                    employeeId,
                    createdAt: { $gte: periodStart, $lte: periodEnd }
                }).session(session);

                if (existingPayslip && existingPayslip.paymentStatus === 'PAID') {
                    throw new AppError("Employee already paid for this period", 400);
                }
            }

            // 2. Fetch Employee & Data
            const emp = await Employee.findOne({ _id: employeeId, tenantId }).session(session);
            if (!emp) throw new AppError("Employee not found", 404);

            // Get Structure
            const structure = await SalaryStructure.findOne({ employeeId: emp._id, tenantId, isActive: true })
                .populate('components.componentId')
                .session(session);

            // Get Attendance
            const attendance = await AttendanceSummary.findOne({ employeeId: emp._id, month, year, tenantId }).session(session);

            const daysInMonth = periodEnd.getDate();
            // Use override if provided, else attendance, else full month
            const workedDays = overrideWorkedDays !== undefined ? overrideWorkedDays : (attendance ? attendance.workedDays : daysInMonth);

            // Advance Recovery
            const pendingAdvances = await SalaryAdvance.find({
                employeeId: emp._id,
                tenantId,
                status: 'PENDING'
            }).session(session);
            const totalAdvancePending = pendingAdvances.reduce((sum, adv) => sum + adv.amount, 0);
            const advanceRecovery = attendance ? (attendance.advanceRecoveryAmount || 0) : totalAdvancePending;

            // --- CALCULATION (Reused Logic - Should Refactor to Helper) ---
            let basic = 0;
            const earnings: any[] = [];
            const deductions: any[] = [];

            if (emp.wageType === 'MONTHLY') basic = (emp.baseSalary / daysInMonth) * workedDays;
            else if (emp.wageType === 'DAILY') basic = emp.dailyRate * workedDays;
            else if (emp.wageType === 'HOURLY') basic = emp.hourlyRate * (attendance?.regularHours || 0); // Note: Hourly override not fully handled here, assuming Daily logic for overrides
            else basic = emp.baseSalary;

            if (structure && structure.components) {
                for (const sc of structure.components) {
                    const component = sc.componentId as any;
                    if (!component) continue;
                    let amount = 0;
                    const value = sc.amount || component.defaultValue || 0;

                    if (component.calculationType === 'PERCENTAGE') {
                        amount = (basic * value) / 100;
                    } else {
                        if (component.name === 'Tea Allowance') amount = value * workedDays;
                        else amount = (value / daysInMonth) * workedDays;
                    }

                    const entry = { name: component.name, amount: Number(amount.toFixed(2)), componentId: component._id };
                    if (component.type === 'EARNING') earnings.push(entry);
                    else deductions.push(entry);
                }
            }

            // Fallback Tea Allowance
            const hasTea = earnings.find(e => e.name === 'Tea Allowance');
            if (!hasTea) {
                const teaRate = 15;
                const teaAllowance = teaRate * workedDays;
                if (teaAllowance > 0) earnings.push({ name: 'Tea Allowance', amount: Number(teaAllowance.toFixed(2)) });
            }

            if (advanceRecovery > 0) deductions.push({ name: 'Salary Advance Recovery', amount: advanceRecovery });

            const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0) + basic;
            const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
            const netPay = totalEarnings - totalDeductions;

            // 3. Create/Update Run (Specific for Individual Payouts or Adhoc)
            // We'll create a lightweight run just for this transaction or append to an existing Draft if open?
            // User wants "Pay", implying immediate effect. Let's create an "ADHOC" run or similar.

            const run = await PayrollRun.create([{
                tenantId,
                periodStart,
                periodEnd,
                status: 'APPROVED', // Skip Draft
                totalAmount: Number(netPay.toFixed(2)),
                totalEmployees: 1,
                processedDate: new Date(),
                approvedBy: userId
            }], { session });

            // 4. Create Payslip
            const payslip = await Payslip.create([{
                tenantId,
                employeeId: emp._id,
                payrollRunId: run[0]._id,
                basicSalary: Number(basic.toFixed(2)),
                earnings,
                deductions,
                grossPay: Number(totalEarnings.toFixed(2)),
                totalDeductions: Number(totalDeductions.toFixed(2)),
                netPay: Number(netPay.toFixed(2)),
                daysPresent: workedDays,
                daysTotal: daysInMonth,
                paymentStatus: 'PENDING', // Will be updated to PAID next
                bankDetailsSnapshot: (emp as any).bankDetails
            }], { session });

            // 5. Execute Payment (Finance)
            // Call payPayroll logic logic internally? Or replicate safely.
            // Let's replicate core finance logic here to avoid re-fetching run/context issues within transaction.

            const account = await BankAccount.findOne({ _id: accountId, tenantId }).session(session);
            if (!account) throw new AppError("Payment Account not found", 404);
            if (account.currentBalance < netPay && account.accountType !== 'Overdraft') {
                throw new AppError(`Insufficient Funds`, 400);
            }

            // Transaction
            const transaction = await CashbankTransaction.create([{
                type: 'out',
                amount: netPay,
                fromAccount: account._id,
                toAccount: 'salary_payable',
                description: `Salary Payment (${paymentMode}) for ${emp.name}`,
                date: new Date(),
                reference: `PAY-IND-${payslip[0]._id}`,
                reconciled: true,
                userId
            }], { session });

            // Journal
            await JournalEntry.create([{
                tenantId,
                branchId: (emp as any).branchId || 'HEAD_OFFICE',
                date: new Date(),
                description: `Salary Payment - ${emp.name}`,
                reference: `PAY-IND-${payslip[0]._id}`,
                status: 'POSTED',
                createdBy: userId,
                entries: [
                    { accountId: 'EXP-SALARY', accountName: 'Salary Expense', debit: netPay, credit: 0 },
                    { accountId: account._id.toString(), accountName: account.bankName, debit: 0, credit: netPay }
                ]
            }], { session });

            // Update Account
            account.currentBalance -= netPay;
            await account.save({ session });

            // Update Run & Payslip
            run[0].status = 'PAID';
            run[0].paidDate = new Date();
            run[0].transactionId = transaction[0]._id.toString();
            run[0].paymentMode = paymentMode;
            await run[0].save({ session });

            payslip[0].paymentStatus = 'PAID';
            payslip[0].paymentDate = new Date();
            payslip[0].transactionRef = transaction[0]._id.toString();
            await payslip[0].save({ session });

            // Update Advances
            if (advanceRecovery > 0) {
                await SalaryAdvance.updateMany(
                    { employeeId: emp._id, tenantId, status: 'PENDING' },
                    { $set: { status: 'RECOVERED', payrollRunId: run[0]._id } },
                    { session }
                );
            }

            await session.commitTransaction();
            return { success: true, payslip: payslip[0], transactionId: transaction[0]._id };

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

