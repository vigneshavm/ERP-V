
import { createContext, useContext } from 'react';

export interface ConfigContextType {
    currency: string;
    currencySymbol: string;
    dateFormat: string;
    tenantId?: string;
    theme?: 'light' | 'dark' | 'system';
    primaryColor?: string;
    logoUrl?: string;
}

export const ConfigContext = createContext<ConfigContextType>({
    currency: 'USD',
    currencySymbol: '$',
    dateFormat: 'MM/DD/YYYY'
});

export const useConfig = () => useContext(ConfigContext);
