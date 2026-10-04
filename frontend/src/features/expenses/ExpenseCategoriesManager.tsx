import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/shared/Layout/index';

const ExpenseCategoriesManager: React.FC = () => (
  <Layout>
    <section className="p-6 space-y-4 text-main">
      <h1 className="text-2xl font-bold">Expense groups and names</h1>
      <p>Manage expense groups and their linked expense names in Master Data, under Expenses. English and Tamil names and print names use the existing shop records.</p>
      <p role="status">Monthly budgets, approval policies, GST eligibility and category deactivation are unavailable in the existing expense master tables.</p>
      <Link className="inline-block rounded-md bg-primary px-4 py-2 text-white" to="/settings/master-data">Open Master Data</Link>
    </section>
  </Layout>
);
export default ExpenseCategoriesManager;
