const SqlHrUnavailable = () => (
  <main className="min-h-full bg-app p-8 text-main">
    <section className="mx-auto max-w-2xl rounded-xl border border-warning/30 bg-surface p-8">
      <h1 className="text-2xl font-bold">HR and payroll workflows are unavailable</h1>
      <p className="mt-3 text-secondary">
        The existing SQL employee master has no verified unique key in this database snapshot, and compatible attendance, payroll, payslip, allowance, advance, or payment lifecycles have not been established.
      </p>
      <p className="mt-2 text-secondary">No employee or payroll change was saved.</p>
    </section>
  </main>
);

export default SqlHrUnavailable;
