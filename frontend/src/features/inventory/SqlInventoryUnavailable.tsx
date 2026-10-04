import { Link } from "react-router-dom";

const SqlInventoryUnavailable = () => (
  <main className="min-h-full bg-app p-8 text-main">
    <section className="mx-auto max-w-2xl rounded-xl border border-warning/30 bg-surface p-8">
      <h1 className="text-2xl font-bold">This inventory workflow is unavailable</h1>
      <p className="mt-3 text-secondary">
        The current SQL-only API does not provide a verified read or write contract for this workflow. No inventory change was saved.
      </p>
      <p className="mt-2 text-secondary">
        Item lookup, stock reports, and the Textilesoft product master remain available where their existing SQL fields are mapped.
      </p>
      <div className="mt-6 flex gap-3">
        <Link className="rounded-md bg-primary px-4 py-2 text-white" to="/inventory/products">View Items</Link>
        <Link className="rounded-md border border-default/40 px-4 py-2 text-main" to="/inventory/product-master">Open Product Master</Link>
      </div>
    </section>
  </main>
);

export default SqlInventoryUnavailable;
