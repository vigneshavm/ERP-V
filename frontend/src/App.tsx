import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingScreen from './components/layout/LoadingScreen';
import { useSelector } from 'react-redux';
import { RootState } from './redux/store';
import { ToastContainer } from "react-toastify"
import { ThemeProvider } from './contexts/ThemeContext';
// Auth
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

// Dashboard & Profile
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));

// Customers
const Customers = lazy(() => import('./pages/customers/Customers'));
const AddCustomer = lazy(() => import('./pages/customers/AddCustomer'));
const EditCustomer = lazy(() => import('./pages/customers/EditCustomer'));
const CustomerDetail = lazy(() => import('./pages/customers/CustomerDetail'));
const DueAdjustment = lazy(() => import('./pages/DueAdjustment'));
const CustomersWithDues = lazy(() => import('./pages/customers/CustomersWithDues'));

// Suppliers
const Suppliers = lazy(() => import('./pages/suppliers/Suppliers'));
const AddSupplier = lazy(() => import('./pages/suppliers/AddSupplier'));
const EditSupplier = lazy(() => import('./pages/suppliers/EditSupplier'));
const SupplierDetail = lazy(() => import('./pages/suppliers/SupplierDetail'));
const SupplierGroups = lazy(() => import('./pages/suppliers/SupplierGroups'));
const SupplierLedger = lazy(() => import('./pages/suppliers/SupplierLedger'));
const SupplierStatements = lazy(() => import('./pages/suppliers/SupplierStatements'));

// Inventory
const AddItem = lazy(() => import('./pages/items/AddItem'));
const EditItem = lazy(() => import('./pages/items/EditItem'));
const BatchPriceUpdate = lazy(() => import('./pages/inventory/BatchPriceUpdate'));
const ReprintQueue = lazy(() => import('./pages/inventory/ReprintQueue'));

// POS & Invoices
const POS = lazy(() => import('./pages/POS'));
const Invoices = lazy(() => import('./pages/invoices/Invoice'));
const InvoiceDetail = lazy(() => import('./pages/invoices/InvoiceDetail'));

// Reports
const Reports = lazy(() => import('./pages/Reports'));

// Settings
const Settings = lazy(() => import('./pages/settings/Settings'));

// Sales
const SalesInvoice = lazy(() => import('./pages/sales/salesInvoices/SalesInvoice'));
const SalesInvoiceDetail = lazy(() => import('./pages/sales/salesInvoices/SalesInvoiceDetail'));
const Estimate = lazy(() => import('./pages/sales/estimates/Estimate'));
const EstimateList = lazy(() => import('./pages/sales/estimates/EstimateList'));
const EstimateDetail = lazy(() => import('./pages/sales/estimates/EstimateDetail'));
const PaymentIn = lazy(() => import('./pages/sales/payments/PaymentIn'));
const PaymentInList = lazy(() => import('./pages/sales/payments/PaymentInList'));
const PaymentReceiptDetail = lazy(() => import('./pages/sales/payments/PaymentReceiptDetail'));
const SalesOrder = lazy(() => import('./pages/sales/salesOrders/SalesOrder'));
const SalesOrderList = lazy(() => import('./pages/sales/salesOrders/SalesOrderList'));
const SalesOrderDetail = lazy(() => import('./pages/sales/salesOrders/SalesOrderDetail'));
const DeliveryChallan = lazy(() => import('./pages/sales/deliveryChallans/DeliveryChallan'));
const DeliveryChallanList = lazy(() => import('./pages/sales/deliveryChallans/DeliveryChallanList'));
const DeliveryChallanDetail = lazy(() => import('./pages/sales/deliveryChallans/DeliveryChallanDetail'));
const Return = lazy(() => import('./pages/sales/returns/Return'));
const ReturnedItems = lazy(() => import('./pages/sales/returns/ReturnedItems'));

// Purchase
const PurchaseEntry = lazy(() => import('./pages/purchase/PurchaseEntry'));
const Bills = lazy(() => import('./pages/purchase/Bills'));
const PaymentOut = lazy(() => import('./pages/purchase/PaymentOut'));
const Expenses = lazy(() => import('./pages/expenses/ExpensesModule'));
const PurchaseOrder = lazy(() => import('./pages/purchase/PurchaseOrdersModule'));
const PurchaseReturn = lazy(() => import('./pages/purchase/PurchaseReturn'));
const SupplierPayments = lazy(() => import('./pages/purchase/SupplierPayments'));
const DebitNotes = lazy(() => import('./pages/purchase/DebitNotes'));
const GoodsReceived = lazy(() => import('./pages/purchase/GoodsReceived'));
const OutstandingPayables = lazy(() => import('./pages/purchase/OutstandingPayables'));

// Purchase Reports
const ReportsDashboard = lazy(() => import('./pages/reports/ReportsDashboard'));
const BusinessSnapshot = lazy(() => import('./pages/reports/BusinessSnapshot'));
const ProfitPulse = lazy(() => import('./pages/reports/ProfitPulse'));

// Cash & Bank
const BankAccounts = lazy(() => import('./pages/cashbank/BankAccounts'));
const CashInHand = lazy(() => import('./pages/cashbank/CashInHand'));
const Transfers = lazy(() => import('./pages/cashbank/Transfers'));
const Cheques = lazy(() => import('./pages/cashbank/Cheques'));
const LoanAccounts = lazy(() => import('./pages/cashbank/LoanAccounts'));
const AccountLedger = lazy(() => import('./pages/cashbank/AccountLedger'));
const BankSummary = lazy(() => import('./pages/cashbank/BankSummary'));
const CashBankPosition = lazy(() => import('./pages/cashbank/CashBankPosition'));
const FinanceOverview = lazy(() => import('./pages/cashbank/FinanceOverview'));
const BankIntelligence = lazy(() => import('./pages/cashbank/BankIntelligence'));
const BankReconciliation = lazy(() => import('./pages/cashbank/BankReconciliation'));
const CashBankIntelligence = lazy(() => import('./pages/cashbank/CashBankIntelligence'));
const FundTransfer = lazy(() => import('./pages/cashbank/FundTransfer'));
const PettyCash = lazy(() => import('./pages/cashbank/PettyCash'));
const DayEndReconciliation = lazy(() => import('./pages/cashbank/DayEndReconciliation'));

// Business
const OnlineShop = lazy(() => import('./pages/business/OnlineShop'));
const GoogleProfile = lazy(() => import('./pages/business/GoogleProfile'));
const MarketingTools = lazy(() => import('./pages/business/MarketingTools'));
const MetaCallback = lazy(() => import('./pages/business/MetaCallback'));
const WhatsAppMarketing = lazy(() => import('./pages/business/WhatsAppMarketing'));

// Sync
const SyncShare = lazy(() => import('./pages/sync/SyncShare'));
const Backup = lazy(() => import('./pages/sync/Backup'));
const Restore = lazy(() => import('./pages/sync/Restore'));

// Expenses
const ExpensesModule = Expenses;

const ExpenseCategoriesManager = lazy(() => import('./pages/expenses/ExpenseCategoriesManager'));
// const ExpenseIntelligence = lazy(() => import('./pages/expenses/ExpenseIntelligence')); // Duplicate import in original code? 101 and 142?
// wait, line 101: import ExpenseIntelligence...
// line 442 usage.
// looking at original imports:
// 101: import ExpenseIntelligence from './pages/expenses/ExpenseIntelligence';
// 102: import ExpenseReportsIntelligence from './pages/expenses/ExpenseReportsIntelligence';
// 103: import RecurringExpensesIntelligence from './pages/expenses/RecurringExpensesIntelligence';
// 104: import DailyFinance from './pages/expenses/DailyFinance';
// 105: import ExpenseManager from './pages/expenses/ExpenseManager';
// 106: import InventoryManager from './pages/inventory/InventoryManager';
// 107: import AgedStockManager from './pages/inventory/AgedStockManager';

const ExpenseIntelligence = lazy(() => import('./pages/expenses/ExpenseIntelligence'));
const ExpenseReportsIntelligence = lazy(() => import('./pages/expenses/ExpenseReportsIntelligence'));
const RecurringExpensesIntelligence = lazy(() => import('./pages/expenses/RecurringExpensesIntelligence'));
const DailyFinance = lazy(() => import('./pages/expenses/DailyFinance'));
const ExpenseManager = lazy(() => import('./pages/expenses/ExpenseManager'));
const InventoryManager = lazy(() => import('./pages/inventory/InventoryManager'));
const AgedStockManager = lazy(() => import('./pages/inventory/AgedStockManager'));

// Utilities
const BarcodeGenerator = lazy(() => import('./pages/utilities/BarcodeGenerator'));
const ImportItems = lazy(() => import('./pages/utilities/ImportItems'));
const BusinessSetup = lazy(() => import('./pages/utilities/BusinessSetup'));
const DataExport = lazy(() => import('./pages/utilities/DataExport'));
const LaborManager = lazy(() => import('./pages/employees/LaborManager'));

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
  console.log((import.meta as any).env.VITE_BACKEND_URL);
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-app text-main transition-colors duration-300">
        <ToastContainer />
        <Router>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Default Route */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <PublicRoute>
                    <ResetPassword />
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile-settings"
                element={
                  <ProtectedRoute>
                    <ProfileSettings />
                  </ProtectedRoute>
                }
              />

              {/* Customer Routes - Use nested routes for better organization */}
              <Route path="/customers">
                <Route
                  index
                  element={
                    <ProtectedRoute>
                      <Customers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="add"
                  element={
                    <ProtectedRoute>
                      <AddCustomer />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="edit/:id"
                  element={
                    <ProtectedRoute>
                      <EditCustomer />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="adjust-due/:id"
                  element={
                    <ProtectedRoute>
                      <DueAdjustment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="with-dues"
                  element={
                    <ProtectedRoute>
                      <CustomersWithDues />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path=":id"
                  element={
                    <ProtectedRoute>
                      <CustomerDetail />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Supplier Routes */}
              <Route path="/suppliers">
                <Route
                  index
                  element={
                    <ProtectedRoute>
                      <Suppliers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="add"
                  element={
                    <ProtectedRoute>
                      <AddSupplier />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path=":id/edit"
                  element={
                    <ProtectedRoute>
                      <EditSupplier />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path=":id"
                  element={
                    <ProtectedRoute>
                      <SupplierDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="groups"
                  element={
                    <ProtectedRoute>
                      <SupplierGroups />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="ledger"
                  element={
                    <ProtectedRoute>
                      <SupplierLedger />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="statements"
                  element={
                    <ProtectedRoute>
                      <SupplierStatements />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Inventory Routes */}
              <Route path="/inventory">
                <Route index element={<ProtectedRoute><InventoryManager /></ProtectedRoute>} />
                <Route path="aged-stock" element={<ProtectedRoute><AgedStockManager /></ProtectedRoute>} />
                <Route
                  path="add"
                  element={
                    <ProtectedRoute>
                      <AddItem />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="edit/:id"
                  element={
                    <ProtectedRoute>
                      <EditItem />
                    </ProtectedRoute>
                  }
                />
                <Route path="batch-price-update" element={<ProtectedRoute><BatchPriceUpdate /></ProtectedRoute>} />
                <Route path="reprint-queue" element={<ProtectedRoute><ReprintQueue /></ProtectedRoute>} />
              </Route>

              {/* POS Routes */}
              <Route path="/pos">
                <Route
                  index
                  element={
                    <ProtectedRoute>
                      <POS />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="invoices"
                  element={
                    <ProtectedRoute>
                      <Invoices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="invoice/:id"
                  element={
                    <ProtectedRoute>
                      <InvoiceDetail />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Sales Routes */}
              <Route path="/sales">
                <Route path="invoice" element={<ProtectedRoute><SalesInvoice /></ProtectedRoute>} />
                <Route path="invoice/:id" element={<ProtectedRoute><SalesInvoiceDetail /></ProtectedRoute>} />
                <Route path="estimate" element={<ProtectedRoute><Estimate /></ProtectedRoute>} />
                <Route path="estimates" element={<ProtectedRoute><EstimateList /></ProtectedRoute>} />
                <Route path="estimate/:id" element={<ProtectedRoute><EstimateDetail /></ProtectedRoute>} />
                <Route path="payment-in" element={<ProtectedRoute><PaymentIn /></ProtectedRoute>} />
                <Route path="payment-in-list" element={<ProtectedRoute><PaymentInList /></ProtectedRoute>} />
                <Route path="payment-in/:id" element={<ProtectedRoute><PaymentReceiptDetail /></ProtectedRoute>} />
                <Route path="sales-order" element={<ProtectedRoute><SalesOrder /></ProtectedRoute>} />
                <Route path="sales-order-list" element={<ProtectedRoute><SalesOrderList /></ProtectedRoute>} />
                <Route path="sales-order/:id" element={<ProtectedRoute><SalesOrderDetail /></ProtectedRoute>} />
                <Route path="order" element={<ProtectedRoute><SalesOrder /></ProtectedRoute>} />
                <Route path="delivery-challan" element={<ProtectedRoute><DeliveryChallan /></ProtectedRoute>} />
                <Route path="delivery-challan-list" element={<ProtectedRoute><DeliveryChallanList /></ProtectedRoute>} />
                <Route path="delivery-challan/:id" element={<ProtectedRoute><DeliveryChallanDetail /></ProtectedRoute>} />
                <Route path="return" element={<ProtectedRoute><Return /></ProtectedRoute>} />
                <Route path="returned-items" element={<ProtectedRoute><ReturnedItems /></ProtectedRoute>} />
              </Route>

              {/* Purchase Routes */}
              <Route path="/purchase">
                <Route path="entry" element={<ProtectedRoute><PurchaseEntry /></ProtectedRoute>} />
                <Route path="bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
                <Route path="payment-out" element={<ProtectedRoute><SupplierPayments /></ProtectedRoute>} />
                <Route path="payment-out/new" element={<ProtectedRoute><PaymentOut /></ProtectedRoute>} />
                <Route path="expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
                <Route path="order" element={<ProtectedRoute><PurchaseOrder /></ProtectedRoute>} />
                <Route path="return" element={<ProtectedRoute><DebitNotes /></ProtectedRoute>} />
                <Route path="return/new" element={<ProtectedRoute><PurchaseReturn /></ProtectedRoute>} />
                <Route path="received" element={<ProtectedRoute><GoodsReceived /></ProtectedRoute>} />
                <Route path="payables" element={<ProtectedRoute><OutstandingPayables /></ProtectedRoute>} />
              </Route>

              {/* Cash & Bank Routes */}
              <Route path="/cashbank">
                <Route path="position" element={<ProtectedRoute><CashBankPosition /></ProtectedRoute>} />
                <Route path="bank-accounts" element={<ProtectedRoute><BankAccounts /></ProtectedRoute>} />
                <Route path="bank-summary" element={<ProtectedRoute><BankSummary /></ProtectedRoute>} />
                <Route path="cash-in-hand" element={<ProtectedRoute><CashInHand /></ProtectedRoute>} />
                <Route path="transfers" element={<ProtectedRoute><Transfers /></ProtectedRoute>} />
                <Route path="ledger/:id" element={<ProtectedRoute><AccountLedger /></ProtectedRoute>} />
                <Route path="cheques" element={<ProtectedRoute><Cheques /></ProtectedRoute>} />
                <Route path="loan-accounts" element={<ProtectedRoute><LoanAccounts /></ProtectedRoute>} />
                <Route path="overview" element={<ProtectedRoute><FinanceOverview /></ProtectedRoute>} />
                <Route path="bank-intelligence" element={<ProtectedRoute><BankIntelligence /></ProtectedRoute>} />
                <Route path="reconciliation" element={<ProtectedRoute><BankReconciliation /></ProtectedRoute>} />
                <Route path="intelligence" element={<ProtectedRoute><CashBankIntelligence /></ProtectedRoute>} />
                <Route path="fund-transfer" element={<ProtectedRoute><FundTransfer /></ProtectedRoute>} />
                <Route path="petty-cash" element={<ProtectedRoute><PettyCash /></ProtectedRoute>} />
                <Route path="day-end-reconciliation" element={<ProtectedRoute><DayEndReconciliation /></ProtectedRoute>} />
              </Route>

              {/* Business Growth Routes */}
              <Route path="/business">
                <Route path="online-shop" element={<ProtectedRoute><OnlineShop /></ProtectedRoute>} />
                <Route path="google-profile" element={<ProtectedRoute><GoogleProfile /></ProtectedRoute>} />
                <Route path="marketing-tools" element={<ProtectedRoute><MarketingTools /></ProtectedRoute>} />
                <Route path="marketing/meta/callback" element={<ProtectedRoute><MetaCallback /></ProtectedRoute>} />
                <Route path="whatsapp-marketing" element={<ProtectedRoute><WhatsAppMarketing /></ProtectedRoute>} />
              </Route>

              {/* Sync & Backup Routes */}
              <Route path="/sync">
                <Route path="share" element={<ProtectedRoute><SyncShare /></ProtectedRoute>} />
                <Route path="backup" element={<ProtectedRoute><Backup /></ProtectedRoute>} />
                <Route path="restore" element={<ProtectedRoute><Restore /></ProtectedRoute>} />
              </Route>

              {/* Expenses Routes */}
              <Route path="/expenses">
                <Route index element={<ProtectedRoute><ExpensesModule /></ProtectedRoute>} />
                <Route path="daily" element={<ProtectedRoute><DailyFinance /></ProtectedRoute>} />
                <Route path="manager" element={<ProtectedRoute><ExpenseManager /></ProtectedRoute>} />
                <Route path="categories" element={<ProtectedRoute><ExpenseCategoriesManager /></ProtectedRoute>} />
                <Route path="intelligence" element={<ProtectedRoute><ExpenseIntelligence /></ProtectedRoute>} />
                <Route path="reports" element={<ProtectedRoute><ExpenseReportsIntelligence /></ProtectedRoute>} />
                <Route path="recurring" element={<ProtectedRoute><RecurringExpensesIntelligence /></ProtectedRoute>} />
              </Route>

              {/* Utilities Routes */}
              <Route path="/utilities">
                <Route path="barcode" element={<ProtectedRoute><BarcodeGenerator /></ProtectedRoute>} />
                <Route path="import-items" element={<ProtectedRoute><ImportItems /></ProtectedRoute>} />
                <Route path="business-setup" element={<ProtectedRoute><BusinessSetup /></ProtectedRoute>} />
                <Route path="export" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
              </Route>

              {/* Employee Routes */}
              <Route path="/employees" element={<ProtectedRoute><LaborManager /></ProtectedRoute>} />

              {/* Reports Route */}
              <Route path="/reports">
                <Route index element={<ProtectedRoute><ReportsDashboard /></ProtectedRoute>} />
                <Route path="business-snapshot" element={<ProtectedRoute><BusinessSnapshot /></ProtectedRoute>} />
                <Route path="profit-pulse" element={<ProtectedRoute><ProfitPulse /></ProtectedRoute>} />
              </Route>

              {/* Settings Route */}
              {/* Settings Route */}
              <Route path="/settings" element={<Navigate to="/settings/general" replace />} />
              <Route path="/settings/:tab" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

              {/* 404 Route */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;
