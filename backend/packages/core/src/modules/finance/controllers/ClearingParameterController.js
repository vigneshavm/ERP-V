import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { container } from 'tsyringe';
import { ClearingParameterService } from '../services/ClearingParameterService.js';
export const initializeUnit = asyncHandler(async (req, res) => {
    const service = container.resolve(ClearingParameterService);
    const tenantId = req.tenantId;
    const result = await service.initializeUnit(req.body.sector, tenantId, req.user._id, req.user.name);
    const status = result.message === 'Unit already initialized' ? 200 : 201;
    res.status(status).json(result);
});
export const getParameters = asyncHandler(async (req, res) => {
    const service = container.resolve(ClearingParameterService);
    const tenantId = req.tenantId;
    const sector = typeof req.query.sector === 'string' ? req.query.sector : undefined;
    const params = await service.getParameters(tenantId, sector);
    res.status(200).json(params);
});
export const updateParameter = asyncHandler(async (req, res) => {
    const service = container.resolve(ClearingParameterService);
    const tenantId = req.tenantId;
    const param = await service.updateParameter(req.params.id, tenantId, req.body, req.user.name);
    res.status(200).json(param);
});
const ClearingParameterController = { initializeUnit, getParameters, updateParameter };
export default ClearingParameterController;
