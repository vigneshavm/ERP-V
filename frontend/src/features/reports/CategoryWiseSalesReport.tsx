import React from 'react';
import { SalesDimensionReport, SalesDimensionConfig } from './analytics/SalesDimensionReport';

const CONFIG: SalesDimensionConfig = {
    reportId: 'category-wise-sales',
    dim: 'category',
    label: 'Category',
    countLabel: 'Sale lines',
    hasItems: true,
    note: 'Sales = net line amounts by product group (the top 50 categories are listed).',
};

/** Category-Wise Sales: sales and pieces by category for the selected period. */
const CategoryWiseSalesReport: React.FC = () => <SalesDimensionReport config={CONFIG} />;

export default CategoryWiseSalesReport;
