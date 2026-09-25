import React from 'react';
import { SalesDimensionReport, SalesDimensionConfig } from './analytics/SalesDimensionReport';

/**
 * Sales Counter-Wise Sales: product sales grouped by sales-floor counter, which is different from the billing till.
 * From the counters set under Settings → Master Data → Sales Counter (by product type), else the salesman/counter
 * code on each sale line. ERP POS bills have no sales counter, so from the ERP they're grouped by billing counter.
 */
const CONFIG: SalesDimensionConfig = {
    reportId: 'sales-counter-wise-sales',
    dim: 'salesCounter',
    label: 'Sales counter',
    countLabel: 'Sale lines',
    hasItems: true,
    note: 'Sales counter = the sales-floor counter the product was sold from (not the billing till).',
};

const SalesCounterWiseSalesReport: React.FC = () => <SalesDimensionReport config={CONFIG} />;

export default SalesCounterWiseSalesReport;
