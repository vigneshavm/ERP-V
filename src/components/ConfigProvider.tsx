import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Tenant } from '../types/tenant';

import { generatePalette } from '../utils/colorUtils';
import { getStoredTheme, setStoredTheme, applyTheme, Theme } from '../utils/theme';
import { ConfigContext } from './ConfigContext';

interface ConfigProviderProps {
    tenant: Tenant | null;
    children: React.ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ tenant: propTenant, children }) => {
    // Try to find the up-to-date tenant from Redux store
    const storeTenant = useSelector((state: RootState) =>
        state.tenant.tenants.find(t => t.id === propTenant?.id)
    );

    // Use store tenant if active, otherwise fallback to prop (e.g. for Demo)
    const activeTenant = storeTenant || propTenant;
    const userPreferences = useSelector((state: RootState) => state.auth.userPreferences);

    const config = useMemo(() => activeTenant?.region || {
        currency: 'USD',
        currencySymbol: '$',
        dateFormat: 'MM/DD/YYYY'
    }, [activeTenant?.region]);

    useEffect(() => {
        const root = document.documentElement;
        // Set CSS variables
        root.style.setProperty('--currency-symbol', `"${config.currencySymbol}"`);
        root.style.setProperty('--date-format', `"${config.dateFormat}"`);
        root.style.setProperty('--currency-code', config.currency);

        // Apply Theme Strategy:
        // 1. User specific preference (Redux)
        // 2. LocalStorage (Legacy/Explicit)
        // 3. Tenant Default (Branding)
        // 4. Fallback (Light)
        const storedTheme = getStoredTheme();
        const userTheme = userPreferences?.theme === 'system' ? undefined : userPreferences?.theme;
        const effectiveTheme: Theme = (userTheme as Theme) || (storedTheme as Theme) || activeTenant?.theme || 'light';

        applyTheme(effectiveTheme);

        // Apply Primary Color Strategy: User -> Tenant
        const effectiveColor = userPreferences?.primaryColor || activeTenant?.primaryColor;
        if (effectiveColor) {
            const palette = generatePalette(effectiveColor);
            Object.entries(palette).forEach(([shade, rgbValues]) => {
                root.style.setProperty(`--color-brand-${shade}`, rgbValues);
            });
        }
    }, [config, activeTenant?.theme, activeTenant?.primaryColor, activeTenant?.id, userPreferences]);

    // Compute effective visual settings for context
    const storedTheme = getStoredTheme();
    const userTheme = userPreferences?.theme === 'system' ? undefined : userPreferences?.theme;
    const effectiveTheme = (userTheme as 'light' | 'dark') || storedTheme || activeTenant?.theme || 'light';
    const effectiveColor = userPreferences?.primaryColor || activeTenant?.primaryColor;
    const effectiveLogo = userPreferences?.loginLogoUrl || activeTenant?.loginLogoUrl;

    const contextValue = useMemo(() => ({
        ...config,
        tenantId: activeTenant?.id,
        theme: effectiveTheme,
        primaryColor: effectiveColor,
        logoUrl: effectiveLogo
    }), [config, activeTenant?.id, effectiveTheme, effectiveColor, effectiveLogo]);

    return (
        <ConfigContext.Provider value={contextValue}>
            {children}
        </ConfigContext.Provider>
    );
};
