import mongoose, { Schema } from "mongoose";
import { ISerializedUnit } from "../../../interfaces/ISerializedUnit.js";

const serializedUnitSchema = new Schema<ISerializedUnit>(
    {
        itemId: {
            type: Schema.Types.ObjectId,
            ref: "Item",
            required: true,
            index: true,
        },
        serialNumber: {
            type: String,
            required: true,
            trim: true,
        },
        imei1: {
            type: String,
            trim: true,
        },
        imei2: {
            type: String,
            trim: true,
        },
        modelNo: {
            type: String,
            trim: true,
        },
        configuration: {
            type: String,
            trim: true,
        },
        warrantyMonths: {
            type: Number,
            min: 0,
        },
        warrantyStartDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["IN_STOCK", "SOLD", "RETURNED", "DAMAGED"],
            default: "IN_STOCK",
            index: true,
        },
        grnId: {
            type: Schema.Types.ObjectId,
            ref: "GRN",
        },
        soldInvoiceId: {
            type: Schema.Types.ObjectId,
            ref: "SalesInvoice",
        },
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        addedBy: {
            type: String,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Serial number must be unique per tenant; IMEI 1 likewise -- these are the two lookup keys a
// counter clerk will actually type in, so both need to resolve to exactly one unit.
serializedUnitSchema.index({ serialNumber: 1, tenantId: 1 }, { unique: true });
serializedUnitSchema.index(
    { imei1: 1, tenantId: 1 },
    { unique: true, partialFilterExpression: { imei1: { $type: "string" } } }
);

const SerializedUnit = mongoose.model<ISerializedUnit>("SerializedUnit", serializedUnitSchema);
export default SerializedUnit;
