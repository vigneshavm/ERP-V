import { Button } from "@repo/ui";

export default function Home() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-indigo-600">Business Finance Dashboard</h1>
        <p className="text-gray-600">Invoicing, revenue tracking, and cash flow for your business.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
