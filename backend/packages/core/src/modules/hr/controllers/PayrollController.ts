
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { PayrollService } from '../services/PayrollService.js';
import SalaryComponent from '../models/SalaryComponent.js';
import SalaryStructure from '../models/SalaryStructure.js';
import PayrollRun from '../models/PayrollRun.js';
import Payslip from '../models/Payslip.js';
import AttendanceSummary from '../models/AttendanceSummary.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';

// Salary Components
export const createSalaryComponent = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const { name, type, calculationType, defaultValue, isTaxable } = req.body;
    const tenantId = user.tenantId;

    const component = await SalaryComponent.create({
        tenantId,
        name,
        type,
        calculationType,
        defaultValue,
        isTaxable
    });

    res.status(201).json({ success: true, data: component });
});

export const getSalaryComponents = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const tenantId = user.tenantId;
    const components = await SalaryComponent.find({ tenantId, isActive: true });
    res.status(200).json({ success: true, data: components });
});

export const updateSalaryComponent = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const { id } = req.params;
    const tenantId = user.tenantId;
    const updates = req.body;

    const component = await SalaryComponent.findOneAndUpdate(
        { _id: id, tenantId },
        updates,
        { new: true }
    );

    if (!component) {
        return res.status(404).json({ success: false, message: "Component not found" });
    }

    res.status(200).json({ success: true, data: component });
});

export const deleteSalaryComponent = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const { id } = req.params;
    const tenantId = user.tenantId;

    const component = await SalaryComponent.findOneAndDelete({ _id: id, tenantId });

    if (!component) {
        return res.status(404).json({ success: false, message: "Component not found" });
    }

    res.status(200).json({ success: true, message: "Component deleted successfully" });
});

// Salary Structure
export const upsertSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const tenantId = user.tenantId;
    const { employeeId, components, effectiveFrom } = req.body;

    // Deactivate old active structure
    await SalaryStructure.updateMany({ employeeId, tenantId, isActive: true }, { isActive: false });

    const structure = await SalaryStructure.create({
        tenantId,
        employeeId,
        components,
        effectiveFrom,
        isActive: true
    });

    res.status(200).json({ success: true, data: structure });
});

export const getSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const tenantId = user.tenantId;
    const { employeeId } = req.params;
    const structure = await SalaryStructure.findOne({ tenantId, employeeId, isActive: true }).populate('components.componentId');
    res.status(200).json({ success: true, data: structure });
});

export const getAllSalaryStructures = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const tenantId = user.tenantId;
    const structures = await SalaryStructure.find({ tenantId, isActive: true }).populate('components.componentId');
    res.status(200).json({ success: true, data: structures });
});

export const bulkUpdateSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const tenantId = user.tenantId;
    const userId = user._id;
    const { componentId, amount } = req.body;

    if (!tenantId) {
        return res.status(401).json({ success: false, message: "Tenant context is required" });
    }

    if (!componentId || amount === undefined) {
        return res.status(400).json({ success: false, message: "ComponentId and Amount are required" });
    }

    console.log(`[Bulk Update] Request - Tenant: ${tenantId}, User: ${userId}, Component: ${componentId}, Amount: ${amount}`);

    const payrollService = container.resolve(PayrollService);
    const result = await payrollService.bulkUpdateStructure(tenantId, componentId, Number(amount));

    res.status(200).json(result);
});

// Attendance (Manual Entry)
export const logAttendance = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const tenantId = user.tenantId;
    const {
        employeeId, month, year, workedDays, notes,
        overtimeHours, regularHours, incentiveAmount, commissionAmount, bonusAmount, advanceRecoveryAmount,
        holidays, weeklyOffs, paidLeaves, lateDays, halfDays
    } = req.body;

    // Check for locked payroll
    const periodStart = new Date(year, month, 1); // Assuming month is 0-indexed
    const existingRun = await PayrollRun.findOne({
        tenantId,
        periodStart: { $gte: periodStart, $lte: periodStart }
    });

    if (existingRun) {
        return res.status(400).json({ success: false, message: "Attendance is locked. Payroll has already been generated for this period." });
    }

    const attendance = await AttendanceSummary.findOneAndUpdate(
        { tenantId, employeeId, month, year },
        {
            workedDays,
            notes,
            overtimeHours,
            regularHours,
            holidays, weeklyOffs, paidLeaves, lateDays, halfDays,
            incentiveAmount,
            commissionAmount,
            bonusAmount,
            advanceRecoveryAmount,
            totalDays: new Date(year, month + 1, 0).getDate()
        },
        { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: attendance });
});

export const getAttendanceSummary = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const tenantId = user.tenantId;
    const { month, year } = req.query;

    if (month === undefined || year === undefined) {
        return res.status(400).json({ success: false, message: "Month and Year are required" });
    }

    const summary = await AttendanceSummary.find({
        tenantId,
        month: Number(month),
        year: Number(year)
    }).populate('employeeId', 'name role');

    res.status(200).json({ success: true, data: summary });
});

// Payroll Processing
export const generatePayroll = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const tenantId = user.tenantId;
    const userId = user._id!;
    const { month, year, branchId } = req.body;

    if (!tenantId) {
        return res.status(401).json({ success: false, message: "Tenant context is required" });
    }

    const payrollService = container.resolve(PayrollService);
    const run = await payrollService.generatePayroll(tenantId, month, year, userId, branchId);

    res.status(201).json({ success: true, data: run });
});

// Attendance
export const getPayrollRuns = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const tenantId = user.tenantId;
    const runs = await PayrollRun.find({ tenantId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: runs });
});

export const getRunDetails = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const tenantId = user.tenantId;
    const { id } = req.params;
    const run = await PayrollRun.findOne({ _id: id, tenantId });
    if (!run) return res.status(404).json({ message: "Run not found" });

    const payslips = await Payslip.find({ payrollRunId: id }).populate('employeeId');
    res.status(200).json({ success: true, data: { run, payslips } });
});

export const approvePayroll = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const tenantId = user.tenantId;
    const userId = user._id;
    const { id } = req.params;

    const payrollService = container.resolve(PayrollService);
    const run = await payrollService.approvePayroll(id as string, tenantId as any, userId);

    res.status(200).json({ success: true, data: run });
});

export const payPayroll = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const tenantId = user.tenantId!;
    const userId = user._id!;
    const { id } = req.params;
    const { accountId, paymentMode } = req.body; // Changed bankAccountId -> accountId

    const payrollService = container.resolve(PayrollService);
    const run = await payrollService.payPayroll(id as string, accountId, paymentMode, tenantId, userId);

    res.status(200).json({ success: true, data: run });
});

export const updatePayslip = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const tenantId = user.tenantId!;
    const { id } = req.params; // Payslip ID
    const updates = req.body;

    const payrollService = container.resolve(PayrollService);
    const payslip = await payrollService.updatePayslip(id as string, tenantId, updates);

    res.status(200).json({ success: true, data: payslip });
});

export const deleteRun = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const tenantId = user.tenantId!;
    const { id } = req.params; // Run ID

    const payrollService = container.resolve(PayrollService);
    await payrollService.deleteRun(id as string, tenantId);

    res.status(200).json({ success: true, message: 'Run deleted successfully' });
});

export const sendPayslip = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const tenantId = user.tenantId!;
    const { id } = req.params; // Payslip ID
    const { channels } = req.body; // ['EMAIL', 'WHATSAPP']

    const payrollService = container.resolve(PayrollService);
    const results = await payrollService.sendPayslip(id as string, tenantId, channels);

    res.status(200).json({ success: true, data: results });
});

export const processIndividualPayout = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const tenantId = user.tenantId;
    const userId = user._id!;
    const { employeeId, month, year, paymentMode, accountId, overrideWorkedDays, force } = req.body;

    if (!tenantId) {
        return res.status(401).json({ success: false, message: "Tenant context is required" });
    }

    const payrollService = container.resolve(PayrollService);
    const result = await payrollService.processIndividualPayout(tenantId, employeeId, month, year, userId, paymentMode, accountId, overrideWorkedDays, force);

    res.status(200).json({ success: true, data: result });
});
