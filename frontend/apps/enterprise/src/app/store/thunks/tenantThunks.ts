import { logger } from '@/shared/lib/logger';
import { AppDispatch, RootState } from "../store";
// import { supabase } from '../../lib/supabase'; // Removed

import { updateTenantEcommerce, updateGoogleBusinessProfile, setEcommerceEnabled } from '@/entities/session/model/tenantSlice';
import { GoogleBusinessConfig } from "@/entities/session/model/growth";

import api from "@/shared/api/api";

const getConfig = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

export const syncGoogleProfile = (tenantId: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
        const state = getState();
        const { token } = useAuthStore.getState();
        if (!token) return; // Should handle error appropriately

        const mapProfileToConfig = (data: any): GoogleBusinessConfig => ({
            id: data._id || data.id,
            tenantId: data.userId || tenantId, // Mapping userId as tenantId
            isConnected: data.isConnected,
            businessName: data.businessName || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            category: data.category || '',
            description: data.description || '',
            verificationStatus: data.verified ? 'VERIFIED' : 'UNVERIFIED',
            lastSyncAt: data.lastSyncAt,
            completeness: data.completeness || 0,
            metrics: data.insights ? Object.values(data.insights) : [], // Simplified mapping
            hours: [],
            photos: data.photos || [],
            posts: data.posts || [],
            reviews: data.reviews || []
        });

        // Call Backend API
        const { data } = await api.post('/business/google/sync', {}, getConfig(token));

        if (data && data.success && data.data) {
            dispatch(updateGoogleBusinessProfile({ tenantId, config: mapProfileToConfig(data.data) }));
        }
    } catch (err) {
        logger.error('Failed to sync google profile:', err as any);
    }
};

export const updateEcommerceSettings = (tenantId: string, settings: any) => async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
        const state = getState();
        const { token } = useAuthStore.getState();
        if (!token) return;

        // Assuming backend accepts partial updates to profile including settings
        // If not, this might need a specific endpoint
        await api.put('/business/profile', { ecommerceSettings: settings }, getConfig(token));
        dispatch(updateTenantEcommerce(settings));
    } catch (err) {
        logger.error('Failed to update ecommerce settings:', err as any);
    }
};

/**
 * Activate ecommerce for a tenant
 */
export const activateEcommerce = (tenantId: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
        const state = getState();
        const { token } = useAuthStore.getState();
        if (!token) return;

        const ecommerceConfig: any = {
            id: `ec-${tenantId}`,
            tenantId,
            isEnabled: true,
            plan: 'STARTER' as const,
            activatedAt: new Date().toISOString(),
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            paymentGatewayEnabled: false,
            inventorySyncEnabled: true
        };

        await api.put('/business/profile', { ecommerceConfig }, getConfig(token));
        dispatch(setEcommerceEnabled({ tenantId, config: ecommerceConfig }));
    } catch (err) {
        logger.error('Failed to activate ecommerce:', err as any);
    }
};
