import React from 'react';
import Layout from '../../components/shared/Layout';
import ReturnsAuditReport from '../reports/returns/ReturnsAuditReport';

/**
 * Billing › Returns: the Returns & Refund Audit report (live ERP returns with rule-based risk flags). It replaced
 * POSReturnsIntelligence, which fell back to six hardcoded returns whenever the API failed or had no data.
 */
const POSReturnsPage: React.FC = () => <Layout><ReturnsAuditReport /></Layout>;

export default POSReturnsPage;
