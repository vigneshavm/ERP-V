import React from 'react';
import Layout from '../../components/shared/Layout';
import LowStockReport from '../reports/LowStockReport';

/** Inventory › Low Stock Alerts: the live Low Stock report (it replaced the InventoryMockUI demo table). */
const LowStockAlertsPage: React.FC = () => <Layout><LowStockReport /></Layout>;

export default LowStockAlertsPage;
