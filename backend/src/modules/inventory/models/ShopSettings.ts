import mongoose, { Schema } from "mongoose";
import { IShopSettings } from "../../../interfaces/IShopSettings.js";

const shopSettingsSchema = new Schema<IShopSettings>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    shopEnabled: { type: Boolean, default: false },
    customDomain: { type: String, default: "" },
    theme: { type: String, default: "Basic" },
    supportEmail: { type: String, default: "" },
    plan: { type: String, enum: ['Starter', 'Professional', 'Enterprise'], default: 'Starter' },
    productsLimit: { type: Number, default: 50 },
    apiAccess: { type: Boolean, default: false },
    whiteLabeling: { type: Boolean, default: false }
}, { timestamps: true });

const ShopSettings = mongoose.model<IShopSettings>("ShopSettings", shopSettingsSchema);
export default ShopSettings;
