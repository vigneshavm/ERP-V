import { injectable } from "tsyringe";
import { AppError } from "../../../utils/AppError.js";
import { ISerializedUnit, SerializedUnitStatus } from "../../../interfaces/ISerializedUnit.js";
import { info } from "../../../config/logger.js";
import SerializedUnit from "../models/SerializedUnit.js";
import Item from "../models/Item.js";

interface UnitInput {
    serialNumber: string;
    imei1?: string;
    imei2?: string;
    modelNo?: string;
    configuration?: string;
    warrantyMonths?: number;
    warrantyStartDate?: string | Date;
    grnId?: string;
}

@injectable()
export class SerializedUnitService {

    /** Register one or more physical units against an item -- typically called once per unit at GRN time. */
    async addUnits(itemId: string, tenantId: string, units: UnitInput[], userId: string): Promise<ISerializedUnit[]> {
        if (!units || units.length === 0) {
            throw new AppError("At least one unit (serial number) is required", 400);
        }

        const item = await Item.findOne({ _id: itemId, tenantId });
        if (!item) {
            throw new AppError("Item not found", 404);
        }
        if (!item.isSerialized) {
            throw new AppError(`"${item.name}" is not marked as a serialized item -- enable serial tracking on it first`, 400);
        }

        const seen = new Set<string>();
        for (const unit of units) {
            if (!unit.serialNumber) {
                throw new AppError("Every unit needs a serial number", 400);
            }
            if (seen.has(unit.serialNumber)) {
                throw new AppError(`Duplicate serial number in this batch: ${unit.serialNumber}`, 400);
            }
            seen.add(unit.serialNumber);
        }

        const created = await SerializedUnit.insertMany(
            units.map(u => ({
                itemId,
                serialNumber: u.serialNumber,
                imei1: u.imei1,
                imei2: u.imei2,
                modelNo: u.modelNo,
                configuration: u.configuration,
                warrantyMonths: u.warrantyMonths,
                warrantyStartDate: u.warrantyStartDate,
                grnId: u.grnId,
                status: "IN_STOCK" as SerializedUnitStatus,
                tenantId,
                addedBy: userId,
            })),
            { ordered: true }
        );

        info(`${created.length} serialized unit(s) added for item ${item.name}`);
        return created;
    }

    async getUnitsByItem(itemId: string, tenantId: string, status?: string): Promise<ISerializedUnit[]> {
        const query: Record<string, any> = { itemId, tenantId };
        if (status) query.status = status;
        return SerializedUnit.find(query).sort({ createdAt: -1 });
    }

    /** Look a unit up by whatever the counter/support staff has in hand -- serial number, IMEI 1, or IMEI 2. */
    async lookup(value: string, tenantId: string): Promise<ISerializedUnit> {
        if (!value) {
            throw new AppError("A serial number or IMEI is required", 400);
        }
        const unit = await SerializedUnit.findOne({
            tenantId,
            $or: [{ serialNumber: value }, { imei1: value }, { imei2: value }],
        }).populate("itemId", "name sku sellingPrice");

        if (!unit) {
            throw new AppError("No unit found for that serial number or IMEI", 404);
        }
        return unit;
    }

    async updateStatus(unitId: string, tenantId: string, status: SerializedUnitStatus, soldInvoiceId?: string): Promise<ISerializedUnit> {
        const unit = await SerializedUnit.findOne({ _id: unitId, tenantId });
        if (!unit) {
            throw new AppError("Unit not found", 404);
        }
        unit.status = status;
        if (status === "SOLD" && soldInvoiceId) {
            unit.soldInvoiceId = soldInvoiceId as any;
        }
        await unit.save();
        info(`Unit ${unit.serialNumber} marked ${status}`);
        return unit;
    }

    async deleteUnit(unitId: string, tenantId: string): Promise<void> {
        const unit = await SerializedUnit.findOne({ _id: unitId, tenantId });
        if (!unit) {
            throw new AppError("Unit not found", 404);
        }
        if (unit.status === "SOLD") {
            throw new AppError("Cannot delete a unit that has already been sold -- mark it RETURNED instead if it came back", 400);
        }
        await unit.deleteOne();
        info(`Unit ${unit.serialNumber} deleted`);
    }
}
