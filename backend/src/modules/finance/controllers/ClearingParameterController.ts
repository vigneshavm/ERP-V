import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { container } from 'tsyringe';
import { ClearingParameterService } from '../services/ClearingParameterService.js';

interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
        [key: string]: any;
    };
    tenantId?: string;
}

export const initializeUnit = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(ClearingParameterService);
    const tenantId = (req as any).tenantId;
    const result = await service.initializeUnit(req.body.sector, tenantId, req.user?._id as string, req.user?.name);
    const status = result.message === 'Unit already initialized' ? 200 : 201;
    res.status(status).json(result);
});

export const getParameters = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(ClearingParameterService);
    const tenantId = (req as any).tenantId;
    const sector = typeof req.query.sector === 'string' ? req.query.sector : undefined;
    const params = await service.getParameters(tenantId, sector);
    res.status(200).json(params);
});

export const updateParameter = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const service = container.resolve(ClearingParameterService);
    const tenantId = (req as any).tenantId;
    const param = await service.updateParameter(req.params.id as string, tenantId, req.body, req.user?.name);
    res.status(200).json(param);
});

const ClearingParameterController = { initializeUnit, getParameters, updateParameter };
export default ClearingParameterController;
