import { injectable, inject } from "tsyringe";
import { SupplierGroupRepository } from "../repositories/SupplierGroupRepository.js";
import { AppError } from "../../../utils/AppError.js";
import type { SupplierGroupEntry } from "../../../integrations/textilesoft/erpSupplierGroup.js";
import { info } from "../../../config/logger.js";

@injectable()
export class SupplierGroupService {
    constructor(
        @inject(SupplierGroupRepository) private supplierGroupRepository: SupplierGroupRepository
    ) { }

    async createGroup(_tenantId: string, body: Partial<SupplierGroupEntry>): Promise<SupplierGroupEntry> {
        const { name } = body;

        if (!name) {
            throw new AppError("Group name is required", 400);
        }

        const existingGroup = await this.supplierGroupRepository.findByName(name);
        if (existingGroup) {
            throw new AppError("Group with this name already exists", 400);
        }

        const group = await this.supplierGroupRepository.create(body);

        info(`Supplier group created: ${name}`);
        return group;
    }

    async getGroups(_tenantId: string): Promise<SupplierGroupEntry[]> {
        return this.supplierGroupRepository.findAll();
    }

    async getGroupById(id: string, _tenantId: string): Promise<SupplierGroupEntry> {
        const group = await this.supplierGroupRepository.findById(id);
        if (!group) {
            throw new AppError("Supplier group not found", 404);
        }
        return group;
    }

    async updateGroup(id: string, tenantId: string, body: Partial<SupplierGroupEntry>): Promise<SupplierGroupEntry> {
        const group = await this.getGroupById(id, tenantId);

        // Check for duplicate name if name is being changed
        if (body.name && body.name !== group.name) {
            const existing = await this.supplierGroupRepository.findByName(body.name);
            if (existing) {
                throw new AppError("Group with this name already exists", 400);
            }
        }

        const updated = await this.supplierGroupRepository.update(id, body);
        if (!updated) {
            throw new AppError("Failed to update group", 500);
        }

        info(`Supplier group updated: ${group.name}`);
        return updated;
    }

    async deleteGroup(id: string, tenantId: string): Promise<void> {
        const group = await this.getGroupById(id, tenantId);

        await this.supplierGroupRepository.delete(id);
        info(`Supplier group deleted: ${group.name}`);
    }
}
