import React, { useState } from 'react';
import { FilterSelect } from '../components';
import type { ReportFiltersConfig } from '../components/ReportToolbar';
import { DimensionRow, useShopSales } from './shopSales';

/**
 * Billing-counter filter shared by the Detailed Analytics reports. The choices are the counters that billed
 * in the selected period (the same names the Billing Counter-Wise report shows), and the chosen one is sent
 * to /api/reports/shop-sales as `counter`, so every figure is computed on the server for that counter only.
 */
export function useCounterFilter(from: string, to: string, enabled = true) {
    const [counter, setCounter] = useState('');
    const counters = useShopSales<DimensionRow>('counter', from, to, '', enabled);
    const options = counters.rows.map(r => ({ value: r.name }));

    const field = (
        <FilterSelect label="Billing counter" value={counter} onChange={setCounter} options={options} allLabel="All counters" />
    );

    return {
        counter,
        setCounter,
        field,
        activeCount: counter ? 1 : 0,
        /** Lines for the export's filter summary. */
        summary: counter ? [`Counter: ${counter}`] : [],
        /** Filters panel config when the counter is the report's only filter. */
        filters: { content: field, activeCount: counter ? 1 : 0, onClear: () => setCounter('') } as ReportFiltersConfig,
    };
}

/** Appends "Counter: X only." to a report note while a counter is selected. */
export const withCounter = (note: string, counter: string): string => (counter ? `${note} Counter: ${counter} only.` : note);
