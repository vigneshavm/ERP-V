import mongoose, { Schema } from "mongoose";
const whatsappTemplateSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, default: "General" }
}, { timestamps: true });
const WhatsAppTemplate = mongoose.model("WhatsAppTemplate", whatsappTemplateSchema);
export default WhatsAppTemplate;
