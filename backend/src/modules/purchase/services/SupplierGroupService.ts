import { injectable, inject } from "tsyringe";
import { SupplierGroupRepository } from "../repositories/SupplierGroupRepository.js";
import { AppError } from "../../../utils/AppError.js";
import { ISupplierGroup } from "../models/SupplierGroup.js";
import { info } from "../../../config/logger.js";

@injectable()
export class SupplierGroupService {
    constructor(
        @inject(SupplierGroupRepository) private supplierGroupRepository: SupplierGroupRepository
    ) { }

    async createGroup(tenantId: string, body: Partial<ISupplierGroup>): Promise<ISupplierGroup> {
        const { name } = body;

        if (!name) {
            throw new AppError("Group name is required", 400);
        }

        const existingGroup = await this.supplierGroupRepository.findByName(name, tenantId);
        if (existingGroup) {
            throw new AppError("Group with this name already exists", 400);
        }

        const group = await this.supplierGroupRepository.create({
            tenantId,
            ...body
        });

        info(`Supplier group created: ${name}`);
        return group;
    }

    async getGroups(tenantId: string): Promise<ISupplierGroup[]> {
        return this.supplierGroupRepository.findAll(tenantId);
    }

    async getGroupById(id: string, tenantId: string): Promise<ISupplierGroup> {
        const group = await this.supplierGroupRepository.findById(id, tenantId);
        if (!group) {
            throw new AppError("Supplier group not found", 404);
        }
        return group;
    }

    async updateGroup(id: string, tenantId: string, body: Partial<ISupplierGroup>): Promise<ISupplierGroup> {
        const group = await this.getGroupById(id, tenantId);

        // Check for duplicate name if name is being changed
        if (body.name && body.name !== group.name) {
            const existing = await this.supplierGroupRepository.findByName(body.name, tenantId);
            if (existing) {
                throw new AppError("Group with this name already exists", 400);
            }
        }

        const updated = await this.supplierGroupRepository.update(id, tenantId, body);
        if (!updated) {
            throw new AppError("Failed to update group", 500);
        }

        info(`Supplier group updated: ${group.name}`);
        return updated;
    }

    async deleteGroup(id: string, tenantId: string): Promise<void> {
        const group = await this.getGroupById(id, tenantId);

        await this.supplierGroupRepository.delete(id, tenantId);
        info(`Supplier group deleted: ${group.name}`);
    }
}
