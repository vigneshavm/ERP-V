import { test, expect } from '@playwright/test';

const MOCK_INVENTORY = [
    {
        _id: 'item-1',
        name: 'Men Slim Fit Casual Shirt',
        sku: 'SHIRT-001',
        category: 'Clothing',
        brand: 'Peter England',
        size: 'M',
        color: 'Blue',
        shelfCode: 'A-03',
        shelfType: 'FULL',
        quantity: 24,
        stockQty: 24,
        unitPrice: 1299
    },
    {
        _id: 'item-2',
        name: 'Men Regular Fit Linen Shirt',
        sku: 'SHIRT-002',
        category: 'Clothing',
        brand: 'Raymond',
        size: 'L',
        color: 'White',
        shelfCode: 'B-01',
        shelfType: 'HALF',
        quantity: 15,
        stockQty: 15,
        unitPrice: 1599
    }
];

test.describe('Inventory Variant Search & Multi-Filter Suite (INV-SRCH-001 to INV-SRCH-014)', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });

        // Unified API Mocker to prevent any 401 session expiration
        await page.route('**/api/**', async (route) => {
            const url = route.request().url();

            if (url.includes('/api/inventory/brands')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['Peter England', 'Raymond']) });
            } else if (url.includes('/api/inventory/sizes')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['S', 'M', 'L', 'XL']) });
            } else if (url.includes('/api/inventory/colors')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['Blue', 'White', 'Black']) });
            } else if (url.includes('/api/inventory/shelves')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['A-03', 'B-01']) });
            } else if (url.includes('/api/inventory')) {
                let filtered = [...MOCK_INVENTORY];
                if (url.includes('search=NonExistentProduct999')) {
                    filtered = [];
                } else {
                    if (url.includes('brand=Peter+England') || url.includes('brand=Peter%20England')) {
                        filtered = filtered.filter(i => i.brand === 'Peter England');
                    }
                    if (url.includes('size=M')) {
                        filtered = filtered.filter(i => i.size === 'M');
                    }
                    if (url.includes('color=Blue')) {
                        filtered = filtered.filter(i => i.color === 'Blue');
                    }
                    if (url.includes('shelfCode=A-03')) {
                        filtered = filtered.filter(i => i.shelfCode === 'A-03');
                    }
                    if (url.includes('shelfType=FULL')) {
                        filtered = filtered.filter(i => i.shelfType === 'FULL');
                    }
                    if (url.includes('shelfType=HALF')) {
                        filtered = filtered.filter(i => i.shelfType === 'HALF');
                    }
                }
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        items: filtered,
                        total: filtered.length,
                        page: 1,
                        pages: 1
                    })
                });
            } else if (url.includes('/api/auth/profile')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        _id: '6990b7a1ae8ee1d38659a9e9',
                        name: 'Vignesh Admin',
                        email: 'vignesh@vijayalaxmi.com',
                        role: 'SUPER_ADMIN',
                        tenantId: 'demo-tenant'
                    })
                });
            } else if (url.includes('/api/tenants')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([{
                        _id: 'demo-tenant',
                        id: 'demo-tenant',
                        name: 'Vijaya Laxmi Retail',
                        status: 'ACTIVE'
                    }])
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([])
                });
            }
        });

        // Seed auth session in localStorage
        await page.addInitScript(() => {
            const userObj = {
                _id: '6990b7a1ae8ee1d38659a9e9',
                name: 'Vignesh Admin',
                email: 'vignesh@vijayalaxmi.com',
                role: 'SUPER_ADMIN',
                token: 'e2e-mock-jwt-token',
                tenantId: 'demo-tenant'
            };
            window.localStorage.setItem('user', JSON.stringify(userObj));
            window.localStorage.setItem('token', 'e2e-mock-jwt-token');
            window.localStorage.setItem('isAuthenticated', 'true');
            window.localStorage.setItem('erp_current_tenant', 'demo-tenant');
        });

        await page.goto('/inventory/search', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('input[placeholder*="Search by Product Name"]', { state: 'visible', timeout: 15000 });
    });

    test('INV-SRCH-001: Search all shirts returns shirt inventory', async ({ page }) => {
        const productInput = page.locator('input[placeholder*="Search by Product Name"]');
        await productInput.fill('Shirt');
        await page.click('button:has-text("Search Stock")');

        const rows = page.locator('tbody tr');
        await expect(rows.first()).toBeVisible();
        const firstRowText = await rows.first().textContent();
        expect(firstRowText).toContain('Shirt');
    });

    test('INV-SRCH-002: Filter by size M returns only M-size shirts', async ({ page }) => {
        const sizeSelect = page.locator('select').nth(1);
        await sizeSelect.selectOption('M');
        await page.click('button:has-text("Search Stock")');

        const sizeBadges = page.locator('tbody tr span:has-text("M")');
        await expect(sizeBadges.first()).toBeVisible();
    });

    test('INV-SRCH-003: Filter by brand Peter England', async ({ page }) => {
        const brandSelect = page.locator('select').nth(0);
        await brandSelect.selectOption('Peter England');
        await page.click('button:has-text("Search Stock")');

        const rows = page.locator('tbody tr');
        await expect(rows.first()).toContainText('Peter England');
    });

    test('INV-SRCH-004: Filter by color Blue', async ({ page }) => {
        const colorSelect = page.locator('select').nth(2);
        await colorSelect.selectOption('Blue');
        await page.click('button:has-text("Search Stock")');

        const rows = page.locator('tbody tr');
        await expect(rows.first()).toContainText('Blue');
    });

    test('INV-SRCH-005 & 006: Filter by Shelf Type (FULL vs HALF)', async ({ page }) => {
        const shelfTypeSelect = page.locator('select').nth(4);

        // FULL Shelf Test
        await shelfTypeSelect.selectOption('FULL');
        await page.click('button:has-text("Search Stock")');
        await expect(page.locator('tbody tr').first()).toContainText('FULL');

        // HALF Shelf Test
        await shelfTypeSelect.selectOption('HALF');
        await page.click('button:has-text("Search Stock")');
        await expect(page.locator('tbody tr').first()).toContainText('HALF');
    });

    test('INV-SRCH-007: Combine all filters returns exact stock (Qty 24)', async ({ page }) => {
        const productInput = page.locator('input[placeholder*="Search by Product Name"]');
        await productInput.fill('Shirt');

        await page.locator('select').nth(0).selectOption('Peter England');
        await page.locator('select').nth(1).selectOption('M');
        await page.locator('select').nth(2).selectOption('Blue');
        await page.locator('select').nth(3).selectOption('A-03');
        await page.locator('select').nth(4).selectOption('FULL');

        await page.click('button:has-text("Search Stock")');

        const rows = page.locator('tbody tr');
        await expect(rows).toHaveCount(1);
        await expect(rows.first()).toContainText('Peter England');
        await expect(rows.first()).toContainText('A-03');
        await expect(rows.first()).toContainText('24');
    });

    test('INV-SRCH-008: No matching stock shows friendly empty state', async ({ page }) => {
        const productInput = page.locator('input[placeholder*="Search by Product Name"]');
        await productInput.fill('NonExistentProduct999');
        await page.click('button:has-text("Search Stock")');

        await expect(page.locator('text=No matching inventory found')).toBeVisible();
    });

    test('INV-SRCH-013 & 014: Same shirt across multiple shelves and Clear Filters', async ({ page }) => {
        await page.click('button:has-text("Clear Filters")');
        const rows = page.locator('tbody tr');
        expect(await rows.count()).toBeGreaterThan(1);
    });
});
