import Employee from '../models/Employee.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created } from '@smarterp/shared/utils/response.js';
import { requireTenantId } from '@smarterp/shared/utils/tenantContext.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
export const addEmployee = asyncHandler(async (req, res) => {
    const tenantId = requireTenantId(req);
    const { name, role, roleId, mobile, dailyRate, baseSalary, wageType, joiningDate, branchId, sector } = req.body;
    const dup = await Employee.exists({ tenantId, mobile });
    if (dup)
        throw new AppError('Employee with this mobile number already exists', 400);
    const employee = await Employee.create({ tenantId, name, role, roleId, mobile, dailyRate, baseSalary, wageType, joiningDate, branchId, sector });
    created(res, employee, 'Employee created successfully');
});
export const getEmployees = asyncHandler(async (req, res) => {
    const tenantId = requireTenantId(req);
    const employees = await Employee.find({ tenantId, isActive: true }).sort({ createdAt: -1 });
    ok(res, employees);
});
export const updateEmployee = asyncHandler(async (req, res) => {
    const tenantId = requireTenantId(req);
    const employee = await Employee.findOneAndUpdate({ _id: req.params.id, tenantId }, { $set: req.body }, { new: true, runValidators: true });
    if (!employee)
        throw new AppError('Employee not found or unauthorized', 404);
    ok(res, employee, 'Employee updated successfully');
});
export const deleteEmployee = asyncHandler(async (req, res) => {
    const tenantId = requireTenantId(req);
    const employee = await Employee.findOneAndUpdate({ _id: req.params.id, tenantId }, { $set: { isActive: false } }, { new: true });
    if (!employee)
        throw new AppError('Employee not found or unauthorized', 404);
    ok(res, null, 'Employee removed successfully');
});
