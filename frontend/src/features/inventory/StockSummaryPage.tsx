import React from 'react';
import Layout from '../../components/shared/Layout';
import StockStatusReport from '../reports/StockStatusReport';

/** Inventory › Stock Summary: the live Stock Status report (it replaced the InventoryMockUI demo table). */
const StockSummaryPage: React.FC = () => <Layout><StockStatusReport /></Layout>;

export default StockSummaryPage;
