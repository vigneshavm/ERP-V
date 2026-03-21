import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { container } from 'tsyringe';
import { DayEndService } from '../services/DayEndService.js';
export const getDayEndSummary = asyncHandler(async (req, res) => {
    const service = container.resolve(DayEndService);
    const tenantId = req.user.tenantId;
    const summary = await service.getDayEndSummary(tenantId, req.query.date);
    res.status(200).json(summary);
});
export const saveDayEndReconciliation = asyncHandler(async (req, res) => {
    const service = container.resolve(DayEndService);
    const tenantId = req.user.tenantId;
    const recon = await service.saveDayEndReconciliation(tenantId, req.user._id, req.user.name || 'Unknown', req.body);
    res.status(201).json(recon);
});
const DayEndController = { getDayEndSummary, saveDayEndReconciliation };
export default DayEndController;
