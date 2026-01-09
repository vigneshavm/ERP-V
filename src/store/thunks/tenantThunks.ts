import { AppDispatch } from '../index';
import { supabase } from '../../lib/supabase';
import { setAuthLoading, setAuthError, setAuthSuccess } from '../authSlice';
import { updateTenantEcommerce, updateGoogleBusinessProfile } from '../tenantSlice';
import { GoogleBusinessConfig } from '../../types/tenant';

export const updateUserPassword = (newPassword: string) => async (dispatch: AppDispatch) => {
    dispatch(setAuthLoading(true));
    dispatch(setAuthError(null));
    dispatch(setAuthSuccess(false));

    try {
        const { data, error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            console.error('Supabase Password Update Error:', error);
            throw error;
        }

        if (data.user) {
            const { data: syncData, error: syncError } = await supabase.rpc('sync_tenant_user_password', {
                p_user_id: data.user.id,
                p_email: data.user.email,
                p_new_password: newPassword
            });

            if (syncError) {
                console.error('Terminal Password Sync Error:', syncError);
                throw new Error(`Auth updated, but terminal synchronization failed: ${syncError.message}`);
            }
        }

        dispatch(setAuthSuccess(true));
    } catch (err: any) {
        console.error('Catching Auth Error:', err);
        let message = err.message || 'Failed to update password';
        if (err.status === 422) {
            message = `Update Rejected: ${err.message}. (Common causes: New password same as old, or link already used)`;
        }
        dispatch(setAuthError(message));
    } finally {
        dispatch(setAuthLoading(false));
    }
};

export const activateEcommerce = (tenantId: string) => async (dispatch: AppDispatch) => {
    try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('init_tenant_ecommerce', { p_tenant_id: tenantId });
        if (rpcError) throw rpcError;

        const { data: config, error: configError } = await supabase
            .from('tenant_ecommerce')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

        if (configError) throw configError;

        const normalizedConfig: any = {
            id: config.id,
            tenantId: config.tenant_id,
            isEnabled: config.is_enabled,
            plan: config.plan,
            trialEndsAt: config.trial_ends_at,
            domain: config.domain,
            theme: config.theme,
            paymentGatewayEnabled: config.payment_gateway_enabled,
            customerPortalEnabled: config.customer_portal_enabled,
            orderManagementEnabled: config.order_management_enabled
        };

        dispatch(updateTenantEcommerce({ tenantId, config: normalizedConfig }));
        return { success: true, data: normalizedConfig };
    } catch (err: any) {
        console.error('Activate Ecommerce Error:', err);
        return { success: false, error: err.message };
    }
};

export const upgradeEcommercePlan = (tenantId: string, plan: any) => async (dispatch: AppDispatch) => {
    try {
        const featureUpdates: any = { plan };
        if (plan === 'PROFESSIONAL' || plan === 'ENTERPRISE') {
            featureUpdates.payment_gateway_enabled = true;
            featureUpdates.customer_portal_enabled = true;
        }

        const { data, error } = await supabase
            .from('tenant_ecommerce')
            .update(featureUpdates)
            .eq('tenant_id', tenantId)
            .select()
            .single();

        if (error) throw error;

        const normalizedConfig: any = {
            id: data.id,
            tenantId: data.tenant_id,
            isEnabled: data.is_enabled,
            plan: data.plan,
            trialEndsAt: data.trial_ends_at,
            domain: data.domain,
            theme: data.theme,
            paymentGatewayEnabled: data.payment_gateway_enabled,
            customerPortalEnabled: data.customer_portal_enabled,
            orderManagementEnabled: data.order_management_enabled
        };

        dispatch(updateTenantEcommerce({ tenantId, config: normalizedConfig }));
        return { success: true, data: normalizedConfig };
    } catch (err: any) {
        console.error('Upgrade Ecommerce Plan Error:', err);
        return { success: false, error: err.message };
    }
};

export const syncGoogleProfile = (tenantId: string) => async (dispatch: AppDispatch) => {
    try {
        const mockConfig: GoogleBusinessConfig = {
            id: 'gbp-1',
            tenantId,
            isConnected: true,
            businessName: 'My Global Store',
            address: '123 Fashion Street, New York, NY 10001',
            phone: '+1 212-555-0198',
            email: 'contact@globalstore.com',
            website: 'https://globalstore.com',
            category: 'Clothing Store',
            description: 'Your one-stop shop for global fashion trends and premium quality apparel.',
            verificationStatus: 'VERIFIED',
            lastSyncAt: new Date().toISOString(),
            completeness: 85,
            metrics: [
                { name: 'Profile Views', value: 1240, description: 'How many saw the profile' },
                { name: 'Phone Calls', value: 45, description: 'Calls from Google' },
                { name: 'Direction Requests', value: 89, description: 'Navigation clicks' },
                { name: 'Website Clicks', value: 210, description: 'Website visits' }
            ],
            hours: [
                { day: 'Monday', open: '09:00', close: '20:00', isClosed: false },
                { day: 'Tuesday', open: '09:00', close: '20:00', isClosed: false },
                { day: 'Wednesday', open: '09:00', close: '20:00', isClosed: false },
                { day: 'Thursday', open: '09:00', close: '20:00', isClosed: false },
                { day: 'Friday', open: '09:00', close: '21:00', isClosed: false },
                { day: 'Saturday', open: '10:00', close: '21:00', isClosed: false },
                { day: 'Sunday', open: '10:00', close: '18:00', isClosed: false }
            ],
            photos: [
                { id: 'logo-1', url: 'https://images.unsplash.com/photo-1541339907198-e08756eaa93e?w=800', type: 'LOGO', isSynced: true },
                { id: 'cover-1', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200', type: 'COVER', isSynced: true }
            ],
            posts: [
                { id: 'post-1', content: 'Huge Summer Sale! Get 50% off on all items.', type: 'OFFER', publishedAt: new Date().toISOString(), status: 'LIVE' }
            ]
        };

        dispatch(updateGoogleBusinessProfile({ tenantId, config: mockConfig }));
        return { success: true, data: mockConfig };
    } catch (err: any) {
        console.error('Sync Google Profile Error:', err);
        return { success: false, error: err.message };
    }
};
