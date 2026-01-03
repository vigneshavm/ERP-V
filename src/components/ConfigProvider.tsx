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
        // 1. LocalStorage (User Preference)
        // 2. Tenant Default (Branding)
        // 3. Fallback (Light)
        const storedTheme = getStoredTheme();
        const effectiveTheme: Theme = storedTheme || activeTenant?.theme || 'light';

        applyTheme(effectiveTheme);

        // Apply Primary Color
        if (activeTenant?.primaryColor) {
            const palette = generatePalette(activeTenant.primaryColor);
            Object.entries(palette).forEach(([shade, rgbValues]) => {
                root.style.setProperty(`--color-brand-${shade}`, rgbValues);
            });
        }
    }, [config, activeTenant?.theme, activeTenant?.primaryColor]);

    // Compute effective theme for context
    const effectiveTheme = getStoredTheme() || activeTenant?.theme || 'light';

    const contextValue = useMemo(() => ({
        ...config,
        tenantId: activeTenant?.id,
        theme: effectiveTheme
    }), [config, activeTenant?.id, effectiveTheme]);

    return (
        <ConfigContext.Provider value={contextValue}>
            {children}
        </ConfigContext.Provider>
    );
};
