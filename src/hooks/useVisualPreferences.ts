import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import { setUserPreferences } from '../store';

export const useVisualPreferences = (tenantId: string | undefined, userId: string | undefined) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!supabase || !tenantId || !userId) return;

        const fetchVisualPrefs = async () => {
            const { data: userVisual, error: userVisualError } = await supabase
                .from('tenant_user_visual_identity')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('user_id', userId)
                .maybeSingle();

            if (!userVisualError && userVisual) {
                dispatch(setUserPreferences({
                    theme: userVisual.theme,
                    primaryColor: userVisual.primary_color,
                    loginLogoUrl: userVisual.login_logo_url,
                    visualIdentityConfig: userVisual.visual_identity_config
                }));
            }
        };

        fetchVisualPrefs();

        // Real-time
        const userVisualChannel = supabase
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

        return () => {
            supabase.removeChannel(userVisualChannel);
        };
    }, [dispatch, tenantId, userId]);
};
