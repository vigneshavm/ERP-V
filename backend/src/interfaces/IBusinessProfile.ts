import { Document, Types } from "mongoose";

export interface IWorkingHours {
    open: string;
    close: string;
    closed: boolean;
}

export interface IHoursState {
    monday: IWorkingHours;
    tuesday: IWorkingHours;
    wednesday: IWorkingHours;
    thursday: IWorkingHours;
    friday: IWorkingHours;
    saturday: IWorkingHours;
    sunday: IWorkingHours;
}

export interface IPhoto {
    url: string;
    type: string;
    uploadedAt: Date;
}

export interface IInsights {
    views: number;
    calls: number;
    directions: number;
    websiteClicks: number;
}

export interface IBusinessProfile extends Document {
    userId: Types.ObjectId;
    businessName: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    category: string;
    description: string;
    verified: boolean;
    hours: IHoursState;
    photos: IPhoto[];
    insights: IInsights;
    completeness: number;
    isConnected: boolean;
    lastSyncAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
