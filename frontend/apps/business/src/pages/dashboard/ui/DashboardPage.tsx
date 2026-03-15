import { Button } from "@repo/ui";

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600">Business Finance Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-0">Invoicing, revenue tracking, and cash flow for your business.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <section className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-2">Invoicing</h2>
          <p className="text-gray-500 mb-4">Create and manage client invoices.</p>
          <Button className="bg-indigo-600 hover:bg-indigo-700">New Invoice</Button>
        </section>

        <section className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-2">Revenue</h2>
          <p className="text-gray-500 mb-4">Track your business income streams.</p>
          <Button className="bg-indigo-600 hover:bg-indigo-700">Analytics</Button>
        </section>

        <section className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-2">Cash Flow</h2>
          <p className="text-gray-500 mb-4">Forecast your business liquidity.</p>
          <Button className="bg-indigo-600 hover:bg-indigo-700">View Forecast</Button>
        </section>
      </div>
    </div>
  );
}
