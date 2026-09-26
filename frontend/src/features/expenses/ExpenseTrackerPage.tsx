import React from 'react';
import Layout from '../../components/shared/Layout';
import ExpenseAnalysisReport from '../reports/expenses/ExpenseAnalysisReport';

/**
 * Expenses › Tracker: the Expense Analysis report (live ERP expenses, whole shop). It replaced ExpenseIntelligence,
 * whose claimants ("Madhan K.", "Sarah J."), claims and GST figures were hardcoded.
 */
const ExpenseTrackerPage: React.FC = () => <Layout><ExpenseAnalysisReport /></Layout>;

export default ExpenseTrackerPage;
