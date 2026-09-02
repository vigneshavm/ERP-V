import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Tenant } from "../types/tenant";

import { generatePalette } from "../utils/colorUtils";
import { getStoredTheme, applyTheme, Theme } from "../utils/theme";
import { ConfigContext, useConfig } from './ConfigContext';
export { useConfig };

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
        // 2. LocalStorage (Explicit override)
        // 3. Tenant Default (Branding)
        // 4. Fallback (Light)
        const storedTheme = getStoredTheme();
        const effectiveTheme: Theme = (userPreferences?.theme as Theme) || (storedTheme as Theme) || (activeTenant?.theme as Theme) || 'light';

        applyTheme(effectiveTheme);

        // Listen for system theme changes if in system mode
        if (effectiveTheme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme('system');
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }

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
    const effectiveTheme: Theme = (userPreferences?.theme as Theme) || (storedTheme as Theme) || (activeTenant?.theme as Theme) || 'light';
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
