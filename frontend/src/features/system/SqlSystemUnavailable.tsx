const SqlSystemUnavailable = () => (
  <main className="min-h-full bg-app p-8 text-main">
    <section className="mx-auto max-w-2xl rounded-xl border border-warning/30 bg-surface p-8">
      <h1 className="text-2xl font-bold">This system workflow is unavailable in SQL-only mode</h1>
      <p className="mt-3 text-secondary">
        The existing SQL routes cover authentication, selected user and organization fields, supported Textilesoft masters, and discount limits. This screen’s settings, audit, tenant, sync or restore fields do not have a verified SQL mapping.
      </p>
      <p className="mt-2 text-secondary">No setting or administrative record was changed.</p>
    </section>
  </main>
);

export default SqlSystemUnavailable;
