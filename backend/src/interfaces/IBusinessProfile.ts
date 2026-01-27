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

export interface IReview {
    reviewer: string;
    rating: number;
    comment: string;
    reply: string;
    date: Date;
    profilePhoto: string;
}

export interface IPost {
    content: string;
    type: 'OFFER' | 'EVENT' | 'UPDATE';
    views: number;
    clicks: number;
    date: Date;
    imageUrl: string;
}

export interface IBusinessProfile extends Document {
    userId: Types.ObjectId;
    businessName: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    category: Types.ObjectId | string;
    businessType: Types.ObjectId | string;
    description: string;
    verified: boolean;
    hours: IHoursState;
    photos: IPhoto[];
    reviews: IReview[];
    posts: IPost[];
    insights: IInsights;
    completeness: number;
    isConnected: boolean;
    lastSyncAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
