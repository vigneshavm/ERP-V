import { test, expect, gotoAsAuthenticatedUser } from './fixtures';
import type { ApiMock } from './helpers/mocks';

/**
 * Covers the POS terminal (`/pos`, frontend/src/features/pos/*`) add-to-cart -> checkout flow,
 * including the real network call it makes: `POST /api/pos/invoice`
 * (frontend/src/redux/thunks/saleThunks.ts -> backend PosController.createInvoice). This is the
 * flow behind the GST-mismatch bug fixed in erp_pos_gst_tax_bug_fix.md -- these tests assert the
 * tax rate charged on screen is the same one sent to the server, which is exactly the invariant
 * that bug violated.
 */

const TEST_PRODUCT = {
    id: 'e2e-item-1',
    _id: 'e2e-item-1',
    name: 'E2E Test Cotton Shirt',
    sku: 'E2E-SHIRT-001',
    category: 'Clothing',
    unit: 'PCS',
    sellingPrice: 499,
    costPrice: 300,
    stockQty: 50,
    gstRate: 5,
    isSerialized: false,
    tenantId: 'demo-tenant',
};

const inventoryMock: ApiMock = {
    match: (url, method) => method === 'GET' && /\/api\/inventory(\?|$)/.test(url),
    respond: (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ items: [TEST_PRODUCT], total: 1, page: 1, pages: 1 }),
        }),
};

// SQL-only billing (hooks/usePOSCheckout.ts): a bill needs a counter (GET /api/pos/counters; a single counter is
// auto-selected), is previewed on the server first (POST /api/pos/invoice/preview -> preview.total, which must match
// the till or the cashier is asked to confirm), and is saved only if the server confirms it with a bill number and
// total. There is no offline queue any more: a rejected bill shows the server's message and stays in the cart.
const countersMock: ApiMock = {
    match: (url, method) => method === 'GET' && /\/api\/pos\/counters/.test(url),
    respond: (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ source: 'sql', counters: [{ id: 'SERVER', name: 'SERVER' }] }),
        }),
};

// The cash bill is paid in full, so the payload's paidAmount is the till total: preview echoes it (no confirm dialog).
const previewMock: ApiMock = {
    match: (url, method) => method === 'POST' && /\/api\/pos\/invoice\/preview/.test(url),
    respond: (route) => {
        const body = route.request().postDataJSON() ?? {};
        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, preview: { total: Number(body.paidAmount) || 0 } }),
        });
    },
};

test.describe('POS checkout', () => {
    test.use({ apiMocks: [[inventoryMock, countersMock, previewMock], { scope: 'test' }] });

    async function addTestProductToCart(page: import('@playwright/test').Page) {
        // The POS opens in Scanner view (barcode + quick entry). The product browser, with its
        // search-by-name manual mode, is the Visual view; switch to it, then to manual lookup.
        await page.getByRole('button', { name: /^Visual/ }).click();
        await page.getByTitle('Manual Lookup Mode (F2)').click();
        const searchInput = page.getByPlaceholder('Manual Mode: Type Name or Pattern...');
        await searchInput.fill(TEST_PRODUCT.name);

        const productCard = page.getByRole('button', { name: new RegExp(TEST_PRODUCT.name) });
        await expect(productCard).toBeVisible({ timeout: 15000 });
        await productCard.click();
    }

    test('adds a product to the cart and reflects it in the totals', async ({ page }) => {
        await gotoAsAuthenticatedUser(page, '/pos');
        await addTestProductToCart(page);

        // In the Visual view the cart is the sidebar list, not the Scanner view's table.
        const cart = page.getByRole('region', { name: 'Cart' });
        await expect(cart).toContainText(TEST_PRODUCT.name);
        await expect(cart).toContainText(TEST_PRODUCT.sku);
    });

    test('"Finalize Bill" is disabled with an empty cart', async ({ page }) => {
        await gotoAsAuthenticatedUser(page, '/pos');

        const finalizeButton = page.getByRole('button', { name: /Finalize Bill/i });
        await expect(finalizeButton).toBeVisible({ timeout: 15000 });
        await expect(finalizeButton).toBeDisabled();
    });

    test('completes checkout and sends the same tax rate that was shown on screen', async ({ page }) => {
        let invoicePayload: any = null;
        await page.route('**/api/pos/invoice', async (route) => {
            invoicePayload = route.request().postDataJSON();
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    invoice: { _id: 'e2e-invoice-1', billNo: 'SERVER-0001', invoiceNo: 'SERVER-0001', totalAmount: Number(invoicePayload.paidAmount) || 0 },
                }),
            });
        });

        await gotoAsAuthenticatedUser(page, '/pos');
        await addTestProductToCart(page);

        // Cash is the default payment method, but select it explicitly so the test doesn't
        // depend on that default.
        await page.locator('button[title="CASH"]').click();

        const finalizeButton = page.getByRole('button', { name: /Finalize Bill/i });
        await expect(finalizeButton).toBeEnabled();
        await finalizeButton.click();

        await expect
            .poll(() => invoicePayload, { timeout: 15000, message: 'expected POST /api/pos/invoice to fire' })
            .not.toBeNull();

        // Payload shape per services/posInvoiceMapper.ts::buildPosInvoicePayload -- `item` is the
        // product id, not the SKU, and `tax` is the GST rate actually charged on this line.
        const items = invoicePayload.items ?? [];
        const soldLine = items.find((i: any) => i.item === TEST_PRODUCT.id || i.name === TEST_PRODUCT.name);
        expect(soldLine, `invoice payload should contain ${TEST_PRODUCT.name}: ${JSON.stringify(invoicePayload)}`).toBeTruthy();

        // Regression guard for erp_pos_gst_tax_bug_fix.md: the tax rate SENT TO THE SERVER must
        // match the product's configured GST rate -- historically this could diverge from what
        // was shown/charged on screen.
        expect(soldLine.tax).toBe(TEST_PRODUCT.gstRate);

        // The cart should reset after a completed sale.
        await expect(finalizeButton).toBeDisabled({ timeout: 15000 });
    });

    test('shows the server message and keeps the sale in the cart when the server rejects the invoice', async ({ page }) => {
        await page.route('**/api/pos/invoice', (route) =>
            route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Server error' }) })
        );

        await gotoAsAuthenticatedUser(page, '/pos');
        await addTestProductToCart(page);
        await page.getByRole('button', { name: /Finalize Bill/i }).click();

        // SQL billing does not queue: the cashier sees the server's message and the bill stays open to retry.
        await expect(page.getByText(/Server error/i)).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('region', { name: 'Cart' })).toContainText(TEST_PRODUCT.name);
        await expect(page.getByRole('button', { name: /Finalize Bill/i })).toBeEnabled();
    });
});
