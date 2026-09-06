import { Response } from 'express';
import CardTerminal from '../models/CardTerminal.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';

export const createCardTerminal = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { terminalId, provider, storeId, notes, isActive } = req.body;
        if (!terminalId) return res.status(400).json({ success: false, message: 'Terminal ID is required' });

        const existing = await CardTerminal.findOne({ tenantId, terminalId });
        if (existing) return res.status(400).json({ success: false, message: 'A terminal with this ID is already registered' });

        const terminal = await CardTerminal.create({
            tenantId, terminalId, provider, storeId: storeId || undefined, notes, isActive: isActive ?? true
        });

        res.status(201).json({ success: true, data: terminal });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getCardTerminals = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const terminals = await CardTerminal.find({ tenantId }).sort({ terminalId: 1 }).populate('storeId', 'name');
        res.status(200).json({ success: true, data: terminals });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateCardTerminal = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const terminal = await CardTerminal.findOneAndUpdate(
            { _id: req.params.id, tenantId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!terminal) return res.status(404).json({ success: false, message: 'Terminal not found' });

        res.status(200).json({ success: true, data: terminal });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteCardTerminal = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const terminal = await CardTerminal.findOneAndDelete({ _id: req.params.id, tenantId });
        if (!terminal) return res.status(404).json({ success: false, message: 'Terminal not found' });

        res.status(200).json({ success: true, message: 'Terminal deleted' });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
