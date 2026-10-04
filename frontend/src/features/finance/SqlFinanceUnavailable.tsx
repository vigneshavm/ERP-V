const SqlFinanceUnavailable = () => (
  <main className="min-h-full bg-app p-8 text-main">
    <section className="mx-auto max-w-2xl rounded-xl border border-warning/30 bg-surface p-8">
      <h1 className="text-2xl font-bold">Finance and expense operations are unavailable</h1>
      <p className="mt-3 text-secondary">
        The existing SQL connection exposes read-only cash, cheque, daily-finance and report data. It does not provide verified account, payment, reconciliation, journal, loan, petty-cash, or expense-entry lifecycles for this screen.
      </p>
      <p className="mt-2 text-secondary">No finance or expense transaction was saved.</p>
    </section>
  </main>
);

export default SqlFinanceUnavailable;
