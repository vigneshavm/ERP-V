import { test, expect, gotoAsAuthenticatedUser } from './fixtures';
import type { ApiMock } from './helpers/mocks';

/**
 * Covers registering a new product at `/inventory/products`
 * (frontend/src/features/inventory/InventoryManager.tsx + ProductModal.tsx), including the
 * HSN Code -> GST Rate auto-fill added in erp_master_data_hsn_fix.md (picking an HSN code
 * fills GST Rate from that code's `meta.gstRate`, and it stays independently editable after).
 */

const HSN_ENTRIES = [
    { _id: 'hsn-e2e-1', name: '6109', type: 'PRODUCT_HSN', meta: { gstRate: 5 }, description: 'T-shirts, knitted' },
    { _id: 'hsn-e2e-2', name: '6203', type: 'PRODUCT_HSN', meta: { gstRate: 12 }, description: "Men's suits" },
];

const hsnMastersMock: ApiMock = {
    match: (url) => /\/api\/masters\/PRODUCT_HSN/.test(url),
    respond: (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(HSN_ENTRIES) }),
};

test.describe('Inventory: product registration & HSN/GST master data', () => {
    test.use({ apiMocks: [hsnMastersMock] });

    test('selecting an HSN code auto-fills the GST Rate', async ({ page }) => {
        await gotoAsAuthenticatedUser(page, '/inventory/products');

        await page.getByRole('button', { name: /Register SKU/i }).click();
        await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 15000 });

        const gstSelect = page.locator('select[name="gstRate"]');
        await expect(gstSelect).toHaveValue('0'); // default before any HSN is picked

        await page.locator('select[name="hsnCode"]').selectOption(HSN_ENTRIES[0].name);
        await expect(gstSelect).toHaveValue(String(HSN_ENTRIES[0].meta.gstRate));

        // GST Rate stays independently editable after the auto-fill.
        await gstSelect.selectOption('12');
        await expect(gstSelect).toHaveValue('12');
    });

    test('creates a new product with HSN and GST Rate set', async ({ page }) => {
        let createPayload: any = null;
        await page.route('**/api/inventory', async (route) => {
            if (route.request().method() !== 'POST') return route.fallback();
            createPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({ _id: 'new-item-e2e-1', ...createPayload }),
            });
        });

        await gotoAsAuthenticatedUser(page, '/inventory/products');
        await page.getByRole('button', { name: /Register SKU/i }).click();
        await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 15000 });

        await page.locator('input[name="name"]').fill('E2E Cotton Kurta');
        await page.locator('select[name="hsnCode"]').selectOption(HSN_ENTRIES[0].name);

        await page.getByRole('button', { name: /Initialize SKU/i }).click();

        await expect
            .poll(() => createPayload, { timeout: 15000, message: 'expected POST /api/inventory to fire' })
            .not.toBeNull();
        expect(createPayload.name).toBe('E2E Cotton Kurta');
        expect(createPayload.hsnCode).toBe(HSN_ENTRIES[0].name);
        expect(createPayload.gstRate).toBe(HSN_ENTRIES[0].meta.gstRate);
    });
});
