/**
 * Google Business Service
 * Migrated from services/googleBusinessService to FSD: features/google-business/api/googleBusinessService
 */

import api from '@/shared/api/api';

export interface GoogleBusinessProfileData {
    businessName: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    category: string;
    description: string;
    verified: boolean;
    insights: {
        views: number;
        calls: number;
        directions: number;
        websiteClicks: number;
    };
    completeness: number;
    isConnected: boolean;
    reviews: GoogleReview[];
    posts: GooglePost[];
    photos?: GooglePhoto[];
    hours?: Record<string, { open: string; close: string; closed: boolean }>;
}

export interface GoogleReview {
    _id?: string;
    reviewer: string;
    rating: number;
    comment: string;
    date: string;
    reply?: string;
}

export interface GooglePost {
    content: string;
    type: 'UPDATE' | 'OFFER' | 'EVENT';
    imageUrl?: string;
    date: string;
    views: number;
    clicks: number;
}

export interface GooglePhoto {
    url: string;
    type: string;
}

export const googleBusinessService = {
    async getProfile(): Promise<GoogleBusinessProfileData> {
        const res = await api.get('/api/google-business/profile');
        return res.data;
    },

    async updateProfile(data: Partial<GoogleBusinessProfileData> & { hours?: any }): Promise<void> {
        await api.put('/api/google-business/profile', data);
    },

    async syncProfile(): Promise<GoogleBusinessProfileData | null> {
        const res = await api.post('/api/google-business/sync');
        return res.data;
    },

    async replyToReview(reviewId: string, reply: string): Promise<void> {
        await api.post(`/api/google-business/reviews/${reviewId}/reply`, { reply });
    },

    async createPost(data: { content: string; type: string; imageUrl?: string }): Promise<GooglePost> {
        const res = await api.post('/api/google-business/posts', data);
        return res.data;
    }
};
