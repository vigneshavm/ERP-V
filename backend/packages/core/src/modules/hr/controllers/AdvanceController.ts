import { Request, Response } from 'express';
import SalaryAdvance from '../models/SalaryAdvance.js';
import { asyncHandler }    from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created }     from '@smarterp/shared/utils/response.js';
import { requireTenantId } from '@smarterp/shared/utils/tenantContext.js';

export const createAdvance = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = requireTenantId(req);
    const { employeeId, amount, date, type, notes } = req.body;
    const advance = await SalaryAdvance.create({ tenantId, employeeId, amount, date: date || new Date(), type: type || 'ADVANCE', status: 'PENDING', notes });
    created(res, advance);
});

export const getEmployeeAdvances = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = requireTenantId(req);
    const advances = await SalaryAdvance.find({ tenantId, employeeId: req.params.employeeId }).sort({ date: -1 });
    ok(res, advances);
});

export const getAllAdvances = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = requireTenantId(req);
    const advances = await SalaryAdvance.find({ tenantId }).populate('employeeId', 'name role').sort({ date: -1 });
    ok(res, advances);
});
