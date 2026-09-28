import React from 'react';
import { SalesDimensionReport, SalesDimensionConfig } from './analytics/SalesDimensionReport';

const CONFIG: SalesDimensionConfig = {
    reportId: 'product-wise-sales',
    dim: 'product',
    label: 'Product',
    countLabel: 'Sale lines',
    hasItems: true,
    note: 'Product = product type from the item master (Shirt, T-Shirt, Saree, …). Pick products under Filters to compare a few.',
    multiSelect: true,
};

/** Product-Wise Sales: sales by product type, with a multi-select to compare chosen products. */
const ProductWiseSalesReport: React.FC = () => <SalesDimensionReport config={CONFIG} />;

export default ProductWiseSalesReport;
