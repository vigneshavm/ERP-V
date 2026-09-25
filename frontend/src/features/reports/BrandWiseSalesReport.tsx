import React from 'react';
import { SalesDimensionReport, SalesDimensionConfig } from './analytics/SalesDimensionReport';

const CONFIG: SalesDimensionConfig = {
    reportId: 'brand-wise-sales',
    dim: 'brand',
    label: 'Brand',
    countLabel: 'Sale lines',
    hasItems: true,
    note: 'Sales = net line amounts of each brand sold in the period.',
};

/** Brand-Wise Sales: sales and pieces by brand for the selected period. */
const BrandWiseSalesReport: React.FC = () => <SalesDimensionReport config={CONFIG} />;

export default BrandWiseSalesReport;
