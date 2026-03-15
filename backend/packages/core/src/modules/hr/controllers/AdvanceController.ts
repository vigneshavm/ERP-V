import { Request, Response } from 'express';
import SalaryAdvance from '../models/SalaryAdvance.js';

export const createAdvance = async (req: Request, res: Response) => {
    try {
        const { employeeId, amount, date, type, notes } = req.body;
        const tenantId = (req as any).user.tenantId;

        const advance = await SalaryAdvance.create({
            tenantId,
            employeeId,
            amount,
            date: date || new Date(),
            type: type || 'ADVANCE',
            status: 'PENDING',
            notes
        });

        res.status(201).json({ success: true, data: advance });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getEmployeeAdvances = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;
        const tenantId = (req as any).user.tenantId;

        const advances = await SalaryAdvance.find({ tenantId, employeeId }).sort({ date: -1 });
        res.status(200).json({ success: true, data: advances });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllAdvances = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const advances = await SalaryAdvance.find({ tenantId }).populate('employeeId', 'name role').sort({ date: -1 });
        res.status(200).json({ success: true, data: advances });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
