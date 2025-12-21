import React, { createContext, useContext, useEffect } from 'react';
import { Tenant } from '../types';

interface ConfigContextType {
    currency: string;
    currencySymbol: string;
    dateFormat: string;
}

const ConfigContext = createContext<ConfigContextType>({
    currency: 'USD',
    currencySymbol: '$',
    dateFormat: 'MM/DD/YYYY'
});

export const useConfig = () => useContext(ConfigContext);

interface ConfigProviderProps {
    tenant: Tenant | null;
    children: React.ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ tenant, children }) => {
    const config = tenant?.region || {
        currency: 'USD',
        currencySymbol: '$',
        dateFormat: 'MM/DD/YYYY'
    };

    useEffect(() => {
        const root = document.documentElement;
        // Set CSS variables for global styling access if needed
        root.style.setProperty('--currency-symbol', `"${config.currencySymbol}"`);
        root.style.setProperty('--date-format', `"${config.dateFormat}"`);
        root.style.setProperty('--currency-code', config.currency);
    }, [config]);

    return (
        <ConfigContext.Provider value={config}>
            {children}
        </ConfigContext.Provider>
    );
};