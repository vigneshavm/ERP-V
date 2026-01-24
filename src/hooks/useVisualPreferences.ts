import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import { setUserPreferences } from '../store';
import { getTable, DATA_MODE } from '../services/dataSource';

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

        // Real-time - Only enabled in DB mode
        let userVisualChannel: any;
        if (DATA_MODE === 'DB' && supabase) {
            userVisualChannel = supabase
                .channel(`public:tenant_user_visual_identity:${userId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'tenant_user_visual_identity',
                    filter: `user_id=eq.${userId}`
                }, () => {
                    fetchVisualPrefs();
                })
                .subscribe();
        }

        return () => {
            if (userVisualChannel && supabase) {
                supabase.removeChannel(userVisualChannel);
            }
        };
    }, [dispatch, tenantId, userId]);
};
