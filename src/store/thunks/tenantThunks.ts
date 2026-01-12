import { AppDispatch, RootState } from '../types';
import { supabase } from '../../lib/supabase';
import { setAuthLoading, setAuthError, setAuthSuccess } from '../authSlice';
import { updateTenantEcommerce, updateGoogleBusinessProfile, setEcommerceEnabled } from '../tenantSlice';
import { DATA_MODE } from '../../services/dataSource';

export const syncGoogleProfile = (tenantId: string) => async (dispatch: AppDispatch) => {
    try {
        const { data, error } = await supabase
            .from('tenant_google_profiles')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

        if (error) throw error;
        if (data) {
            dispatch(updateGoogleBusinessProfile(data));
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
        const ecommerceConfig = {
            isEnabled: true,
            plan: 'STARTER' as const,
            activatedAt: new Date().toISOString()
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

