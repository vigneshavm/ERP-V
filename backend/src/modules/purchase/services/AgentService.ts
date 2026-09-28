import { injectable, inject } from "tsyringe";
import { AgentRepository } from "../repositories/AgentRepository.js";
import { AppError } from "../../../utils/AppError.js";
import { IAgent } from "../models/Agent.js";
import { info } from "../../../config/logger.js";

@injectable()
export class AgentService {
    constructor(
        @inject(AgentRepository) private agentRepository: AgentRepository
    ) { }

    async createAgent(tenantId: string, body: Partial<IAgent>): Promise<IAgent> {
        const { name, phone, email, address, commissionPercent, linkedSupplierId, bankAccountNumber, bankName, ifsc, notes, status } = body;

        if (!name) {
            throw new AppError("Agent name is required", 400);
        }

        const existingAgent = await this.agentRepository.findByName(name, tenantId);
        if (existingAgent) {
            throw new AppError("Agent with this name already exists", 400);
        }

        const agent = await this.agentRepository.create({
            tenantId,
            name,
            phone,
            email,
            address,
            commissionPercent: commissionPercent || 0,
            linkedSupplierId: linkedSupplierId || undefined,
            bankAccountNumber,
            bankName,
            ifsc,
            notes,
            status: status || 'active'
        });

        info(`Agent created: ${name}`);
        return agent;
    }

    async getAgents(tenantId: string): Promise<IAgent[]> {
        return this.agentRepository.findAll(tenantId);
    }

    async getAgentById(id: string, tenantId: string): Promise<IAgent> {
        const agent = await this.agentRepository.findById(id, tenantId);
        if (!agent) {
            throw new AppError("Agent not found", 404);
        }
        return agent;
    }

    async updateAgent(id: string, tenantId: string, body: Partial<IAgent>): Promise<IAgent> {
        const agent = await this.agentRepository.update(id, tenantId, body);
        if (!agent) {
            throw new AppError("Agent not found", 404);
        }
        info(`Agent updated: ${agent.name}`);
        return agent;
    }

    async deleteAgent(id: string, tenantId: string): Promise<void> {
        const agent = await this.agentRepository.delete(id, tenantId);
        if (!agent) {
            throw new AppError("Agent not found", 404);
        }
        info(`Agent deleted: ${agent.name}`);
    }
}
