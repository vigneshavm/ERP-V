import { Response } from 'express';
import { singleton, inject } from 'tsyringe';
import { AgentService } from '../services/AgentService.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';
import { error } from '../../../config/logger.js';

@singleton()
export class AgentController {
    constructor(
        @inject(AgentService) private agentService: AgentService
    ) { }

    public createAgent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const tenantId = req.tenantId.toString();
            const agent = await this.agentService.createAgent(tenantId, req.body);
            res.status(201).json({ success: true, data: agent });
        } catch (err: any) {
            error(`Create Agent Error: ${(err as Error).message}`);
            res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    };

    public getAgents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const tenantId = req.tenantId.toString();
            const agents = await this.agentService.getAgents(tenantId);
            res.status(200).json({ success: true, data: agents });
        } catch (err: any) {
            error(`Get Agents Error: ${(err as Error).message}`);
            res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    };

    public updateAgent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params as { id: string };
            const tenantId = req.tenantId.toString();
            const agent = await this.agentService.updateAgent(id, tenantId, req.body);
            res.status(200).json({ success: true, data: agent });
        } catch (err: any) {
            error(`Update Agent Error: ${(err as Error).message}`);
            res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    };

    public deleteAgent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params as { id: string };
            const tenantId = req.tenantId.toString();
            await this.agentService.deleteAgent(id, tenantId);
            res.status(200).json({ success: true, message: 'Agent deleted successfully' });
        } catch (err: any) {
            error(`Delete Agent Error: ${(err as Error).message}`);
            res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    };
}
