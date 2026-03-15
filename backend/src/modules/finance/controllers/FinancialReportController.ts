import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { container } from 'tsyringe';
import { FinancialReportService } from '../services/FinancialReportService.js';

interface AuthenticatedRequest extends Request {
    tenantId?: string;
    [key: string]: any;
}

export const getTrialBalance = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(FinancialReportService);
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
    const report = await service.getTrialBalance(tenantId as string);
    res.status(200).json(report);
});

export const getProfitAndLoss = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(FinancialReportService);
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
    const { startDate, endDate } = req.query;
    const report = await service.getProfitAndLoss(tenantId as string, startDate as string, endDate as string);
    res.status(200).json(report);
});

export const getBalanceSheet = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(FinancialReportService);
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
    const report = await service.getBalanceSheet(tenantId as string);
    res.status(200).json(report);
});

const FinancialReportController = { getTrialBalance, getProfitAndLoss, getBalanceSheet };
export default FinancialReportController;
