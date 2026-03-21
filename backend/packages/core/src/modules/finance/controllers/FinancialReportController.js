import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { container } from 'tsyringe';
import { FinancialReportService } from '../services/FinancialReportService.js';
export const getTrialBalance = asyncHandler(async (req, res) => {
    const service = container.resolve(FinancialReportService);
    const tenantId = req.tenantId || req.user.tenantId;
    const report = await service.getTrialBalance(tenantId);
    res.status(200).json(report);
});
export const getProfitAndLoss = asyncHandler(async (req, res) => {
    const service = container.resolve(FinancialReportService);
    const tenantId = req.tenantId || req.user.tenantId;
    const { startDate, endDate } = req.query;
    const report = await service.getProfitAndLoss(tenantId, startDate, endDate);
    res.status(200).json(report);
});
export const getBalanceSheet = asyncHandler(async (req, res) => {
    const service = container.resolve(FinancialReportService);
    const tenantId = req.tenantId || req.user.tenantId;
    const report = await service.getBalanceSheet(tenantId);
    res.status(200).json(report);
});
export const getCashFlow = asyncHandler(async (req, res) => {
    const service = container.resolve(FinancialReportService);
    const tenantId = req.tenantId || req.user?.tenantId;
    const { startDate, endDate } = req.query;
    const report = await service.getCashFlow(tenantId, startDate, endDate);
    res.status(200).json(report);
});
const FinancialReportController = { getTrialBalance, getProfitAndLoss, getBalanceSheet, getCashFlow };
export default FinancialReportController;
