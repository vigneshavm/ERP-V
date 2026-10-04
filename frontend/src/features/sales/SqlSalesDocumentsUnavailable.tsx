import { Link } from "react-router-dom";

const SqlSalesDocumentsUnavailable = () => (
  <main className="min-h-full bg-app p-8 text-main">
    <section className="mx-auto max-w-2xl rounded-xl border border-warning/30 bg-surface p-8">
      <h1 className="text-2xl font-bold">Estimates, orders, and challans are unavailable</h1>
      <p className="mt-3 text-secondary">
        Existing SQL tables are present, but these workflows have no verified customer/item links or complete invoice-conversion and partial-fulfillment lifecycle. The tables currently have no records, and the old routes are not enabled in SQL-only mode.
      </p>
      <p className="mt-2 text-secondary">
        No estimate, order, or challan was saved. Use POS for supported counter billing.
      </p>
      <div className="mt-6 flex gap-3">
        <Link className="rounded-md bg-primary px-4 py-2 text-white" to="/pos">Open POS Billing</Link>
        <Link className="rounded-md border border-default/40 px-4 py-2 text-main" to="/sales/invoices">Back to Sales Invoices</Link>
      </div>
    </section>
  </main>
);

export default SqlSalesDocumentsUnavailable;
