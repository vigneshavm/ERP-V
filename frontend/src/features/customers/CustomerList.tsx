import PageHeader from '../../components/shared/Layout/PageHeader';
import SqlOperationPanel from '../../components/shared/SqlOperationPanel';

export default function CustomerList() {
  return <main className="p-6 space-y-5 text-main">
    <PageHeader title="Customers" />
    <p>Search existing customer records, register a customer without points, or change mobile, card or name here. Saving requires existing SQL write permission. Customer-linked sales, payments, statements and loyalty earning/redemption remain unavailable.</p>
    <SqlOperationPanel title="Customer directory and identity" allowedOperations={['customer-lookup', 'customer', 'mobile', 'card', 'name']} />
  </main>;
}
