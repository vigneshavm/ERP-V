import { Link } from "react-router-dom";

const SqlSalesReceivablesUnavailable = () => (
  <main className="min-h-full bg-app p-8 text-main">
    <section className="mx-auto max-w-2xl rounded-xl border border-warning/30 bg-surface p-8">
      <h1 className="text-2xl font-bold">Customer receipts and credit are unavailable</h1>
      <p className="mt-3 text-secondary">
        The SQL customer key is not verified for bill allocation. Existing receipt data stores invoice allocations as JSON without declared customer, invoice, or account links, and the current receipt workflow still depends on Mongo customer, invoice, and bank records.
      </p>
      <p className="mt-2 text-secondary">
        MRP-pending state and finalization are also not verified against the existing SQL bill fields. No receipt, credit, due adjustment, or MRP change was saved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link className="rounded-md bg-primary px-4 py-2 text-white" to="/pos">Open POS Billing</Link>
        <Link className="rounded-md border border-default/40 px-4 py-2 text-main" to="/sales/invoices">View Sales Invoices</Link>
      </div>
    </section>
  </main>
);

export default SqlSalesReceivablesUnavailable;
