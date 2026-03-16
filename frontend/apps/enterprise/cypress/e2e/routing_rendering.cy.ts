/// <reference types="cypress" />

describe('Enterprise MFE - Full Routing & Rendering Test', () => {
    
  // --- UTILS ---
  const verifyNotDashboard = () => {
      // The Dashboard overview typically contains generic greetings or 'Profit Pulse'/financial summaries
      cy.contains('Profit Pulse', { matchCase: false }).should('not.exist');
      cy.contains('Daily Finance Tracker', { matchCase: false }).should('not.exist');
  };

  const verifyDataRenders = () => {
      // Wait for any skeletons to disappear
      cy.get('.animate-pulse', { timeout: 10000 }).should('not.exist');
      
      // Ensure no generic "undefined" text appears in crucial areas
      cy.contains('undefined', { matchCase: false }).should('not.exist');
      cy.contains('NaN', { matchCase: false }).should('not.exist');
      
      // Assert that at least some table row, list item, or card component is present indicating data loaded
      // This generic selector looks for common UI constructs (rows, cards, active lists)
      cy.get('tr, .grid > div, [role="row"], .rounded-xl, .bg-card').should('have.length.greaterThan', 0);
  };

  const testModuleRoute = (path: string, expectedHeading: string) => {
      it(`Navigates to ${path} and renders correctly`, () => {
          cy.visit(`/enterprise${path}`);

          // Assert Dashboard didn't accidentally render (Routing correctness)
          if(expectedHeading !== 'Overview' && expectedHeading !== 'Dashboard Summary') {
              verifyNotDashboard();
          }

          // Verify the page heading/title is visible
          cy.contains(expectedHeading, { matchCase: false, timeout: 8000 }).should('be.visible');

          // Verify Mock data rendered correctly without skeleton hanging
          verifyDataRenders();
      });
  };

  // --- SETUP ---
  beforeEach(() => {
    // Assuming Auth happens via cookies or local storage. Using a programmatic bypass or standard login here
    // For local dev with mock adapter, we'll hit the landing page first to initialize state if needed
    cy.visit('/enterprise'); 
  });

  // --- PART 1 & 2: Route Correctness & Data Rendering Tests ---

  // Dashboard / General Views
  describe('Dashboard & Core', () => {
      testModuleRoute('/dashboard', 'Overview');
      testModuleRoute('/dashboard/summary', 'Daily Finance');
  });

  // POS
  describe('POS', () => {
      testModuleRoute('/pos', 'POS Terminal');
      testModuleRoute('/pos/orders', 'POS Terminal'); // Same component based on mapping
      testModuleRoute('/pos/returns', 'POS Terminal');
  });

  // Sales
  describe('Sales', () => {
      testModuleRoute('/sales/register', 'Sales Register'); // Or whatever the heading is
      testModuleRoute('/sales/new', 'New Invoice');
      testModuleRoute('/sales/estimates', 'Estimates');
      testModuleRoute('/sales/orders', 'Sales Orders');
      testModuleRoute('/sales/challans', 'Delivery Challans');
      testModuleRoute('/sales/returns', 'Sales Returns');
      testModuleRoute('/sales/payments', 'Payment In');
      testModuleRoute('/sales/credits', 'Customer Credits');
      testModuleRoute('/sales/dues', 'Outstanding Dues');
  });

  // Purchase
  describe('Purchase', () => {
      testModuleRoute('/purchase/register', 'Purchase Register');
      testModuleRoute('/purchase/new', 'Purchase Entry');
      testModuleRoute('/purchase/orders', 'Purchase Orders');
      testModuleRoute('/purchase/orders/list', 'Purchase Orders'); // Or List
      testModuleRoute('/purchase/grn', 'Goods Received');
      testModuleRoute('/purchase/bills', 'Purchase Bills');
      testModuleRoute('/purchase/history', 'Purchase History');
      testModuleRoute('/purchase/returns', 'Purchase Returns');
      testModuleRoute('/purchase/debit-notes', 'Debit Notes');
      testModuleRoute('/purchase/payments', 'Supplier Payments');
      testModuleRoute('/purchase/payment-out', 'Payment Out');
      testModuleRoute('/purchase/payables', 'Outstanding Payables');
      testModuleRoute('/purchase/rate-revisions', 'Rate Revisions');
      testModuleRoute('/purchase/cheques-vault', 'PDC Vault');
      testModuleRoute('/purchase/inflow-outflow', 'Vendor Cashflow');
  });

  // Inventory
  describe('Inventory', () => {
      testModuleRoute('/inventory/items', 'Inventory Items'); // Matches InventoryManager/Dashboard title
      testModuleRoute('/inventory/categories', 'Categories');
      testModuleRoute('/inventory/barcodes', 'Barcode');
      testModuleRoute('/inventory/import', 'Import');
      testModuleRoute('/inventory/reprint', 'Reprint Queue');
      testModuleRoute('/inventory/export', 'Export');
  });

  // Finance / Cashbank
  describe('Finance & Cashbank', () => {
      testModuleRoute('/finance/cash', 'Cash Accounts');
      testModuleRoute('/cashbank/accounts', 'Bank Accounts');
      testModuleRoute('/finance/petty-cash', 'Petty Cash');
      testModuleRoute('/finance/transfers', 'Fund Transfers');
      testModuleRoute('/finance/reconciliation', 'Reconciliation');
      testModuleRoute('/finance/loans', 'Loan Accounts');
      testModuleRoute('/finance/goals', 'Financial Goals');
      testModuleRoute('/finance/bank-statement', 'Bank Statement');
      testModuleRoute('/finance/sms-tracker', 'SMS Tracker');
      testModuleRoute('/finance/gst', 'GST');
      testModuleRoute('/finance/journal', 'Journal Entries');
      testModuleRoute('/finance/budget-tracker', 'Budget Tracker');
  });

  // Expenses
  describe('Expenses', () => {
      testModuleRoute('/expenses/tracker', 'Expense Tracker');
      testModuleRoute('/expenses/categories', 'Expense Categories');
      testModuleRoute('/expenses/recurring', 'Recurring Expenses');
      testModuleRoute('/expenses/reports', 'Expense Reports');
  });

  // People / Contacts
  describe('People & Contacts', () => {
      testModuleRoute('/customers', 'Customers');
      testModuleRoute('/customers/ledger', 'Customer Ledger');
      testModuleRoute('/suppliers', 'Suppliers');
      testModuleRoute('/suppliers/ledger', 'Supplier Ledger');
      testModuleRoute('/people/employees/labor', 'Staff Manager');
      testModuleRoute('/people/payroll', 'Payroll');
      testModuleRoute('/people/employees/allowances', 'Allowances');
      testModuleRoute('/people/payroll/attendance', 'Attendance Summary');
      testModuleRoute('/people/attendance', 'Attendance Board');
  });

  // Settings
  describe('Settings', () => {
      testModuleRoute('/settings', 'Settings');
      testModuleRoute('/settings/sync', 'Sync Settings');
      testModuleRoute('/settings/tenants', 'Tenant Management');
      testModuleRoute('/settings/audit', 'Audit Logs');
  });

  // --- PART 3: Catch-all Route Guard ---
  describe('Wildcard Fallback', () => {
      it('Resolves unknown nested paths to the corresponding module rather than generic Dashboard fallback', () => {
          // This path doesn't precisely exist in the defined routes, but belongs to the /sales/ tree.
          // The router wildcard * element should call renderContent(), which grabs activeTab from url via Context.
          cy.visit('/enterprise/sales/magical-unknown');
          
          // Verify that the view resolver accurately falls back to the high-level domain "SALES" instead of generic App Home
          // Depends on the 'SALES' view rendering a generic sales menu/overview
          cy.contains('Sales', { matchCase: false, timeout: 8000 }).should('be.visible');
          verifyNotDashboard();
      });
  });

});
