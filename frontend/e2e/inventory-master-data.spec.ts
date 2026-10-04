import { test, expect, gotoAsAuthenticatedUser } from './fixtures';

/**
 * `/inventory/products` is now the read-only item search (InventoryVariantSearch) over the Textilesoft stock.
 * Registering a new SKU / HSN master data has no verified SQL contract, so there is no "Register SKU" button
 * (the old InventoryManager screen is not routed there any more).
 *
 * The old tests (HSN auto-fill, create product) targeted that removed screen. These pin the current behaviour.
 */
test.describe('Inventory: products page (SQL-only)', () => {
    test('shows the item search and no way to register a SKU', async ({ page }) => {
        await gotoAsAuthenticatedUser(page, '/inventory/products');

        await expect(page.getByPlaceholder(/Search by Product Name/i)).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('button', { name: /Register SKU/i })).toHaveCount(0);
    });

    test('sends no product write while browsing', async ({ page }) => {
        const writes: string[] = [];
        await page.route(/\/api\/(inventory|masters)(\/|\?|$)/, async (r) => {
            if (r.request().method() !== 'GET') writes.push(`${r.request().method()} ${r.request().url()}`);
            await r.fallback();
        });

        await gotoAsAuthenticatedUser(page, '/inventory/products');
        await expect(page.getByPlaceholder(/Search by Product Name/i)).toBeVisible({ timeout: 15000 });
        expect(writes).toEqual([]);
    });
});
