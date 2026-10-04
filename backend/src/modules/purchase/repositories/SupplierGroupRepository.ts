import { injectable, singleton } from "tsyringe";
import {
    createSupplierGroup,
    findSupplierGroupById,
    findSupplierGroupByName,
    listSupplierGroups,
    updateSupplierGroup,
    deleteSupplierGroup,
    type SupplierGroupEntry,
} from "../../../integrations/textilesoft/erpSupplierGroup.js";

@injectable()
@singleton()
export class SupplierGroupRepository {
    async create(data: Partial<SupplierGroupEntry>): Promise<SupplierGroupEntry> {
        return createSupplierGroup(data);
    }

    async findById(id: string): Promise<SupplierGroupEntry | null> {
        return findSupplierGroupById(id);
    }

    async findByName(name: string): Promise<SupplierGroupEntry | null> {
        return findSupplierGroupByName(name);
    }

    async findAll(): Promise<SupplierGroupEntry[]> {
        return listSupplierGroups();
    }

    async update(id: string, updates: Partial<SupplierGroupEntry>): Promise<SupplierGroupEntry | null> {
        return updateSupplierGroup(id, updates);
    }

    async delete(id: string): Promise<boolean> {
        return deleteSupplierGroup(id);
    }
}
