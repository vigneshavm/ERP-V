import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingScreen from './components/shared/Layout/LoadingScreen';
import { useSelector } from 'react-redux';
import { RootState } from './redux/store';
import { ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './contexts/ThemeContext';

// Auth
import LandingPage from './pages/Views/LandingPage';
import { useDBDataSync } from './hooks/useDBDataSync';
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));

// Dashboard & Profile
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const ProfileSettings = lazy(() => import('./pages/System/Settings/ProfileSettings'));

// Customers
const Customers = lazy(() => import('./pages/People/Customers/Customers'));
const AddCustomer = lazy(() => import('./pages/People/Customers/AddCustomer'));
const EditCustomer = lazy(() => import('./pages/People/Customers/EditCustomer'));
const CustomerDetail = lazy(() => import('./pages/People/Customers/CustomerDetail'));
const DueAdjustment = lazy(() => import('./pages/Financial/DueAdjustment'));
const CustomersWithDues = lazy(() => import('./pages/People/Customers/CustomersWithDues'));

// Suppliers
const Suppliers = React.lazy(() => import('./pages/People/Suppliers/Suppliers'));
const AddSupplier = lazy(() => import('./pages/People/Suppliers/AddSupplier'));
const EditSupplier = lazy(() => import('./pages/People/Suppliers/EditSupplier'));
const SupplierDetail = lazy(() => import('./pages/People/Suppliers/SupplierDetail'));
const SupplierGroups = React.lazy(() => import('./pages/People/Suppliers/SupplierGroups'));
const SupplierLedger = React.lazy(() => import('./pages/People/Suppliers/SupplierLedger'));
const SupplierStatements = React.lazy(() => import('./pages/People/Suppliers/SupplierStatements'));

// Inventory
const AddItem = lazy(() => import('./pages/Commercial/Items/AddItem'));
const EditItem = lazy(() => import('./pages/Commercial/Items/EditItem'));
const BatchPriceUpdate = lazy(() => import('./pages/Commercial/Inventory/BatchPriceUpdate'));
const ReprintQueue = lazy(() => import('./pages/Commercial/Inventory/ReprintQueue'));
const InventoryManager = React.lazy(() => import('./pages/Commercial/Inventory/InventoryManager'));
const AgedStockManager = React.lazy(() => import('./pages/Commercial/Inventory/AgedStockManager'));

// POS & Invoices
const POS = lazy(() => import('./pages/Commercial/Pos/POSModule'));
const Invoices = lazy(() => import('./pages/Financial/Invoices/Invoice'));
const InvoiceDetail = lazy(() => import('./pages/Financial/Invoices/InvoiceDetail'));
const POSOrdersIntelligence = lazy(() => import('./pages/Commercial/Pos/POSOrdersIntelligence'));
const POSReturnsIntelligence = lazy(() => import('./pages/Commercial/Pos/POSReturnsIntelligence'));
const ShiftManagementIntelligence = lazy(() => import('./pages/Commercial/Pos/ShiftManagementIntelligence'));

// Sales
const SalesInvoice = React.lazy(() => import('./pages/Commercial/Sales/salesInvoices/SalesInvoice'));
const SalesInvoiceDetail = lazy(() => import('./pages/Commercial/Sales/salesInvoices/SalesInvoiceDetail'));
const Estimate = lazy(() => import('./pages/Commercial/Sales/estimates/Estimate'));
const EstimateList = lazy(() => import('./pages/Commercial/Sales/estimates/EstimateList'));
const EstimateDetail = lazy(() => import('./pages/Commercial/Sales/estimates/EstimateDetail'));
const PaymentIn = lazy(() => import('./pages/Commercial/Sales/payments/PaymentIn'));
const PaymentInList = React.lazy(() => import('./pages/Commercial/Sales/payments/PaymentInList'));
const PaymentReceiptDetail = lazy(() => import('./pages/Commercial/Sales/payments/PaymentReceiptDetail'));
const SalesOrder = lazy(() => import('./pages/Commercial/Sales/salesOrders/SalesOrder'));
const SalesOrderList = lazy(() => import('./pages/Commercial/Sales/salesOrders/SalesOrderList'));
const SalesOrderDetail = lazy(() => import('./pages/Commercial/Sales/salesOrders/SalesOrderDetail'));
const DeliveryChallan = lazy(() => import('./pages/Commercial/Sales/deliveryChallans/DeliveryChallan'));
const DeliveryChallanList = lazy(() => import('./pages/Commercial/Sales/deliveryChallans/DeliveryChallanList'));
const DeliveryChallanDetail = lazy(() => import('./pages/Commercial/Sales/deliveryChallans/DeliveryChallanDetail'));
const Return = lazy(() => import('./pages/Commercial/Sales/returns/Return'));
const ReturnedItems = lazy(() => import('./pages/Commercial/Sales/returns/ReturnedItems'));

// Purchase
const PurchaseEntry = React.lazy(() => import('./pages/Commercial/Purchase/PurchaseEntry'));
const Bills = lazy(() => import('./pages/Commercial/Purchase/Bills'));
const PaymentOut = lazy(() => import('./pages/Commercial/Purchase/PaymentOut'));
const Expenses = lazy(() => import('./pages/Financial/Expenses/ExpensesModule')); // Note: Expenses page reused
const PurchaseOrder = lazy(() => import('./pages/Commercial/Purchase/PurchaseOrdersModule'));
const PurchaseReturn = lazy(() => import('./pages/Commercial/Purchase/PurchaseReturn'));
const SupplierPayments = React.lazy(() => import('./pages/Commercial/Purchase/SupplierPayments'));
const DebitNotes = React.lazy(() => import('./pages/Commercial/Purchase/DebitNotes'));
const GoodsReceived = React.lazy(() => import('./pages/Commercial/Purchase/GoodsReceived'));
const OutstandingPayables = React.lazy(() => import('./pages/Commercial/Purchase/OutstandingPayables'));

// Reports
const ReportsDashboard = lazy(() => import('./pages/Analytics/Reports/ReportsDashboard'));
const BusinessSnapshot = lazy(() => import('./pages/Analytics/Reports/BusinessSnapshot'));
const ProfitPulse = lazy(() => import('./pages/Analytics/Reports/ProfitPulse'));

// Settings
const Settings = lazy(() => import('./pages/System/Settings/Settings'));

// Cash & Bank
const BankAccounts = lazy(() => import('./pages/Financial/Cashbank/BankAccounts'));
const CashInHand = lazy(() => import('./pages/Financial/Cashbank/CashInHand'));
const Transfers = lazy(() => import('./pages/Financial/Cashbank/Transfers'));
const Cheques = lazy(() => import('./pages/Financial/Cashbank/Cheques'));
const LoanAccounts = lazy(() => import('./pages/Financial/Cashbank/LoanAccounts'));
const AccountLedger = lazy(() => import('./pages/Financial/Cashbank/AccountLedger'));
const BankSummary = lazy(() => import('./pages/Financial/Cashbank/BankSummary'));
const CashBankPosition = lazy(() => import('./pages/Financial/Cashbank/CashBankPosition'));
const FinanceOverview = React.lazy(() => import('./pages/Financial/Cashbank/FinanceOverview'));
const BankIntelligence = React.lazy(() => import('./pages/Financial/Cashbank/BankIntelligence'));
const BankReconciliation = React.lazy(() => import('./pages/Financial/Cashbank/BankReconciliation'));
const CashBankIntelligence = React.lazy(() => import('./pages/Financial/Cashbank/CashBankIntelligence'));
const FundTransfer = lazy(() => import('./pages/Financial/Cashbank/FundTransfer'));
const PettyCash = lazy(() => import('./pages/Financial/Cashbank/PettyCash'));
const DayEndReconciliation = lazy(() => import('./pages/Financial/Cashbank/DayEndReconciliation'));

// Business
const OnlineShop = React.lazy(() => import('./pages/Analytics/Business/OnlineShop'));
const GoogleProfile = lazy(() => import('./pages/Analytics/Business/GoogleProfile'));
const MarketingTools = lazy(() => import('./pages/Analytics/Business/MarketingTools'));
const MetaCallback = lazy(() => import('./pages/Analytics/Business/MetaCallback'));
const WhatsAppMarketing = lazy(() => import('./pages/Analytics/Business/WhatsAppMarketing'));

// Sync
const SyncShare = lazy(() => import('./pages/System/Sync/SyncShare'));
const Backup = lazy(() => import('./pages/System/Sync/Backup'));
const Restore = lazy(() => import('./pages/System/Sync/Restore'));

// Expenses
const ExpensesModule = React.lazy(() => import('./pages/Financial/Expenses/ExpensesModule'));
const ExpenseCategoriesManager = React.lazy(() => import('./pages/Financial/Expenses/ExpenseCategoriesManager'));
const ExpenseIntelligence = React.lazy(() => import('./pages/Financial/Expenses/ExpenseIntelligence'));
const ExpenseReportsIntelligence = React.lazy(() => import('./pages/Financial/Expenses/ExpenseReportsIntelligence'));
const RecurringExpensesIntelligence = React.lazy(() => import('./pages/Financial/Expenses/RecurringExpensesIntelligence'));
const DailyFinance = React.lazy(() => import('./pages/Financial/Expenses/DailyFinance'));
const ExpenseManager = lazy(() => import('./pages/Financial/Expenses/ExpenseManager'));

// Utilities
const BarcodeGenerator = lazy(() => import('./pages/System/Utilities/BarcodeGenerator'));
const ImportItems = lazy(() => import('./pages/System/Utilities/ImportItems'));
const BusinessSetup = lazy(() => import('./pages/System/Utilities/BusinessSetup'));
const DataExport = lazy(() => import('./pages/System/Utilities/DataExport'));

// Employees
const LaborManager = React.lazy(() => import('./pages/People/Employees/LaborManager'));

// Tenants
const TenantManager = lazy(() => import('./pages/People/Tenants/TenantManager'));


// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  useDBDataSync(); // Initialize MongoDB Data Sync

  const [resolvedTenant, setResolvedTenant] = React.useState<string | null>(() => {
    return (import.meta as any).env.VITE_TENANT_ID || localStorage.getItem('selected_tenant_id') || null;
  });

  const handleTenantSelect = (tenant: any) => {
    if (tenant) {
      localStorage.setItem('selected_tenant_id', tenant.id);
      setResolvedTenant(tenant.id);
    }
  };

  const handleAdminSelect = () => {
    // Navigate to admin login by setting a temp state or just letting the router handle it 
    // if we add a direct link. But since we are conditional, we need to bypass LandingPage.
    setResolvedTenant('ADMIN_CONSOLE');
  };

  // If we are strictly "Tenant Resolution", and no tenant is found:
  if (!resolvedTenant) {
    return <LandingPage onSelectAdmin={handleAdminSelect} onSelectTenant={handleTenantSelect} />;
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-app text-main transition-colors duration-300">
        <ToastContainer />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Default Route - Redirect to Login if unknown, or Dashboard if authenticated (handled by PublicRoute/ProtectedRoute) */}
            <Route path="/" element={resolvedTenant === 'ADMIN_CONSOLE' ? <Navigate to="/admin/login" replace /> : <Navigate to="/login" replace />} />

            {/* Public Routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/admin/login" element={<PublicRoute><Login isAdmin={true} /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

            {/* DASHBOARD (MANDATORY) */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            {/* COMMERCIAL MODULE (MANDATORY) */}
            <Route path="/item">
              {/* Inventory */}
              <Route path="inventory">
                <Route index element={<ProtectedRoute><InventoryManager /></ProtectedRoute>} />
                <Route path="aged-stock" element={<ProtectedRoute><AgedStockManager /></ProtectedRoute>} />
                <Route path="batch-price-update" element={<ProtectedRoute><BatchPriceUpdate /></ProtectedRoute>} />
                <Route path="reprint-queue" element={<ProtectedRoute><ReprintQueue /></ProtectedRoute>} />
                <Route path="add" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
                <Route path="edit/:id" element={<ProtectedRoute><EditItem /></ProtectedRoute>} />
              </Route>

              {/* Point of Sale (POS) */}
              <Route path="pos">
                <Route path="billing" element={<ProtectedRoute><POS /></ProtectedRoute>} />
                <Route path="orders" element={<ProtectedRoute><POSOrdersIntelligence /></ProtectedRoute>} />
                <Route path="returns" element={<ProtectedRoute><POSReturnsIntelligence /></ProtectedRoute>} />
                <Route path="shifts" element={<ProtectedRoute><ShiftManagementIntelligence /></ProtectedRoute>} />
                <Route path="held-bills" element={<Navigate to="/item/pos/billing" replace />} />
              </Route>

              {/* Sales */}
              <Route path="sales">
                <Route path="orders" element={<ProtectedRoute><SalesOrderList /></ProtectedRoute>} />
                <Route path="order" element={<ProtectedRoute><SalesOrder /></ProtectedRoute>} />
                <Route path="order/:id" element={<ProtectedRoute><SalesOrderDetail /></ProtectedRoute>} />
                <Route path="invoices" element={<ProtectedRoute><SalesInvoice /></ProtectedRoute>} />
                <Route path="invoice/:id" element={<ProtectedRoute><SalesInvoiceDetail /></ProtectedRoute>} />
                <Route path="delivery-challans" element={<ProtectedRoute><DeliveryChallanList /></ProtectedRoute>} />
                <Route path="delivery-challan" element={<ProtectedRoute><DeliveryChallan /></ProtectedRoute>} />
                <Route path="delivery-challan/:id" element={<ProtectedRoute><DeliveryChallanDetail /></ProtectedRoute>} />
                <Route path="estimates" element={<ProtectedRoute><EstimateList /></ProtectedRoute>} />
                <Route path="estimate" element={<ProtectedRoute><Estimate /></ProtectedRoute>} />
                <Route path="estimate/:id" element={<ProtectedRoute><EstimateDetail /></ProtectedRoute>} />
                <Route path="payments" element={<ProtectedRoute><PaymentInList /></ProtectedRoute>} />
                <Route path="payment-in" element={<ProtectedRoute><PaymentIn /></ProtectedRoute>} />
                <Route path="payment-in/:id" element={<ProtectedRoute><PaymentReceiptDetail /></ProtectedRoute>} />
                <Route path="returns" element={<ProtectedRoute><ReturnedItems /></ProtectedRoute>} />
                <Route path="return" element={<ProtectedRoute><Return /></ProtectedRoute>} />
              </Route>

              {/* Purchase */}
              <Route path="purchase">
                <Route path="orders" element={<ProtectedRoute><PurchaseOrder /></ProtectedRoute>} />
                <Route path="invoices" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
                <Route path="returns" element={<ProtectedRoute><DebitNotes /></ProtectedRoute>} />
                <Route path="return/new" element={<ProtectedRoute><PurchaseReturn /></ProtectedRoute>} />
                <Route path="entry" element={<ProtectedRoute><PurchaseEntry /></ProtectedRoute>} />
                <Route path="payment-out" element={<ProtectedRoute><SupplierPayments /></ProtectedRoute>} />
                <Route path="payment-out/new" element={<ProtectedRoute><PaymentOut /></ProtectedRoute>} />
                <Route path="received" element={<ProtectedRoute><GoodsReceived /></ProtectedRoute>} />
                <Route path="payables" element={<ProtectedRoute><OutstandingPayables /></ProtectedRoute>} />
              </Route>
            </Route>

            {/* FINANCIAL MODULE (MANDATORY) */}
            <Route path="/financial">
              {/* Expenses */}
              <Route path="expenses">
                <Route index element={<ProtectedRoute><ExpenseManager /></ProtectedRoute>} />
                <Route path="recurring" element={<ProtectedRoute><RecurringExpensesIntelligence /></ProtectedRoute>} />
                <Route path="categories" element={<ProtectedRoute><ExpenseCategoriesManager /></ProtectedRoute>} />
                <Route path="reports" element={<ProtectedRoute><ExpenseReportsIntelligence /></ProtectedRoute>} />
                <Route path="insights" element={<ProtectedRoute><ExpenseIntelligence /></ProtectedRoute>} />
                <Route path="daily" element={<ProtectedRoute><DailyFinance /></ProtectedRoute>} />
              </Route>

              {/* Cash & Bank */}
              <Route path="cashbank">
                <Route path="transactions" element={<ProtectedRoute><CashBankPosition /></ProtectedRoute>} />
                <Route path="reconciliation" element={<ProtectedRoute><BankReconciliation /></ProtectedRoute>} />
                <Route path="bank-accounts" element={<ProtectedRoute><BankAccounts /></ProtectedRoute>} />
                <Route path="overview" element={<ProtectedRoute><FinanceOverview /></ProtectedRoute>} />
                <Route path="bank-summary" element={<ProtectedRoute><BankSummary /></ProtectedRoute>} />
                <Route path="cash-in-hand" element={<ProtectedRoute><CashInHand /></ProtectedRoute>} />
                <Route path="transfers" element={<ProtectedRoute><Transfers /></ProtectedRoute>} />
                <Route path="cheques" element={<ProtectedRoute><Cheques /></ProtectedRoute>} />
                <Route path="loan-accounts" element={<ProtectedRoute><LoanAccounts /></ProtectedRoute>} />
                <Route path="ledger/:id" element={<ProtectedRoute><AccountLedger /></ProtectedRoute>} />
                <Route path="bank-intelligence" element={<ProtectedRoute><BankIntelligence /></ProtectedRoute>} />
                <Route path="intelligence" element={<ProtectedRoute><CashBankIntelligence /></ProtectedRoute>} />
                <Route path="fund-transfer" element={<ProtectedRoute><FundTransfer /></ProtectedRoute>} />
                <Route path="petty-cash" element={<ProtectedRoute><PettyCash /></ProtectedRoute>} />
                <Route path="day-end-reconciliation" element={<ProtectedRoute><DayEndReconciliation /></ProtectedRoute>} />
              </Route>

              {/* Other Financials */}
              <Route path="invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
              <Route path="invoice/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
              <Route path="due-adjustments" element={<ProtectedRoute><DueAdjustment /></ProtectedRoute>} />
            </Route>

            {/* PEOPLE MODULE (MANDATORY) */}
            <Route path="/people">
              {/* Employees */}
              <Route path="employees">
                <Route index element={<ProtectedRoute><LaborManager /></ProtectedRoute>} />
                <Route path="attendance" element={<ProtectedRoute><LaborManager /></ProtectedRoute>} />
                <Route path="payments" element={<ProtectedRoute><LaborManager /></ProtectedRoute>} />
                <Route path="stats" element={<ProtectedRoute><LaborManager /></ProtectedRoute>} />
              </Route>

              {/* External Stakeholders */}
              <Route path="customers">
                <Route index element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                <Route path="add" element={<ProtectedRoute><AddCustomer /></ProtectedRoute>} />
                <Route path="edit/:id" element={<ProtectedRoute><EditCustomer /></ProtectedRoute>} />
                <Route path=":id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
                <Route path="with-dues" element={<ProtectedRoute><CustomersWithDues /></ProtectedRoute>} />
                <Route path="adjust-due/:id" element={<ProtectedRoute><DueAdjustment /></ProtectedRoute>} />
              </Route>
              <Route path="suppliers">
                <Route index element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
                <Route path="add" element={<ProtectedRoute><AddSupplier /></ProtectedRoute>} />
                <Route path=":id/edit" element={<ProtectedRoute><EditSupplier /></ProtectedRoute>} />
                <Route path=":id" element={<ProtectedRoute><SupplierDetail /></ProtectedRoute>} />
                <Route path="groups" element={<ProtectedRoute><SupplierGroups /></ProtectedRoute>} />
                <Route path="ledger" element={<ProtectedRoute><SupplierLedger /></ProtectedRoute>} />
                <Route path="statements" element={<ProtectedRoute><SupplierStatements /></ProtectedRoute>} />
              </Route>
              <Route path="vendors" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
              <Route path="tenants" element={<ProtectedRoute><TenantManager /></ProtectedRoute>} />
            </Route>

            {/* ANALYTICS MODULE (MANDATORY) */}
            <Route path="/analytics">
              <Route path="reports">
                <Route path="snapshot" element={<ProtectedRoute><BusinessSnapshot /></ProtectedRoute>} />
                <Route path="sales" element={<ProtectedRoute><ReportsDashboard /></ProtectedRoute>} />
                <Route path="hourly" element={<ProtectedRoute><ReportsDashboard /></ProtectedRoute>} />
                <Route path="profit" element={<ProtectedRoute><ProfitPulse /></ProtectedRoute>} />
                <Route index element={<ProtectedRoute><ReportsDashboard /></ProtectedRoute>} />
              </Route>
              <Route path="marketing">
                <Route path="google-business" element={<ProtectedRoute><GoogleProfile /></ProtectedRoute>} />
                <Route path="online-shop" element={<ProtectedRoute><OnlineShop /></ProtectedRoute>} />
                <Route path="tools" element={<ProtectedRoute><MarketingTools /></ProtectedRoute>} />
                <Route path="meta/callback" element={<ProtectedRoute><MetaCallback /></ProtectedRoute>} />
                <Route path="whatsapp" element={<ProtectedRoute><WhatsAppMarketing /></ProtectedRoute>} />
              </Route>
            </Route>

            {/* SYSTEM MODULE (MANDATORY) */}
            <Route path="/system">
              {/* Settings */}
              <Route path="settings" element={<Navigate to="/system/settings/general" replace />} />
              <Route path="settings/:tab" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

              {/* Sync & Data */}
              <Route path="sync">
                <Route index element={<ProtectedRoute><SyncShare /></ProtectedRoute>} />
                <Route path="share" element={<ProtectedRoute><SyncShare /></ProtectedRoute>} />
                <Route path="backup" element={<ProtectedRoute><Backup /></ProtectedRoute>} />
                <Route path="restore" element={<ProtectedRoute><Restore /></ProtectedRoute>} />
              </Route>
              <Route path="data" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />

              <Route path="utilities">
                <Route path="barcode" element={<ProtectedRoute><BarcodeGenerator /></ProtectedRoute>} />
                <Route path="import-items" element={<ProtectedRoute><ImportItems /></ProtectedRoute>} />
                <Route path="business-setup" element={<ProtectedRoute><BusinessSetup /></ProtectedRoute>} />
                <Route path="export" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
              </Route>
            </Route>

            {/* ACCOUNT (MANDATORY) */}
            <Route path="/account">
              <Route path="profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
            </Route>

            <Route path="/logout" element={<Navigate to="/login" replace />} />

            {/* 404 Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </div>
    </ThemeProvider>
  );
}

export default App;
