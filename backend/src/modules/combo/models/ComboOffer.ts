import mongoose, { Schema } from "mongoose";
import { IComboOffer } from "../../../interfaces/IComboOffer.js";

const comboOfferSchema = new Schema<IComboOffer>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        comboCode: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        description: {
            type: String,
        },
        items: [{
            itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
            quantity: { type: Number, required: true, min: 1 },
        }],
        offerPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        regularPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        barcode: {
            type: String,
            trim: true,
            index: true,
        },
        validFrom: {
            type: Date,
        },
        validTo: {
            type: Date,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        createdBy: {
            type: String,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// A combo must contain at least one item -- an empty bundle isn't a combo, it's a bug upstream.
comboOfferSchema.path("items").validate(function (items: unknown[]) {
    return Array.isArray(items) && items.length > 0;
}, "A combo offer must include at least one item");

// Virtual: how much cheaper the bundle is than buying its items individually.
comboOfferSchema.virtual("discountPercent").get(function (this: IComboOffer) {
    if (!this.regularPrice) return 0;
    return Math.max(0, Math.round(((this.regularPrice - this.offerPrice) / this.regularPrice) * 10000) / 100);
});

comboOfferSchema.set("toJSON", { virtuals: true });
comboOfferSchema.set("toObject", { virtuals: true });

// comboCode must be unique per tenant, not globally -- two tenants can both use "COMBO-01".
comboOfferSchema.index({ comboCode: 1, tenantId: 1 }, { unique: true });

const ComboOffer = mongoose.model<IComboOffer>("ComboOffer", comboOfferSchema);
export default ComboOffer;
