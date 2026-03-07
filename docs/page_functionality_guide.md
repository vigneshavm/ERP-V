# ERP Page Functionality & Architecture Guide

Welcome to the ERP Matrix project! As a senior frontend architect, I've compiled this guide to help you navigate the complex features and UI logic of our React 19 finance/expense SaaS application.

## 🏗️ Technical Foundation

- **Framework**: React 19 (using New Hooks like [use](file:///c:/Users/avmvi/Project/ERP/frontend/src/services/ModuleRegistry.ts#123-124), `useActionState`, `useTransition` where applicable).
- **Styling**: Tailwind CSS v4 (Industrial-grade design system).
- **State Management**: Redux Toolkit (Slices for Finance, Inventory, POS, etc.).
- **Architecture**: Feature-based modular architecture with Progressive Lazy Loading.
- **Routing**: Centralized `ModuleRegistry` mapping `AppView` IDs to dynamic imports.

---

## 🚦 Core View Modules

### 1. 📊 Dashboards & Analytics
*   **Profit Pulse**: The "Heart" of the system. Visualizes real-time revenue vs. expense metrics.
*   **Dashboard Snapshot**: A quick overview for business owners to see daily performance at a glance.
*   **Daily Finance Tracker**: A reconciliation-focused view for tracking today's cash flow, income, and expenses.
*   **Marketing Metrics**: Integration with growth data to show ROI on marketing spend.

### 2. 💰 Sales & Revenue Center
*   **Sales Invoice Register**: The master list of all generated invoices with status tracking (Unpaid, Partial, Paid).
*   **POS (Point of Sale)**: A high-performance terminal for retail transactions. Supports multi-session billing, held bills, and customer loyalty integration.
*   **Estimates & Quotes**: For B2B or high-value sales before final billing.
*   **Customer Portfolio**: Detailed CRM module with ledger views, loyalty point tracking, and outstanding due analysis.

### 3. 📦 Purchase & Supply Chain
*   **Purchase Register**: Tracks all stock-in transactions and supplier bills.
*   **Inventory Manager**: Matrix-based stock tracking. Supports Low Stock Alerts, Aged Stock Analysis, and Warehouse Intelligence.
*   **Vendor Manager**: Supplier CRM with ledger tracking and payment-out history.
*   **GRN (Goods Received Note)**: Formal entry for physical stock reception.

### 4. 🏦 Finance & Banking Intelligence
*   **Cash/Bank Accounts**: Real-time balance tracking across multiple physical and virtual accounts.
*   **Bank Reconciliation**: An intelligent matching engine to reconcile bank statements with ERP transactions.
*   **SMS Tracker**: A unique feature that parses transaction SMS to auto-track bank activity.
*   **Budget & Goal Tracker**: Personal and business budgeting tools with progress visualization.
*   **Journal Entries**: Traditional double-entry accounting interface for complex adjustments.

### 5. 💳 Expense & Operational Spend
*   **Expense Analytics**: Category-wise breakdown of business spending.
*   **Recurring Expenses**: Automation for fixed costs like Rent, Subscriptions, and Utilities.
*   **Expense Categories**: Manager for overhead classification (COGS vs. OpEx).

### 6. 🚀 Growth & Digital Presence
*   **Growth Hub**: A central console for platform-level scaling tools.
*   **Online Store (Electronic Storefront)**: Managed e-commerce interface for digital sales.
*   **Campaign Manager**: Email, WhatsApp, and SMS marketing automation.
*   **Google Business Profile**: Direct integration for managing local SEO and reviews.

---

## 🛠️ Developer Workflow

### Module Registration
When adding a new page, register it in [src/services/ModuleRegistry.ts](file:///c:/Users/avmvi/Project/ERP/frontend/src/services/ModuleRegistry.ts). This ensures:
1.  **Lazy Loading**: The component is only loaded when needed.
2.  **Pre-fetching**: We can proactively load the chunk when the user hovers over a menu item.

### Permissions & Access
All views are guarded by [ModuleRenderer.tsx](file:///c:/Users/avmvi/Project/ERP/frontend/src/components/shared/Layout/ModuleRenderer.tsx). Use the `usePermissions` hook to check if a user role can access specific features.

### State Synchronization
We use `useTabSync` to keep the active Redux tab synchronized with the browser URL (e.g., `/?tab=FINANCE`). This ensures deep-linking works across the entire app.

---

## 🎨 Component Library (`src/components/core`)

- **Display**: Cards, Tables, and Data Visualizers.
- **Form**: Standardized inputs with industrial styling.
- **Feedback**: Skeleton loaders (`DashboardSkeleton`, `TableSkeleton`) to provide a premium feel during async operations.
