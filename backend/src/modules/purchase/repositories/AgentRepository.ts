import { injectable, singleton } from "tsyringe";
import Agent from "../models/Agent.js";
import { IAgent } from "../models/Agent.js";

@injectable()
@singleton()
export class AgentRepository {
    async create(agentData: Partial<IAgent>): Promise<IAgent> {
        return Agent.create(agentData);
    }

    async findById(id: string, tenantId: string): Promise<IAgent | null> {
        return Agent.findOne({ _id: id, tenantId });
    }

    async findByName(name: string, tenantId: string): Promise<IAgent | null> {
        return Agent.findOne({ name, tenantId });
    }

    async findAll(tenantId: string): Promise<IAgent[]> {
        return Agent.find({ tenantId }).sort({ name: 1 });
    }

    async update(id: string, tenantId: string, updates: Partial<IAgent>): Promise<IAgent | null> {
        return Agent.findOneAndUpdate(
            { _id: id, tenantId },
            updates,
            { new: true, runValidators: true }
        );
    }

    async delete(id: string, tenantId: string): Promise<IAgent | null> {
        return Agent.findOneAndDelete({ _id: id, tenantId });
    }
}
