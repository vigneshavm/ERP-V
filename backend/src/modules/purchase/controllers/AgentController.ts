import { Response } from 'express';
import Agent from '../models/Agent.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';

export const createAgent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {
            name, phone, email, address, commissionPercent,
            linkedSupplierId, bankAccountNumber, bankName, ifsc, notes, status
        } = req.body;
        const tenantId = req.user?.tenantId;

        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        if (!name) {
            return res.status(400).json({ success: false, message: 'Agent name is required' });
        }

        const existingAgent = await Agent.findOne({ tenantId, name });
        if (existingAgent) {
            return res.status(400).json({ success: false, message: 'Agent with this name already exists' });
        }

        const agent = await Agent.create({
            tenantId,
            name,
            phone,
            email,
            address,
            commissionPercent,
            linkedSupplierId: linkedSupplierId || undefined,
            bankAccountNumber,
            bankName,
            ifsc,
            notes,
            status
        });

        res.status(201).json({ success: true, data: agent });
    } catch (error: any) {
        console.error('Create Agent Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const getAgents = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        const agents = await Agent.find({ tenantId }).sort({ name: 1 });
        res.status(200).json({ success: true, data: agents });
    } catch (error: any) {
        console.error('Get Agents Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const updateAgent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;

        const agent = await Agent.findOneAndUpdate(
            { _id: id, tenantId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!agent) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }

        res.status(200).json({ success: true, data: agent });
    } catch (error: any) {
        console.error('Update Agent Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const deleteAgent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;

        const agent = await Agent.findOneAndDelete({ _id: id, tenantId });

        if (!agent) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }

        res.status(200).json({ success: true, message: 'Agent deleted successfully' });
    } catch (error: any) {
        console.error('Delete Agent Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
