import { Link } from "react-router-dom";

const SqlPurchaseUnavailable = () => (
  <main className="min-h-full bg-app p-8 text-main">
    <section className="mx-auto max-w-2xl rounded-xl border border-warning/30 bg-surface p-8">
      <h1 className="text-2xl font-bold">This purchase workflow is unavailable</h1>
      <p className="mt-3 text-secondary">
        The SQL-only app has no verified transaction contract for this workflow. No purchase or payment change was saved.
      </p>
      <p className="mt-2 text-secondary">
        The SQL purchase register remains available for viewing existing GRNs. Purchase entry, returns, payables, and payment effects are limited to verified SQL behavior.
      </p>
      <Link className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-white" to="/purchase/register">
        Open Purchase Register
      </Link>
    </section>
  </main>
);

export default SqlPurchaseUnavailable;
