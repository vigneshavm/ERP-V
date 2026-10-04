import { TEXTILESOFT_FEATURES } from "../../../config/textilesoftMenu";
import ModuleRenderer from "./ModuleRenderer";
import React, { Suspense } from "react";
import LegacyCoverageNotice, { LegacyCoverageReview } from "./LegacyCoverageNotice";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { LazyModules } from "../../../services/ModuleRegistry";
import SqlSalesReturnsUnavailable from "../../../features/sales/returns/SqlSalesReturnsUnavailable";
import SqlSalesDocumentsUnavailable from "../../../features/sales/SqlSalesDocumentsUnavailable";
import SqlSalesReceivablesUnavailable from "../../../features/sales/SqlSalesReceivablesUnavailable";
import SqlInventoryUnavailable from "../../../features/inventory/SqlInventoryUnavailable";
import SqlPurchaseUnavailable from "../../../features/purchase/SqlPurchaseUnavailable";
import GrnEntry from "../../../features/purchase/GrnEntry";
import SqlPurchaseDetails from "../../../features/purchase/SqlPurchaseDetails";
import SqlPartiesUnavailable from "../../../features/customers/SqlPartiesUnavailable";
import SqlFinanceUnavailable from "../../../features/finance/SqlFinanceUnavailable";
import SqlHrUnavailable from "../../../features/employees/SqlHrUnavailable";
import SqlSystemUnavailable from "../../../features/system/SqlSystemUnavailable";

const SalesInvoiceEntryUnavailable = () => (
  <main className="min-h-full bg-app p-8 text-main">
    <section className="mx-auto max-w-2xl rounded-xl border border-warning/30 bg-surface p-8">
      <h1 className="text-2xl font-bold">Sales invoice entry is unavailable</h1>
      <p className="mt-3 text-secondary">
        This free-form invoice workflow needs customer-linked dues and invoice fields that the existing SQL bill tables do not support through the POS contract. No invoice was created.
      </p>
      <p className="mt-2 text-secondary">
        For supported counter sales, use POS billing. Customer credit and payment allocation are not available there.
      </p>
      <div className="mt-6 flex gap-3">
        <Link className="rounded-md bg-primary px-4 py-2 text-white" to="/pos">Open POS Billing</Link>
        <Link className="rounded-md border border-default/40 px-4 py-2 text-main" to="/sales/register">Back to Sales Register</Link>
      </div>
    </section>
  </main>
);

interface RouteDefinitionsProps {
  renderContent: () => React.ReactNode;
}

const RouteDefinitions: React.FC<RouteDefinitionsProps> = ({
  renderContent,
}) => {
  return (
    <>
    <LegacyCoverageNotice />
    <Routes>
      {TEXTILESOFT_FEATURES.map(feature => <Route key={feature.id} path={feature.path} element={<ModuleRenderer key={feature.id} activeTab={feature.id} />} />)}
      <Route path="/reports/textilesoft/supplier-view" element={<Navigate to="/suppliers/supplier-view" replace />} />
      <Route path="/settings/legacy-operations" element={<Navigate to="/customers" replace />} />
      <Route path="/suppliers/agents" element={<Suspense fallback={<div>Loading Agents…</div>}><LazyModules.Agents /></Suspense>} />
      <Route path="/reports/missing-sales" element={<Suspense fallback={<div>Loading Missing Sales…</div>}><LazyModules.MissingSalesReport /></Suspense>} />
      <Route path="/settings/legacy-coverage" element={<LegacyCoverageReview />} />
      <Route path="/" element={renderContent()} />
      {/* ─── MODULE ROOT REDIRECTS ──────────────────────────────────
                 Navigating to /sales, /purchase, etc. redirects to the
                 module's primary landing sub-route instead of falling through
                 to the "Module Locked" wildcard page.
            ──────────────────────────────────────────────────────────────── */}
      <Route
        path="/sales"
        element={<Navigate to="/sales/invoices" replace />}
      />
      <Route
        path="/purchase"
        element={<Navigate to="/purchase/register" replace />}
      />
      <Route
        path="/inventory"
        element={<Navigate to="/inventory/products" replace />}
      />
      {/* Finance lands on the Cash & Bank overview (live cash, bank, loans, cheques, overdue bills). */}
      <Route
        path="/finance"
        element={<Navigate to="/finance/overview" replace />}
      />
      <Route
        path="/expenses"
        element={<Navigate to="/expenses/tracker" replace />}
      />
      {/* "/customers" is the Customers > Directory menu path (CUSTOMER_LIST). Rendered directly
                 (not via renderContent) because useTabSync resolves
                 "/customers" to the group id CUSTOMERS, which ModuleRenderer has no case for. */}
      <Route
        path="/customers"
        element={<Suspense fallback={<div>Loading Customers…</div>}><LazyModules.CustomerList /></Suspense>}
      />
      <Route
        path="/marketing"
        element={<Navigate to="/?tab=GROW_MARKETING" replace />}
      />
      {/* Reports landing: the report catalog (every report reads live data). */}
      <Route
        path="/reports"
        element={<Navigate to="/reports/insights" replace />}
      />
      <Route path="/pos/terminal" element={<Navigate to="/pos" replace />} />
      <Route
        path="/people"
        element={<Navigate to="/people/employees/labor" replace />}
      />
      <Route
        path="/staff"
        element={<Navigate to="/people/employees/staff" replace />}
      />
      <Route
        path="/grow"
        element={<Navigate to="/?tab=GROW_DASHBOARD" replace />}
      />
      <Route path="/system" element={<Navigate to="/settings" replace />} />
      <Route
        path="/engagement"
        element={<Navigate to="/?tab=GROW_ENGAGEMENT" replace />}
      />

      {/* SALES ROUTES */}
      <Route
        path="/sales/new"
        element={<SalesInvoiceEntryUnavailable />}
      />
      <Route
        path="/sales/invoice/create"
        element={<Navigate to="/sales/new" replace />}
      />
      <Route
        path="/sales/invoice/:id"
        element={
          <Suspense fallback={<div>Loading Invoice...</div>}>
            <LazyModules.SalesInvoiceDetail />
          </Suspense>
        }
      />
      <Route
        path="/sales/invoices"
        element={
          <Suspense fallback={<div>Loading Invoice Register...</div>}>
            <LazyModules.SalesInvoiceRegister />
          </Suspense>
        }
      />
      <Route
        path="/sales/orders"
        element={<SqlSalesDocumentsUnavailable />}
      />
      <Route
        path="/sales/orders/new"
        element={<SqlSalesDocumentsUnavailable />}
      />
      <Route
        path="/sales/orders/:id"
        element={<SqlSalesDocumentsUnavailable />}
      />
      <Route
        path="/sales/estimates"
        element={<SqlSalesDocumentsUnavailable />}
      />
      <Route
        path="/sales/estimates/new"
        element={<SqlSalesDocumentsUnavailable />}
      />
      <Route
        path="/sales/challans"
        element={<SqlSalesDocumentsUnavailable />}
      />
      <Route
        path="/sales/challans/new"
        element={<SqlSalesDocumentsUnavailable />}
      />
      <Route
        path="/sales/challans/:id"
        element={<SqlSalesDocumentsUnavailable />}
      />
      {/* Compatibility routes */}
      <Route
        path="/sales/delivery-challan"
        element={<SqlSalesDocumentsUnavailable />}
      />
      <Route
        path="/sales/delivery-challan/:id"
        element={<SqlSalesDocumentsUnavailable />}
      />
      <Route
        path="/sales/delivery-challan-list"
        element={<SqlSalesDocumentsUnavailable />}
      />
      <Route
        path="/sales/returns/new"
        element={<SqlSalesReturnsUnavailable />}
      />
      <Route
        path="/sales/returns"
        element={<SqlSalesReturnsUnavailable />}
      />
      <Route
        path="/sales/payments"
        element={<SqlSalesReceivablesUnavailable />}
      />
      <Route
        path="/sales/payments/new"
        element={<SqlSalesReceivablesUnavailable />}
      />
      <Route
        path="/sales/outstanding"
        element={<SqlSalesReceivablesUnavailable />}
      />
      <Route
        path="/sales/dues"
        element={<SqlSalesReceivablesUnavailable />}
      />
      <Route
        path="/sales/credits"
        element={<SqlSalesReceivablesUnavailable />}
      />
      <Route
        path="/sales/mrp-pending"
        element={<SqlSalesReceivablesUnavailable />}
      />
      <Route path="/suppliers" element={<SqlPartiesUnavailable />} />
      <Route path="/suppliers/*" element={<SqlPartiesUnavailable />} />
      <Route
        path="/purchase/grn/new"
        element={<GrnEntry />}
      />
      <Route
        path="/purchase/grn/new/:poId"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/grn/view/:id"
        element={<SqlPurchaseDetails />}
      />
      {/* Static PO paths must be declared explicitly: otherwise "/purchase/orders/:id" below
                 swallows them (e.g. "/purchase/orders/list" rendered PurchaseOrdersModule with
                 id="list" and tried to fetch an order called "list"). Both go through ModuleRenderer,
                 where useTabSync maps them to PURCHASE_ORDER / PURCHASE_ORDER_LIST -> list view. */}
      <Route path="/purchase/orders" element={<SqlPurchaseUnavailable />} />
      <Route path="/purchase/orders/list" element={<SqlPurchaseUnavailable />} />
      <Route path="/purchase/orders/new" element={<SqlPurchaseUnavailable />} />
      <Route
        path="/purchase/orders/:id"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/register"
        element={
          <Suspense fallback={<div>Loading Register...</div>}>
            <LazyModules.PurchaseRegister />
          </Suspense>
        }
      />
      <Route
        path="/purchase/new"
        element={<GrnEntry />}
      />
      <Route
        path="/purchase/express"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/bills"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/bills/new"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/bills/create"
        element={<Navigate to="/purchase/bills/new" replace />}
      />
      <Route
        path="/purchase/bills/new/:grnId"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/bills/view/:id"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/returns"
        element={
          <Suspense fallback={<div>Loading Returns...</div>}>
            <LazyModules.PurchaseReturns />
          </Suspense>
        }
      />
      <Route
        path="/purchase/returns/new"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/returns/new/:grnId"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/returns/view/:id"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/ageing-analysis"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/payments"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/payments/add"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/payment-out"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/snapshot"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/payment-out/:vendorId"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/cheques-vault"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/rate-revisions"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/purchase/rate-revisions/new"
        element={<SqlPurchaseUnavailable />}
      />
      <Route
        path="/growth/tenant-architect/:tenantId"
        element={
          <Suspense fallback={<div>Loading Tenant Architect...</div>}>
            <LazyModules.TenantArchitect />
          </Suspense>
        }
      />
      <Route
        path="/cashbank/accounts"
        element={
          <Suspense fallback={<div>Loading Bank Accounts...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/cashbank/transfers"
        element={
          <Suspense fallback={<div>Loading Transfers...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/cashbank/cash-in-hand"
        element={
          <Suspense fallback={<div>Loading Cash In Hand...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/cashbank/position"
        element={
          <Suspense fallback={<div>Loading Position...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/cashbank/ledger/:id"
        element={
          <Suspense fallback={<div>Loading Ledger...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/finance/journal"
        element={
          <Suspense fallback={<div>Loading Journal Entries...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/finance/journal/new"
        element={
          <Suspense fallback={<div>Loading Journal Form...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/finance/bank-statement"
        element={
          <Suspense fallback={<div>Loading Bank Statements...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/finance/sms-tracker"
        element={
          <Suspense fallback={<div>Loading SMS Tracker...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/finance/budget-tracker"
        element={
          <Suspense fallback={<div>Loading Budget Tracker...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/finance/overview"
        element={
          <Suspense fallback={<div>Loading Overview...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/finance/agents"
        element={<Suspense fallback={<div>Loading Agents…</div>}><LazyModules.Agents /></Suspense>}
      />
      <Route
        path="/finance/goals"
        element={
          <Suspense fallback={<div>Loading Goals...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/inventory/search"
        element={
          <Suspense fallback={<div>Loading Search...</div>}>
            <LazyModules.InventoryVariantSearch />
          </Suspense>
        }
      />
      <Route path="*" element={renderContent()} />
      <Route
        path="/people/employees"
        element={<Navigate to="/people/employees/staff" replace />}
      />
      <Route
        path="/people/employees/labor/*"
        element={<Navigate to="/people/employees/staff" replace />}
      />
      <Route
        path="/people/employees/allowances"
        element={
          <Suspense fallback={<div>Loading Allowances...</div>}>
            <SqlHrUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/people/employees/staff"
        element={
          <Suspense fallback={<div>Loading Staff...</div>}>
            <LazyModules.StaffManager />
          </Suspense>
        }
      />
      <Route
        path="/people/attendance"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <SqlHrUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/people/payroll"
        element={
          <Suspense fallback={<div>Loading Payroll...</div>}>
            <SqlHrUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/people/payroll/structure"
        element={
          <Suspense fallback={<div>Loading Structure...</div>}>
            <SqlHrUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/people/payroll/attendance"
        element={
          <Suspense fallback={<div>Loading Attendance...</div>}>
            <SqlHrUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/people/payroll/run"
        element={
          <Suspense fallback={<div>Loading Runs...</div>}>
            <SqlHrUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/people/payroll/run/:id"
        element={
          <Suspense fallback={<div>Loading Runs...</div>}>
            <SqlHrUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/people/payroll/payslip/:id"
        element={
          <Suspense fallback={<div>Loading Payslip...</div>}>
            <SqlHrUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/people/commission"
        element={
          <Suspense fallback={<div>Loading Commission...</div>}>
            <SqlHrUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/finance/gst"
        element={
          <Suspense fallback={<div>Loading GST...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/inventory/reprint"
        element={<Suspense fallback={<div>Loading Reprint…</div>}><LazyModules.ReprintQueue /></Suspense>}
      />
      <Route
        path="/pos"
        element={
          <Suspense fallback={<div>Loading POS Terminal...</div>}>
            <LazyModules.POSModule />
          </Suspense>
        }
      />
      <Route
        path="/pos/orders"
        element={
          <Suspense fallback={<div>Loading POS Orders...</div>}>
            <LazyModules.POSOrdersIntelligence />
          </Suspense>
        }
      />
      <Route
        path="/pos/returns"
        element={
          <Suspense fallback={<div>Loading POS Returns...</div>}>
            <LazyModules.POSReturnsIntelligence />
          </Suspense>
        }
      />
      <Route
        path="/pos/shifts"
        element={
          <Suspense fallback={<div>Loading Shift Management...</div>}>
            <LazyModules.ShiftManagementIntelligence />
          </Suspense>
        }
      />
      <Route
        path="/pos/cash-drawer"
        element={
          <Suspense fallback={<div>Loading Cash Drawer...</div>}>
            <LazyModules.CashDrawerIntelligence />
          </Suspense>
        }
      />
      <Route
        path="/dashboard/summary"
        element={
          <Suspense fallback={<div>Loading Dashboard...</div>}>
            <LazyModules.FinanceAgentDashboard />
          </Suspense>
        }
      />
      <Route
        path="/expenses/tracker"
        element={
          <Suspense fallback={<div>Loading expenses…</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/expenses/categories"
        element={
          <Suspense fallback={<div>Loading Categories...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/expenses/recurring"
        element={
          <Suspense fallback={<div>Loading Recurring...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/expenses/reports"
        element={
          <Suspense fallback={<div>Loading Reports...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      <Route
        path="/reports/insights"
        element={
          <Suspense fallback={<div>Loading Reports...</div>}>
            <LazyModules.Reports />
          </Suspense>
        }
      />
      <Route
        path="/settings/audit"
        element={<SqlSystemUnavailable />}
      />
      {/* These System sub-pages each have their own real view driven by ModuleRenderer (via
                 renderContent -> Redux activeTab, kept in sync with the URL by useTabSync). Without
                 an explicit route per path here, react-router's "/settings/:tab" fallback below
                 matches ALL of them (it ranks a static segment like "/settings/sync" the same as any
                 other single segment) and always renders the General Settings page instead -- the URL
                 changes but the content silently stays the same. */}
      <Route path="/settings/sync" element={renderContent()} />
      <Route path="/settings/restore" element={renderContent()} />
      <Route path="/settings/tenants" element={renderContent()} />
      <Route path="/settings/architect" element={renderContent()} />
      <Route path="/settings/master-data" element={renderContent()} />
      <Route path="/settings/discount-permissions" element={renderContent()} />
      <Route path="/settings/super-admin" element={renderContent()} />
      <Route
        path="/settings"
        element={<Navigate to="/settings/general" replace />}
      />
      <Route
        path="/settings/:tab"
        element={<SqlSystemUnavailable />}
      />
      {/* INVENTORY — real pages */}
      <Route
        path="/inventory/products"
        element={
          <Suspense fallback={<div>Loading Products...</div>}>
            <LazyModules.InventoryVariantSearch />
          </Suspense>
        }
      />
      <Route
        path="/inventory/items"
        element={
          <Suspense fallback={<div>Loading Items...</div>}>
            <LazyModules.InventoryVariantSearch />
          </Suspense>
        }
      />
      <Route
        path="/inventory/search"
        element={
          <Suspense fallback={<div>Loading Inventory Search...</div>}>
            <LazyModules.InventoryVariantSearch />
          </Suspense>
        }
      />
      <Route
        path="/inventory/categories"
        element={
          <Suspense fallback={<div>Loading Categories...</div>}>
            <LazyModules.CategoriesSql />
          </Suspense>
        }
      />
      <Route
        path="/inventory/product-master"
        element={
          <Suspense fallback={<div>Loading Product Master...</div>}>
            <LazyModules.ProductMaster />
          </Suspense>
        }
      />
      <Route
        path="/inventory/aged-stock"
        element={
          <Suspense fallback={<div>Loading Aged Stock...</div>}>
            <LazyModules.AgedStockManager />
          </Suspense>
        }
      />
      <Route
        path="/inventory/batch-price"
        element={<SqlInventoryUnavailable />}
      />
      <Route path="/inventory/batch-expiry" element={<SqlInventoryUnavailable />} />
      <Route path="/inventory/barcodes" element={<Suspense fallback={<div>Loading Barcodes…</div>}><LazyModules.BarcodeManager /></Suspense>} />
      <Route path="/inventory/combo-offers" element={<SqlInventoryUnavailable />} />
      <Route path="/inventory/serialized-units" element={<SqlInventoryUnavailable />} />
      <Route path="/inventory/write-off" element={<SqlInventoryUnavailable />} />
      <Route path="/inventory/stock-transfer" element={<SqlInventoryUnavailable />} />
      <Route path="/inventory/import" element={<SqlInventoryUnavailable />} />
      <Route path="/inventory/export" element={<SqlInventoryUnavailable />} />
      {/* EXPENSES — daily finance entry */}
      <Route
        path="/expenses/daily"
        element={
          <Suspense fallback={<div>Loading Daily Finance...</div>}>
            <SqlFinanceUnavailable />
          </Suspense>
        }
      />
      {/* Fallback wildcard delegates to dynamic ModuleRenderer */}
      <Route path="/*" element={renderContent()} />
    </Routes>
    </>
  );
};

export default RouteDefinitions;


