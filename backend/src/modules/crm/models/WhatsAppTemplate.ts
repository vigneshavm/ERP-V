import mongoose, { Schema } from "mongoose";
import { IWhatsAppTemplate } from "../../../interfaces/IWhatsApp.js";

const whatsappTemplateSchema = new Schema<IWhatsAppTemplate>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, default: "General" }
}, { timestamps: true });

const WhatsAppTemplate = mongoose.model<IWhatsAppTemplate>("WhatsAppTemplate", whatsappTemplateSchema);
export default WhatsAppTemplate;
