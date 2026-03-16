"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { IDataAdapter } from '../IDataAdapter';
import { dataAdapter as defaultAdapter } from '../index';

interface DataContextType {
    adapter: IDataAdapter;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode; adapter?: IDataAdapter }> = ({ 
    children, 
    adapter = defaultAdapter 
}) => {
    return (
        <DataContext.Provider value={{ adapter }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context.adapter;
};
