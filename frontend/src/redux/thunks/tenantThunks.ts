import { AppDispatch, RootState } from "../store";
// import { supabase } from '../../lib/supabase'; // Removed
import { setAuthLoading, setAuthError, setAuthSuccess } from '../slices/authSlice';
import { updateTenantEcommerce, updateGoogleBusinessProfile, setEcommerceEnabled } from '../slices/tenantSlice';
import { DATA_MODE } from "../../services/dataSource";
import { GoogleBusinessConfig } from "../../types/tenant";

import api from "../../services/api";

const getConfig = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

export const syncGoogleProfile = (tenantId: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
        const state = getState();
        const token = state.auth.user?.token;
        if (!token) return; // Should handle error appropriately
        if (DATA_MODE === 'DEMO') {
            // ... (Keep existing DEMO logic)
            const mockConfig: GoogleBusinessConfig = {
                id: 'gbp-demo',
                tenantId,
                isConnected: true,
                businessName: 'Vignesh Fashions (Demo)',
                address: '123 Fashion Street, Chennai, TN',
                phone: '+91 98765 43210',
                email: 'contact@vigneshfashions.com',
                website: 'https://vigneshfashions.demo',
                category: 'Retail Clothing',
                description: 'A premium boutique for modern fashion.',
                verificationStatus: 'VERIFIED',
                completeness: 85,
                metrics: [],
                hours: [],
                photos: [],
                posts: [],
                reviews: []
            };
            dispatch(updateGoogleBusinessProfile({ tenantId, config: mockConfig }));
            return;
        }

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
        console.error('Failed to sync google profile:', err);
    }
};

export const updateEcommerceSettings = (tenantId: string, settings: any) => async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
        const state = getState();
        const token = state.auth.user?.token;
        if (!token) return;

        // Assuming backend accepts partial updates to profile including settings
        // If not, this might need a specific endpoint
        await api.put('/business/profile', { ecommerceSettings: settings }, getConfig(token));
        dispatch(updateTenantEcommerce(settings));
    } catch (err) {
        console.error('Failed to update ecommerce settings:', err);
    }
};

/**
 * Activate ecommerce for a tenant
 */
export const activateEcommerce = (tenantId: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
        const state = getState();
        const token = state.auth.user?.token;
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

        if (DATA_MODE === 'DEMO') {
            dispatch(setEcommerceEnabled({ tenantId, config: ecommerceConfig }));
            return;
        }

        await api.put('/business/profile', { ecommerceConfig }, getConfig(token));
        dispatch(setEcommerceEnabled({ tenantId, config: ecommerceConfig }));
    } catch (err) {
        console.error('Failed to activate ecommerce:', err);
    }
};

