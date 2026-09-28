import React from 'react';
import { SalesDimensionReport, SalesDimensionConfig } from './analytics/SalesDimensionReport';

/** Billing Counter-Wise Sales: bills and sales per billing counter (the POS till a bill was paid at). */
const CONFIG: SalesDimensionConfig = {
    reportId: 'counter-wise-sales',
    dim: 'counter',
    label: 'Counter',
    countLabel: 'Bills',
    hasItems: false,
    note: 'Billing counter = the till the bill was paid at (counter name, else system name). Sales = bill net totals.',
};

const CounterWiseSalesReport: React.FC = () => <SalesDimensionReport config={CONFIG} />;

export default CounterWiseSalesReport;
