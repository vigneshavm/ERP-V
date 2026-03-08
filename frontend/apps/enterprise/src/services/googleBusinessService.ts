
import api from './api';

export interface GoogleReview {
    _id?: string;
    reviewer: string;
    rating: number;
    comment: string;
    reply: string;
    date: string;
    profilePhoto: string;
}

export interface GooglePost {
    _id?: string;
    content: string;
    type: 'OFFER' | 'EVENT' | 'UPDATE';
    views: number;
    clicks: number;
    date: string;
    imageUrl: string;
}

export interface GoogleBusinessProfileData {
    businessName: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    category: string;
    description: string;
    verified: boolean;
    insights?: {
        views: number;
        calls: number;
        directions: number;
        websiteClicks: number;
    };
    completeness?: number;
    isConnected?: boolean;
    reviews?: GoogleReview[];
    posts?: GooglePost[];
    photos?: { url: string; type: string; uploadedAt: string }[];
    lastSyncAt?: string;
}

export const googleBusinessService = {
    getProfile: async (): Promise<GoogleBusinessProfileData> => {
        const response = await api.get('/api/business/profile');
        return response.data.data;
    },

    syncProfile: async (): Promise<GoogleBusinessProfileData> => {
        const response = await api.post('/api/business/google/sync');
        return response.data.data;
    },

    updateProfile: async (data: Partial<GoogleBusinessProfileData>): Promise<GoogleBusinessProfileData> => {
        const response = await api.put('/api/business/profile', data);
        return response.data.data;
    },

    // Real implementation for replying to reviews
    replyToReview: async (reviewId: string, reply: string): Promise<boolean> => {
        await api.post(`/api/business/reviews/${reviewId}/reply`, { reply });
        return true;
    },

    // Real implementation for creating a post
    createPost: async (post: Partial<GooglePost>): Promise<GooglePost> => {
        const response = await api.post('/api/business/posts', post);
        return response.data.data;
    }
};
