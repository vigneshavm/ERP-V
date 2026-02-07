import { Request, Response } from 'express';
import ClearingParameter from '../models/ClearingParameter.js';
import { info, error } from '../../../config/logger.js';

interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
        [key: string]: any;
    };
    tenantId?: string;
}

export const initializeUnit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { sector } = req.body;
        const tenantId = (req as any).tenantId;

        if (!sector) {
            res.status(400).json({ message: 'Sector is required' });
            return;
        }

        const existing = await ClearingParameter.find({ tenantId, sector });
        if (existing.length > 0) {
            res.status(200).json({ message: 'Unit already initialized', parameters: existing });
            return;
        }

        const defaults = [
            { type: 'Local', clearingDays: 2, holidaysIncluded: false },
            { type: 'Outstation', clearingDays: 5, holidaysIncluded: true },
            { type: 'HighValue', clearingDays: 1, holidaysIncluded: false }
        ];

        const created = await ClearingParameter.insertMany(defaults.map(d => ({
            ...d,
            sector,
            tenantId,
            userId: req.user?._id
        })));

        info(`Unit ${sector} initialized by ${req.user?.name}`);
        res.status(201).json({ message: 'Unit Initialized Successfully', parameters: created });
    } catch (err) {
        error(`Init Unit Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export const getParameters = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { sector } = req.query;
        const tenantId = (req as any).tenantId;
        const query: any = { tenantId };
        if (sector) query.sector = sector;

        const params = await ClearingParameter.find(query);
        res.status(200).json(params);
    } catch (err) {
        error(`Get Params Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export const updateParameter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const param = await ClearingParameter.findOneAndUpdate(
            { _id: id, tenantId: (req as any).tenantId },
            updates,
            { new: true }
        );

        if (!param) {
            res.status(404).json({ message: 'Parameter not found' });
            return;
        }

        info(`Clearing parameter updated by ${req.user?.name}`);
        res.status(200).json(param);
    } catch (err) {
        error(`Update Param Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

const ClearingParameterController = {
    initializeUnit,
    getParameters,
    updateParameter
};

export default ClearingParameterController;
