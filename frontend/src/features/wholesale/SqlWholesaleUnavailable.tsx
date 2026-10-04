import { Link } from "react-router-dom";

const SqlWholesaleUnavailable = () => (
  <main className="min-h-full bg-app p-8 text-main">
    <section className="mx-auto max-w-2xl rounded-xl border border-warning/30 bg-surface p-8">
      <h1 className="text-2xl font-bold">Wholesale sales are unavailable</h1>
      <p className="mt-3 text-secondary">
        The SQL bill writer does not persist a wholesale channel or use the wholesale rate. Although the existing bill header has a wholesale-status column, the SQL path does not set or filter it, so a bill could be recorded as a regular sale and reports could mix channels.
      </p>
      <p className="mt-2 text-secondary">
        No wholesale sale or report was loaded or saved. Use POS only for supported counter billing.
      </p>
      <div className="mt-6 flex gap-3">
        <Link className="rounded-md bg-primary px-4 py-2 text-white" to="/pos">Open POS Billing</Link>
        <Link className="rounded-md border border-default/40 px-4 py-2 text-main" to="/sales/invoices">View Sales Invoices</Link>
      </div>
    </section>
  </main>
);

export default SqlWholesaleUnavailable;
