# BizzAI ERP - Frontend Functionality Document & Sitemap

## 1. Overview
BizzAI ERP is a comprehensive business management system. The frontend is built with React, TypeScript, and Redux, featuring a modular architecture organized by domain.

**Base URL (Local Development):** `http://localhost:5173`

---

## 2. Core Modules

### 2.1 Commercial Module
**Primary Route:** `/item`

*   **Inventory Management**
    *   **Inventory Manager**: `/item/inventory`
    *   **Aged Stock Analysis**: `/item/inventory/aged-stock`
    *   **Batch Price Update**: `/item/inventory/batch-price-update`
    *   **Reprint Queue**: `/item/inventory/reprint-queue`
    *   **Add New Item**: `/item/inventory/add`
    *   **Edit Item**: `/item/inventory/edit/:id`
*   **Point of Sale (POS)**
    *   **Billing Interface**: `/item/pos/billing`
    *   **Orders Intelligence**: `/item/pos/orders`
    *   **Returns Intelligence**: `/item/pos/returns`
    *   **Shift Management**: `/item/pos/shifts`
*   **Sales**
    *   **Sales Orders List**: `/item/sales/orders`
    *   **New Sales Order**: `/item/sales/order`
    *   **Order Details**: `/item/sales/order/:id`
    *   **Sales Invoices**: `/item/sales/invoices`
    *   **Invoice Details**: `/item/sales/invoice/:id`
    *   **Delivery Challans**: `/item/sales/delivery-challans`
    *   **New Delivery Challan**: `/item/sales/delivery-challan`
    *   **Estimates List**: `/item/sales/estimates`
    *   **New Estimate**: `/item/sales/estimate`
    *   **Payment In List**: `/item/sales/payments`
    *   **New Payment In**: `/item/sales/payment-in`
    *   **Sales Returns**: `/item/sales/returns`
    *   **New Sales Return**: `/item/sales/return`
*   **Purchase**
    *   **Purchase Orders**: `/item/purchase/orders`
    *   **Purchase Invoices (Bills)**: `/item/purchase/invoices`
    *   **Purchase Returns (Debit Notes)**: `/item/purchase/returns`
    *   **New Purchase Return**: `/item/purchase/return/new`
    *   **Direct Purchase Entry**: `/item/purchase/entry`
    *   **Supplier Payments**: `/item/purchase/payment-out`
    *   **New Supplier Payment**: `/item/purchase/payment-out/new`
    *   **Goods Received (GRN)**: `/item/purchase/received`
    *   **Outstanding Payables**: `/item/purchase/payables`

### 2.2 Financial Module
**Primary Route:** `/financial`

*   **Expense Management**
    *   **Expense Manager**: `/financial/expenses`
    *   **Recurring Expenses**: `/financial/expenses/recurring`
    *   **Expense Categories**: `/financial/expenses/categories`
    *   **Expense Reports**: `/financial/expenses/reports`
    *   **Financial Insights**: `/financial/expenses/insights`
    *   **Daily Finance**: `/financial/expenses/daily`
*   **Cash & Bank**
    *   **Transactions/Position**: `/financial/cashbank/transactions`
    *   **Bank Reconciliation**: `/financial/cashbank/reconciliation`
    *   **Bank Accounts**: `/financial/cashbank/bank-accounts`
    *   **Finance Overview**: `/financial/cashbank/overview`
    *   **Bank Summary**: `/financial/cashbank/bank-summary`
    *   **Cash In Hand**: `/financial/cashbank/cash-in-hand`
    *   **Fund Transfers**: `/financial/cashbank/transfers`
    *   **Cheque Management**: `/financial/cashbank/cheques`
    *   **Loan Accounts**: `/financial/cashbank/loan-accounts`
    *   **Account Ledger**: `/financial/cashbank/ledger/:id`
    *   **Bank Intelligence**: `/financial/cashbank/bank-intelligence`
    *   **Global Intelligence**: `/financial/cashbank/intelligence`
    *   **New Fund Transfer**: `/financial/cashbank/fund-transfer`
    *   **Petty Cash**: `/financial/cashbank/petty-cash`
    *   **Day-End Reconciliation**: `/financial/cashbank/day-end-reconciliation`
*   **Other Financials**
    *   **General Invoices**: `/financial/invoices`
    *   **Invoice Details**: `/financial/invoice/:id`
    *   **Due Adjustments**: `/financial/due-adjustments`

### 2.3 People Module
**Primary Route:** `/people`

*   **Employee/Labor Management**
    *   **Labor Manager**: `/people/employees`
    *   **Attendance Tracking**: `/people/employees/attendance`
    *   **Staff Payments**: `/people/employees/payments`
    *   **Labor Stats**: `/people/employees/stats`
*   **Customer Management**
    *   **Customers List**: `/people/customers`
    *   **Add New Customer**: `/people/customers/add`
    *   **Edit Customer**: `/people/customers/edit/:id`
    *   **Customer Details**: `/people/customers/:id`
    *   **Customers with Dues**: `/people/customers/with-dues`
    *   **Adjust Customer Dues**: `/people/customers/adjust-due/:id`
*   **Supplier & Vendor Management**
    *   **Suppliers List**: `/people/suppliers`
    *   **Add New Supplier**: `/people/suppliers/add`
    *   **Edit Supplier**: `/people/suppliers/:id/edit`
    *   **Supplier Details**: `/people/suppliers/:id`
    *   **Supplier Groups**: `/people/suppliers/groups`
    *   **Supplier Ledger**: `/people/suppliers/ledger`
    *   **Supplier Statements**: `/people/suppliers/statements`
    *   **Vendors (Redirects to Suppliers)**: `/people/vendors`
*   **Tenants**
    *   **Tenant Manager**: `/people/tenants`

### 2.4 Analytics Module
**Primary Route:** `/analytics`

*   **Business Intelligence (Reports)**
    *   **Reports Dashboard**: `/analytics/reports`
    *   **Business Snapshot**: `/analytics/reports/snapshot`
    *   **Sales Reports**: `/analytics/reports/sales`
    *   **Hourly Billing**: `/analytics/reports/hourly`
    *   **Profit Pulse**: `/analytics/reports/profit`
*   **Marketing & Integrations**
    *   **Google Business**: `/analytics/marketing/google-business`
    *   **Online Shop Config**: `/analytics/marketing/online-shop`
    *   **Marketing Tools**: `/analytics/marketing/tools`
    *   **Meta/Facebook Callback**: `/analytics/marketing/meta/callback`
    *   **WhatsApp Marketing**: `/analytics/marketing/whatsapp`

### 2.5 System Module
**Primary Route:** `/system`

*   **Settings**
    *   **Settings Dashboard**: `/system/settings`
    *   **Specific Setting Tab**: `/system/settings/:tab` (e.g., `general`, `branding`, `security`, `subscription`)
*   **Data & Sync**
    *   **Sync & Share Dashboard**: `/system/sync`
    *   **Data Sharing**: `/system/sync/share`
    *   **Cloud Backup**: `/system/sync/backup`
    *   **Restore Data**: `/system/sync/restore`
    *   **Data Export**: `/system/data`
*   **Utilities**
    *   **Barcode Generator**: `/system/utilities/barcode`
    *   **Import Items (Excel/CSV)**: `/system/utilities/import-items`
    *   **Initial Business Setup**: `/system/utilities/business-setup`
    *   **Utility Export**: `/system/utilities/export`

### 2.6 Account & Organization
*   **Dashboard**: `/dashboard`
*   **User Profile**: `/account/profile`
*   **Login**: `/login`
*   **Registration**: `/register`
*   **Forgot Password**: `/forgot-password`
*   **Reset Password**: `/reset-password`
*   **Logout**: `/logout`

---

## 3. Tech Stack Highlights
*   **Framework**: React (Vite based)
*   **Type Safety**: TypeScript (Strict mode)
*   **State Management**: Redux Toolkit
*   **Styling**: Tailwind CSS (Dark/Light mode support)
*   **Icons**: Lucide React
*   **Feedback**: React-Toastify
