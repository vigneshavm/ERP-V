import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
// import { supabase } from '../lib/supabase'; // Removed
import { setUserPreferences } from "@/entities/session/model/authSlice";
import { getTable } from "@/shared/api/dataSource";

export const useVisualPreferences = (tenantId: string | undefined, userId: string | undefined) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!tenantId || !userId) return;

        const fetchVisualPrefs = async () => {
            const data = await getTable('tenant_user_visual_identity', {
                filters: { tenant_id: tenantId, user_id: userId }
            });

            const userVisual = data?.[0];

            if (userVisual) {
                dispatch(setUserPreferences({
                    theme: userVisual.theme,
                    primaryColor: userVisual.primary_color,
                    loginLogoUrl: userVisual.login_logo_url,
                    visualIdentityConfig: userVisual.visual_identity_config
                }));
            }
        };

        fetchVisualPrefs();

        return () => {
            // Cleanup
        };
    }, [dispatch, tenantId, userId]);
};
// End of file
