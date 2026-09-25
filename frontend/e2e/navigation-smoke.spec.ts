import { test, expect } from './fixtures';

/**
 * Broad route-level smoke coverage, in the same spirit as the pre-existing
 * `e2e/ui-navigation.spec.ts` (status < 400, non-blank body, no horizontal overflow, some layout
 * chrome present) but for the modules THAT file doesn't already touch -- dashboard, inventory,
 * POS, HR/payroll, customers, expenses, marketing, reports, system settings, and more of
 * purchase/procurement. Together the two files smoke-test every module in the sidebar.
 *
 * Every path below is a real, explicit `<Route>` in
 * frontend/src/components/shared/Layout/RouteDefinitions.tsx -- NOT a nav-menu key resolved only
 * through ModuleRenderer's switch-statement fallback. Per erp_purchase_grn_validation.md, that
 * distinction matters: a nav item can exist without a matching `<Route>` and still "work" via the
 * wildcard fallback, but navigating to its URL directly (as these tests do) only succeeds for
 * paths that have a real `<Route>` entry.
 */
const ROUTES_TO_TEST = [
    { name: 'Dashboard Summary', path: '/dashboard/summary' },

    { name: 'Inventory Products', path: '/inventory/products' },
    { name: 'Inventory Categories', path: '/inventory/categories' },
    { name: 'Inventory Aged Stock', path: '/inventory/aged-stock' },
    { name: 'Inventory Batch Price Update', path: '/inventory/batch-price' },
    { name: 'Inventory Search', path: '/inventory/search' },
    { name: 'Inventory Reprint Queue', path: '/inventory/reprint' },

    { name: 'POS Terminal', path: '/pos' },
    { name: 'POS Orders', path: '/pos/orders' },
    { name: 'POS Returns', path: '/pos/returns' },
    { name: 'POS Shift Management', path: '/pos/shifts' },
    { name: 'POS Cash Drawer', path: '/pos/cash-drawer' },

    { name: 'Purchase Entry (new)', path: '/purchase/new' },
    { name: 'Purchase Payments', path: '/purchase/payments' },
    { name: 'Purchase Payment Out', path: '/purchase/payment-out' },
    { name: 'Purchase Snapshot', path: '/purchase/snapshot' },
    { name: 'Purchase Cheques Vault', path: '/purchase/cheques-vault' },
    { name: 'Purchase Rate Revisions', path: '/purchase/rate-revisions' },
    { name: 'Purchase Ageing Analysis', path: '/purchase/ageing-analysis' },

    { name: 'Employees', path: '/people/employees' },
    { name: 'Employee Staff', path: '/people/employees/staff' },
    { name: 'Employee Allowances', path: '/people/employees/allowances' },
    { name: 'Payroll', path: '/people/payroll' },
    { name: 'Payroll Attendance', path: '/people/payroll/attendance' },
    { name: 'Payroll Structure', path: '/people/payroll/structure' },

    { name: 'Customers', path: '/customers' },

    { name: 'Expenses', path: '/expenses' },
    { name: 'Expense Categories', path: '/expenses/categories' },
    { name: 'Daily Expenses', path: '/expenses/daily' },
    { name: 'Recurring Expenses', path: '/expenses/recurring' },
    { name: 'Expense Tracker', path: '/expenses/tracker' },
    { name: 'Expense Reports', path: '/expenses/reports' },

    { name: 'Marketing', path: '/marketing' },
    { name: 'Customer Engagement', path: '/engagement' },

    { name: 'Reports', path: '/reports' },
    { name: 'Reports Insights', path: '/reports/insights' },

    { name: 'System', path: '/system' },
    { name: 'Settings', path: '/settings' },
];

for (const route of ROUTES_TO_TEST) {
    test(`Navigate to ${route.name} (${route.path})`, async ({ page }) => {
        const response = await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 15000 });
        expect(response?.status()).toBeLessThan(400);

        await page.waitForTimeout(1000);

        const bodyContent = await page.textContent('body');
        expect(bodyContent).not.toBeNull();
        expect(bodyContent?.trim().length).toBeGreaterThan(0);

        const isOverflowing = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth + 10;
        });
        expect(isOverflowing).toBe(false);

        const hasLayout = await page.evaluate(() => {
            return (
                document.querySelector('aside') !== null ||
                document.querySelector('nav') !== null ||
                document.querySelector('main') !== null ||
                document.querySelector('#root') !== null
            );
        });
        expect(hasLayout).toBe(true);
    });
}
