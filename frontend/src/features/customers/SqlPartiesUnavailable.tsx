import { Link } from 'react-router-dom';
const SqlPartiesUnavailable = () => (
  <main className="min-h-full bg-app p-8 text-main">
    <section className="mx-auto max-w-2xl rounded-xl border border-warning/30 bg-surface p-8">
      <h1 className="text-2xl font-bold">Party-linked workflows have reduced scope</h1>
      <p className="mt-3 text-secondary">
        Customer directory, registration and guarded mobile/card/name forms are on the Customers screen; saving requires existing SQL writer permissions. Supplier editing, customer-linked sales, payments, statements and loyalty operations remain unavailable until their complete existing SQL relationships are verified.
      </p>
      <Link className="mt-3 inline-block underline" to="/customers">Open Customers</Link>
      <p className="mt-2 text-secondary">POS checkout continues as an anonymous sale.</p>
    </section>
  </main>
);

export default SqlPartiesUnavailable;
