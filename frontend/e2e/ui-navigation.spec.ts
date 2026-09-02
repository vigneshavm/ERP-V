import { test, expect } from '@playwright/test';

// Define key ERP routes to navigate and verify UI alignment
const ROUTES_TO_TEST = [
  { name: 'Dashboard / Home', path: '/' },
  { name: 'Sales Invoices', path: '/sales/invoices' },
  { name: 'Sales Orders', path: '/sales/orders' },
  { name: 'Sales Estimates', path: '/sales/estimates' },
  { name: 'Sales Delivery Challans', path: '/sales/challans' },
  { name: 'Sales Returns', path: '/sales/returns' },
  { name: 'Sales Payments', path: '/sales/payments' },
  { name: 'Purchase Register', path: '/purchase/register' },
  { name: 'Purchase Bills', path: '/purchase/bills' },
  { name: 'Purchase Returns', path: '/purchase/returns' },
  { name: 'Suppliers List', path: '/suppliers' },
  { name: 'Supplier Groups', path: '/suppliers/groups' },
  { name: 'Bank Accounts', path: '/cashbank/accounts' },
  { name: 'Cash Transfers', path: '/cashbank/transfers' },
  { name: 'Cash in Hand', path: '/cashbank/cash-in-hand' },
  { name: 'Cash & Bank Position', path: '/cashbank/position' },
  { name: 'Journal Entries', path: '/finance/journal' },
  { name: 'Bank Statement', path: '/finance/bank-statement' },
  { name: 'SMS Tracker', path: '/finance/sms-tracker' },
  { name: 'Finance Agent Dashboard', path: '/finance/agents' },
];

test.describe('ERP UI Alignment & Navigation Verification Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to standard desktop resolution
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  for (const route of ROUTES_TO_TEST) {
    test(`Navigate to ${route.name} (${route.path}) and verify UI alignment`, async ({ page }) => {
      // 1. Navigate to route
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 15000 });
      expect(response?.status()).toBeLessThan(400);

      // 2. Wait for page layout container to render
      await page.waitForTimeout(1000);

      // 3. Verify page is not completely blank (has body content)
      const bodyContent = await page.textContent('body');
      expect(bodyContent).not.toBeNull();
      expect(bodyContent?.trim().length).toBeGreaterThan(0);

      // 4. Verify UI Layout Alignment (Check no horizontal viewport overflow)
      const isOverflowing = await page.evaluate(() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        return scrollWidth > clientWidth + 10; // Allow 10px buffer for scrollbar styling
      });

      expect(isOverflowing).toBe(false);

      // 5. Verify layout structure components (e.g. sidebar navigation presence if logged in / loaded)
      const bodyHasLayout = await page.evaluate(() => {
        return document.querySelector('aside') !== null || document.querySelector('nav') !== null || document.querySelector('main') !== null || document.querySelector('#root') !== null;
      });
      expect(bodyHasLayout).toBe(true);
    });
  }

  test('Verify Responsive Mobile Viewport Alignment on Dashboard', async ({ page }) => {
    // Set viewport to standard mobile phone screen width
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const isMobileOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 10;
    });

    expect(isMobileOverflowing).toBe(false);
  });
});
