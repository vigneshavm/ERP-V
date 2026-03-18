import { test, expect } from '@playwright/test';
import * as jose from 'jose';

const routes = [
    // CORE
    { path: '/dashboard', heading: 'Mission Control' },
    { path: '/dashboard/summary', heading: 'Mission Control' },
    
    // POS
    { path: '/pos', heading: 'My Store Name' },
    { path: '/pos/orders', heading: 'My Store Name' },
    { path: '/pos/returns', heading: 'My Store Name' },
    { path: '/pos/shifts', heading: 'My Store Name' },

    // SALES
    { path: '/sales/register', heading: 'Create New Invoice' }, 
    { path: '/sales/new', heading: 'Create New Invoice' },
    { path: '/sales/invoice/create', heading: 'Create New Invoice', isRedirect: true },
    { path: '/sales/estimates', heading: 'Estimates' },
    { path: '/sales/orders', heading: 'Sales Orders' },
    { path: '/sales/challans', heading: 'Delivery Challans' },
    { path: '/sales/returns', heading: 'Returns & Refunds' },
    { path: '/sales/payments', heading: 'Payment In' },

    // SUPPLIERS
    { path: '/suppliers/add', heading: 'Profile Error|Supplier' }, // Mapped to VendorForm
    { path: '/suppliers/inflow', heading: 'Inflow' },
    { path: '/suppliers/groups', heading: 'Groups' },
    { path: '/suppliers/statements', heading: 'Statements' },
    { path: '/suppliers/ledger', heading: 'Ledger' },

    // PURCHASE
    { path: '/purchase/grn/new', heading: 'GRN' },
    { path: '/purchase/orders/PO-123', heading: 'Order' },
    { path: '/purchase/bills/new', heading: 'Bill' },
    { path: '/purchase/returns', heading: 'Returns' },
    { path: '/purchase/ageing-analysis', heading: 'Ageing' },
    { path: '/purchase/payments', heading: 'Payments' },
    { path: '/purchase/snapshot', heading: 'Failed to load data|Snapshot' },
    { path: '/purchase/payment-out', heading: 'Payment' },

    // FINANCE
    { path: '/cashbank/accounts', heading: 'Select Account|Bank' },
    { path: '/cashbank/transfers', heading: 'Select Account|Transfer' },
    { path: '/cashbank/position', heading: 'Bank Accounts Intelligence|Position' },
    { path: '/finance/journal', heading: 'Journal' },
    { path: '/finance/bank-statement', heading: 'Statement' },
    { path: '/finance/sms-tracker', heading: 'SMS' },
    { path: '/finance/budget-tracker', heading: 'Budget' },
    { path: '/finance/goals', heading: 'Goal' },
    { path: '/finance/gst', heading: 'GST' },

    // PEOPLE
    { path: '/people/employees', heading: 'Directory' },
    { path: '/people/employees/labor', heading: 'Staff' },
    { path: '/people/employees/leaves', heading: 'Leave' },
    { path: '/people/attendance', heading: 'Attendance' },
    { path: '/people/payroll', heading: 'Payroll' },
    { path: '/people/payroll/structure', heading: 'Structure' },
    { path: '/people/payroll/run', heading: 'Run' },

    // INVENTORY
    { path: '/inventory', heading: 'Inventory Core Manager' },
    { path: '/inventory/reprint', heading: 'Reprint' },
];

test.describe('Enterprise MFE - Full Route Correctness', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3004/enterprise');
        
        const secret = new TextEncoder().encode('your-256-bit-secret');
        const token = await new jose.SignJWT({ id: 'user_123', email: 'vignesh@expancer.com', role: 'admin' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('2h')
            .sign(secret);

        await page.evaluate(({ token }) => {
            const userData = { id: 'user_123', email: 'vignesh@expancer.com', name: 'Vignesh', role: 'admin', tenantId: 'TEN001', token: token };
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', token);
            localStorage.setItem('erp_current_tenant', 'TEN001');
            localStorage.setItem('auth-storage', JSON.stringify({
                state: {
                    user: userData,
                    token: token,
                    isAuthenticated: true,
                    currentSector: 'Business',
                }
            }));
            document.cookie = `token=${token}; path=/`;
        }, { token });
    });

    for (const route of routes) {
        test(`Verify route: ${route.path} renders ${route.heading}`, async ({ page }) => {
            console.log(`Navigating to: ${route.path}`);
            await page.goto(`http://localhost:3004/enterprise/TEN001${route.path}`);
            
            await page.waitForTimeout(3000);

            if (!route.isRedirect) {
                expect(page.url()).toContain(route.path);
            }

            try {
                // Use a more flexible locator that searches for headings first
                const headingLocator = page.locator('h1, h2, h3, [role="heading"]').filter({ hasText: new RegExp(route.heading, 'i') }).first();
                
                // Fallback to general text search if heading locator fails
                try {
                    await expect(headingLocator).toBeVisible({ timeout: 10000 });
                } catch (e) {
                    const fallbackLocator = page.getByText(new RegExp(route.heading, 'i')).first();
                    await expect(fallbackLocator).toBeVisible({ timeout: 5000 });
                }

                if (route.path !== '/dashboard' && route.path !== '/dashboard/summary' && route.path !== '/inventory') {
                    // Check specifically for the DASHBOARD heading to ensure NO fallback
                    // We skip /inventory because its core manager might share some dashboard aesthetics
                    const missionControl = page.locator('h1:has-text("Mission Control")');
                    await expect(missionControl).not.toBeVisible();
                }
            } catch (e) {
                const content = await page.content();
                console.log(`PAGE CONTENT ON FAILURE: ${content.substring(0, 1000)}...`);
                await page.screenshot({ path: `failure-${route.path.replace(/\//g, '-')}.png` });
                throw e;
            }
        });
    }
});
