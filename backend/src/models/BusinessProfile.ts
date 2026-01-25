import mongoose, { Schema } from "mongoose";
import { IBusinessProfile } from "../interfaces/IBusinessProfile.js";

const workingHoursSchema = new Schema({
    open: { type: String, default: "" },
    close: { type: String, default: "" },
    closed: { type: Boolean, default: false }
}, { _id: false });

const businessProfileSchema = new Schema<IBusinessProfile>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: "" },
    category: { type: String, default: "" },
    businessType: { type: String, default: "" },
    description: { type: String, default: "" },
    verified: { type: Boolean, default: false },
    hours: {
        monday: { type: workingHoursSchema, default: { open: "09:00", close: "18:00", closed: false } },
        tuesday: { type: workingHoursSchema, default: { open: "09:00", close: "18:00", closed: false } },
        wednesday: { type: workingHoursSchema, default: { open: "09:00", close: "18:00", closed: false } },
        thursday: { type: workingHoursSchema, default: { open: "09:00", close: "18:00", closed: false } },
        friday: { type: workingHoursSchema, default: { open: "09:00", close: "18:00", closed: false } },
        saturday: { type: workingHoursSchema, default: { open: "10:00", close: "14:00", closed: false } },
        sunday: { type: workingHoursSchema, default: { open: "", close: "", closed: true } }
    },
    reviews: [{
        reviewer: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, default: "" },
        reply: { type: String, default: "" },
        date: { type: Date, default: Date.now },
        profilePhoto: { type: String, default: "" }
    }],
    posts: [{
        content: { type: String, required: true },
        type: { type: String, enum: ['OFFER', 'EVENT', 'UPDATE'], default: 'UPDATE' },
        views: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        date: { type: Date, default: Date.now },
        imageUrl: { type: String, default: "" }
    }],
    photos: [{
        url: String,
        type: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    insights: {
        views: { type: Number, default: 0 },
        calls: { type: Number, default: 0 },
        directions: { type: Number, default: 0 },
        websiteClicks: { type: Number, default: 0 }
    },
    completeness: { type: Number, default: 0 },
    isConnected: { type: Boolean, default: false },
    lastSyncAt: { type: Date }
}, { timestamps: true });

const BusinessProfile = mongoose.model<IBusinessProfile>("BusinessProfile", businessProfileSchema);
export default BusinessProfile;
