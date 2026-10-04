import { Link } from "react-router-dom";

const SqlSalesReturnsUnavailable = () => (
  <main className="min-h-full bg-app p-8 text-main">
    <section className="mx-auto max-w-2xl rounded-xl border border-warning/30 bg-surface p-8">
      <h1 className="text-2xl font-bold">Sales returns are unavailable</h1>
      <p className="mt-3 text-secondary">
        The existing SQL database has no verified return-allocation table. Return history and source-line quantity checks cannot be represented safely, so this screen cannot create or delete return records.
      </p>
      <p className="mt-2 text-secondary">
        POS return mode also fails closed until compatible allocation storage is already available. No SQL schema changes were made.
      </p>
      <Link className="mt-6 inline-flex rounded-md border border-default/40 px-4 py-2 text-main" to="/sales/invoices">
        Back to Sales Invoices
      </Link>
    </section>
  </main>
);

export default SqlSalesReturnsUnavailable;
