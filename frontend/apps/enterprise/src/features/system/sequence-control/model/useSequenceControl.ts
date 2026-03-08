import { useState } from 'react';

export interface NumberSeries {
    id: string;
    documentType: string;
    prefix: string;
    suffix: string;
    padding: number;
    currentValue: number;
    branchId: string;
    year: string;
    status: 'ACTIVE' | 'LOCKED';
}

export const useSequenceControl = () => {
    const [series, setSeries] = useState<NumberSeries[]>([
        { id: '1', documentType: 'Invoice', prefix: 'CHN-INV', suffix: '', padding: 6, currentValue: 234, branchId: 'Chennai', year: '2025', status: 'ACTIVE' },
        { id: '2', documentType: 'Bill', prefix: 'MDU-PUR', suffix: '', padding: 6, currentValue: 91, branchId: 'Madurai', year: '2025', status: 'ACTIVE' },
        { id: '3', documentType: 'Payment', prefix: 'CHN-PAY', suffix: '', padding: 6, currentValue: 102, branchId: 'Chennai', year: '2025', status: 'ACTIVE' },
        { id: '4', documentType: 'Journal', prefix: 'JE', suffix: '', padding: 6, currentValue: 778, branchId: 'GLOBAL', year: '2025', status: 'LOCKED' },
    ]);

    const formatNumber = (s: NumberSeries) => {
        const num = s.currentValue.toString().padStart(s.padding, '0');
        return `${s.prefix}-${s.year}-${num}${s.suffix}`;
    };

    return {
        series,
        setSeries,
        formatNumber
    };
};
