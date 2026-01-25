import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './redux/store';
import { ToastContainer } from "react-toastify"
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import ProfileSettings from './pages/ProfileSettings';
import Customers from './pages/customers/Customers';
import AddCustomer from './pages/customers/AddCustomer';
import EditCustomer from './pages/customers/EditCustomer';
import CustomerDetail from './pages/customers/CustomerDetail';
import DueAdjustment from './pages/DueAdjustment';
import CustomersWithDues from './pages/customers/CustomersWithDues';
import Suppliers from './pages/suppliers/Suppliers';
import AddSupplier from './pages/suppliers/AddSupplier';
import EditSupplier from './pages/suppliers/EditSupplier';
import SupplierDetail from './pages/suppliers/SupplierDetail';
import SupplierGroups from './pages/suppliers/SupplierGroups';
import SupplierLedger from './pages/suppliers/SupplierLedger';
import SupplierStatements from './pages/suppliers/SupplierStatements';
import Inventory from './pages/Inventory';
import AddItem from './pages/items/AddItem';
import EditItem from './pages/items/EditItem';
import POS from './pages/POS';
import Invoices from './pages/invoices/Invoice';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import Reports from './pages/Reports';
import Settings from './pages/settings/Settings';

// Sales
import SalesInvoice from './pages/sales/salesInvoices/SalesInvoice';
import SalesInvoiceDetail from './pages/sales/salesInvoices/SalesInvoiceDetail';
import Estimate from './pages/sales/estimates/Estimate';
import EstimateList from './pages/sales/estimates/EstimateList';
import EstimateDetail from './pages/sales/estimates/EstimateDetail';
import PaymentIn from './pages/sales/payments/PaymentIn';
import PaymentInList from './pages/sales/payments/PaymentInList';
import PaymentReceiptDetail from './pages/sales/payments/PaymentReceiptDetail';
import SalesOrder from './pages/sales/salesOrders/SalesOrder';
import SalesOrderList from './pages/sales/salesOrders/SalesOrderList';
import SalesOrderDetail from './pages/sales/salesOrders/SalesOrderDetail';
import DeliveryChallan from './pages/sales/deliveryChallans/DeliveryChallan';
import DeliveryChallanList from './pages/sales/deliveryChallans/DeliveryChallanList';
import DeliveryChallanDetail from './pages/sales/deliveryChallans/DeliveryChallanDetail';
import Return from './pages/sales/returns/Return';
import ReturnedItems from './pages/sales/returns/ReturnedItems';

// Purchase
import Purchase from './pages/purchase/Purchase';
import Bills from './pages/purchase/Bills';
import PaymentOut from './pages/purchase/PaymentOut';
import Expenses from './pages/expenses/ExpensesModule';
import PurchaseOrder from './pages/purchase/PurchaseOrder';
import PurchaseReturn from './pages/purchase/PurchaseReturn';

// Reports
import ReportsDashboard from './pages/reports/ReportsDashboard';

// Cash & Bank
import BankAccounts from './pages/cashbank/BankAccounts';
import CashInHand from './pages/cashbank/CashInHand';
import Transfers from './pages/cashbank/Transfers';
import Cheques from './pages/cashbank/Cheques';
import LoanAccounts from './pages/cashbank/LoanAccounts';
import AccountLedger from './pages/cashbank/AccountLedger';
import BankSummary from './pages/cashbank/BankSummary';
import CashBankPosition from './pages/cashbank/CashBankPosition';

// Business
import OnlineShop from './pages/business/OnlineShop';
import GoogleProfile from './pages/business/GoogleProfile';
import MarketingTools from './pages/business/MarketingTools';
import WhatsAppMarketing from './pages/business/WhatsAppMarketing';

// Sync
import SyncShare from './pages/sync/SyncShare';
import Backup from './pages/sync/Backup';
import Restore from './pages/sync/Restore';

// Expenses
import ExpensesModule from './pages/expenses/ExpensesModule';
import ExpenseCategoriesManager from './pages/expenses/ExpenseCategoriesManager';
import ExpenseIntelligence from './pages/expenses/ExpenseIntelligence';
import ExpenseReportsIntelligence from './pages/expenses/ExpenseReportsIntelligence';
import RecurringExpensesIntelligence from './pages/expenses/RecurringExpensesIntelligence';
// Redundant imports removed

// Utilities
import BarcodeGenerator from './pages/utilities/BarcodeGenerator';
import ImportItems from './pages/utilities/ImportItems';
import BusinessSetup from './pages/utilities/BusinessSetup';
import DataExport from './pages/utilities/DataExport';
import LaborManager from './pages/employees/LaborManager';

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
              <Route
                index
                element={
                  <ProtectedRoute>
                    <Inventory />
                  </ProtectedRoute>
                }
              />
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
              <Route path="entry" element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
              <Route path="bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
              <Route path="payment-out" element={<ProtectedRoute><PaymentOut /></ProtectedRoute>} />
              <Route path="expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
              <Route path="order" element={<ProtectedRoute><PurchaseOrder /></ProtectedRoute>} />
              <Route path="return" element={<ProtectedRoute><PurchaseReturn /></ProtectedRoute>} />
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
            </Route>

            {/* Business Growth Routes */}
            <Route path="/business">
              <Route path="online-shop" element={<ProtectedRoute><OnlineShop /></ProtectedRoute>} />
              <Route path="google-profile" element={<ProtectedRoute><GoogleProfile /></ProtectedRoute>} />
              <Route path="marketing-tools" element={<ProtectedRoute><MarketingTools /></ProtectedRoute>} />
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
            <Route path="/reports" element={<ProtectedRoute><ReportsDashboard /></ProtectedRoute>} />

            {/* Settings Route */}
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            {/* 404 Route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;
