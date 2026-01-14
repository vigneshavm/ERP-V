import { AppDispatch, RootState } from '../types';
import { supabase } from '../../lib/supabase';
import { setAuthLoading, setAuthError, setAuthSuccess } from '../authSlice';
import { updateTenantEcommerce, updateGoogleBusinessProfile, setEcommerceEnabled } from '../tenantSlice';
import { DATA_MODE } from '../../services/dataSource';
import { GoogleBusinessConfig } from '../../types/tenant';

export const syncGoogleProfile = (tenantId: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
        // In DEMO mode, provide a mock connected state
        if (DATA_MODE === 'DEMO') {
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
            id: data.id,
            tenantId: data.tenant_id,
            isConnected: data.is_connected ?? true,
            businessName: data.business_name || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            category: data.category || '',
            description: data.description || '',
            verificationStatus: data.verification_status || 'UNVERIFIED',
            lastSyncAt: data.last_sync_at,
            completeness: data.completeness || 0,
            metrics: data.metrics || [],
            hours: data.hours || [],
            photos: data.photos || [],
            posts: data.posts || [],
            reviews: data.reviews || []
        });

        const { data, error } = await supabase
            .from('tenant_google_profiles')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

        if (error) {
            // If no profile exists, create a default one to "Initialize"
            if (error.code === 'PGRST116') {
                const defaultConfig = {
                    tenant_id: tenantId,
                    is_connected: true,
                    business_name: 'New Google Business',
                    verification_status: 'UNVERIFIED',
                    completeness: 0
                };

                const { data: newData, error: insertError } = await supabase
                    .from('tenant_google_profiles')
                    .insert(defaultConfig)
                    .select()
                    .single();

                if (insertError) throw insertError;
                if (newData) {
                    dispatch(updateGoogleBusinessProfile({ tenantId, config: mapProfileToConfig(newData) }));
                }
                return;
            }
            throw error;
        }

        if (data) {
            dispatch(updateGoogleBusinessProfile({ tenantId, config: mapProfileToConfig(data) }));
        }
    } catch (err) {
        console.error('Failed to sync google profile:', err);
    }
};

export const updateEcommerceSettings = (tenantId: string, settings: any) => async (dispatch: AppDispatch) => {
    try {
        const { error } = await supabase
            .from('tenants')
            .update({ ecommerce_settings: settings })
            .eq('id', tenantId);

        if (error) throw error;
        dispatch(updateTenantEcommerce(settings));
    } catch (err) {
        console.error('Failed to update ecommerce settings:', err);
    }
};

/**
 * Activate ecommerce for a tenant
 */
export const activateEcommerce = (tenantId: string) => async (dispatch: AppDispatch) => {
    try {
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

        // In DEMO mode, just update Redux state
        if (DATA_MODE === 'DEMO') {
            dispatch(setEcommerceEnabled({ tenantId, config: ecommerceConfig }));
            return;
        }

        // In DB mode, persist to Supabase
        const { error } = await supabase
            .from('tenants')
            .update({ ecommerce_config: ecommerceConfig })
            .eq('id', tenantId);

        if (error) throw error;
        dispatch(setEcommerceEnabled({ tenantId, config: ecommerceConfig }));
    } catch (err) {
        console.error('Failed to activate ecommerce:', err);
    }
};

