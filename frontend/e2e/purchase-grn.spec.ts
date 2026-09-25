import { test, expect, gotoAsAuthenticatedUser } from './fixtures';
import type { ApiMock } from './helpers/mocks';

/**
 * Covers the Purchase Entry -> GRN (goods receipt) chain:
 *   frontend/src/features/purchase/PurchaseEntry.tsx  (`/purchase/new`, POST /api/purchases)
 *   frontend/src/features/purchase/GRNForm.tsx         (`/purchase/grn/new/:poId`, POST /api/grn)
 *
 * Per erp_purchase_grn_validation.md, a PO can only be received against once it's
 * SENT_TO_VENDOR or PARTIALLY_RECEIVED, and GRNForm resolves `poId` from the already-loaded
 * `state.purchase.orders` list (populated by `GET /api/purchases`) rather than fetching the PO
 * itself -- so the GRN test mocks that list endpoint with a receivable PO already in it.
 */

const SUPPLIER = {
    _id: 'sup-e2e-1',
    businessName: 'Acme Textiles Pvt Ltd',
    contactNo: '9876543210',
    state: 'TN',
};

const CATALOG_PRODUCT = {
    id: 'e2e-item-1',
    _id: 'e2e-item-1',
    name: 'E2E Purchase Fabric',
    sku: 'E2E-FAB-001',
    category: 'Raw Material',
    unit: 'Meter',
    sellingPrice: 350,
    costPrice: 250,
    stockQty: 0,
    gstRate: 5,
    tenantId: 'demo-tenant',
};

const RECEIVABLE_PO = {
    _id: 'po-e2e-1',
    id: 'po-e2e-1',
    po_number: 'PO-E2E-0001',
    vendor_id: SUPPLIER._id,
    vendor_name: SUPPLIER.businessName,
    status: 'SENT_TO_VENDOR',
    total_amount: 5000,
    items: [
        {
            product_id: CATALOG_PRODUCT.id,
            product_name: CATALOG_PRODUCT.name,
            sku: CATALOG_PRODUCT.sku,
            quantity: 20,
            rate: 250,
            tax_percent: 5,
            received_quantity: 0,
        },
    ],
};

const suppliersMock: ApiMock = {
    match: (url) => url.includes('/api/purchases/suppliers'),
    respond: (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([SUPPLIER]) }),
};

const catalogMock: ApiMock = {
    match: (url, method) => method === 'GET' && /\/api\/inventory(\?|$)/.test(url),
    respond: (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ items: [CATALOG_PRODUCT], total: 1, page: 1, pages: 1 }),
        }),
};

test.describe('Purchase Entry', () => {
    // Wrapped as [value, options]: Playwright reads a bare array given to test.use as that pair,
    // which turned this list into the single object suppliersMock ("extraMocks is not iterable").
    test.use({ apiMocks: [[suppliersMock, catalogMock], { scope: 'test' }] });

    test('blocks saving a purchase with no supplier selected', async ({ page }) => {
        await gotoAsAuthenticatedUser(page, '/purchase/new');

        await page.getByRole('button', { name: /Complete Purchase/i }).click();

        await expect(page.getByText('Please select a supplier from the list first.')).toBeVisible();
    });

    test('creates a purchase against an existing catalog item', async ({ page }) => {
        let purchasePayload: any = null;
        await page.route('**/api/purchases', async (route) => {
            if (route.request().method() !== 'POST') return route.fallback();
            purchasePayload = route.request().postDataJSON();
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({ purchase_number: 'PUR-E2E-0001' }),
            });
        });

        await gotoAsAuthenticatedUser(page, '/purchase/new');

        // 1. Pick the supplier from the type-ahead.
        await page.getByPlaceholder('Type to search...').fill(SUPPLIER.businessName.slice(0, 6));
        await page.getByText(SUPPLIER.businessName, { exact: true }).click();
        await expect(page.getByText('Supplier Selected')).toBeVisible();

        // 2. Add a line and pick the existing catalog product (rather than typing a brand-new
        // one), matching the Gap 1 fix in erp_purchase_grn_validation.md -- this links the line
        // to the real Item instead of creating a duplicate on save.
        await page.getByRole('button', { name: /^Add Item$/i }).click();
        await page.getByPlaceholder('Search item...').last().fill('E2E Purchase');
        await expect(page.getByText('Existing Products')).toBeVisible({ timeout: 10000 });
        await page.getByText(CATALOG_PRODUCT.name, { exact: false }).first().click();

        // 3. Save.
        await page.getByRole('button', { name: /Complete Purchase/i }).click();

        await expect(page.getByText(/Completed Successfully/i)).toBeVisible({ timeout: 15000 });
        expect(purchasePayload).not.toBeNull();
        expect(purchasePayload.p_vendor_id).toBe(SUPPLIER._id);
        expect(purchasePayload.items).toContainEqual(
            expect.objectContaining({ product_id: CATALOG_PRODUCT.id, product_name: CATALOG_PRODUCT.name })
        );
    });
});

test.describe('GRN (Goods Receipt)', () => {
    const ordersMock: ApiMock = {
        match: (url, method) => method === 'GET' && /\/api\/purchases(\?|$)/.test(url),
        respond: (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([RECEIVABLE_PO]) }),
    };

    test.use({ apiMocks: [ordersMock] });

    test('receives a PO and posts the accepted quantities to /api/grn', async ({ page }) => {
        let grnPayload: any = null;
        await page.route('**/api/grn', async (route) => {
            if (route.request().method() !== 'POST') return route.fallback();
            grnPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: 'Goods received',
                    grn: { _id: 'grn-e2e-1', grnNumber: 'GRN-E2E-0001', purchaseId: RECEIVABLE_PO._id, items: [] },
                }),
            });
        });

        await gotoAsAuthenticatedUser(page, `/purchase/grn/new/${RECEIVABLE_PO.id}`);

        // The PO's outstanding quantity should have pre-filled the items table.
        await expect(page.locator('body')).toContainText(CATALOG_PRODUCT.name, { timeout: 15000 });

        await page.getByRole('button', { name: /Authorize & Receive/i }).click();

        await expect
            .poll(() => grnPayload, { timeout: 15000, message: 'expected POST /api/grn to fire' })
            .not.toBeNull();
        expect(grnPayload.purchaseId).toBe(RECEIVABLE_PO.id);
        expect(grnPayload.items).toContainEqual(
            expect.objectContaining({ productId: CATALOG_PRODUCT.id, receivedQty: 20 })
        );
    });

    test('a PO still in DRAFT is not offered for receiving', async ({ page }) => {
        await page.route('**/api/purchases', (route) => {
            if (route.request().method() !== 'GET') return route.fallback();
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{ ...RECEIVABLE_PO, status: 'DRAFT' }]),
            });
        });

        await gotoAsAuthenticatedUser(page, '/purchase/grn/new');

        // GRNGeneralInfo's PO picker (a native <select>) is driven by `availablePOs`, which
        // filters to SENT_TO_VENDOR/PARTIALLY_RECEIVED only (see useGRNForm.ts) -- a draft PO
        // must not appear as a selectable <option>. Checking <option> presence directly (rather
        // than visibility) because collapsed <select> options aren't independently "visible".
        await expect(page.locator('option', { hasText: RECEIVABLE_PO.po_number })).toHaveCount(0);
    });
});
