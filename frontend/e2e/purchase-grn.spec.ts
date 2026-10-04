import { test, expect, gotoAsAuthenticatedUser } from './fixtures';
import type { ApiMock } from './helpers/mocks';

/**
 * Purchase entry saves a GRN into Textilesoft's tables through POST /api/purchase-entry (backend createPurchase:
 * purgrnentry + purentrydetails + stockdetails in one SQL transaction). Routed on /purchase/new and
 * /purchase/grn/new. Express entry, PO-based GRN, and GRN delete stay unavailable (no verified SQL contract).
 */
const OPTIONS = {
    companies: [{ name: 'SSS', grnPrefix: 'VJ' }],
    warehouses: ['MAIN'],
    suppliers: [{ name: 'RAMRAJ', city: 'TIRUPUR' }],
    agents: [],
    products: [{ code: '12', name: 'PANT', unit: 'PCS', group: 'MENS', gstGroup: 'GST5', hsnCode: '6203', company: 'SSS' }],
    gstGroups: [{ name: 'GST5', slabs: [{ from: 0, to: 0, gst: 5 }] }],
};

const optionsMock: ApiMock = {
    match: (url, method) => method === 'GET' && /\/api\/purchase-entry\/options/.test(url),
    respond: (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: OPTIONS }) }),
};

test.describe('Purchase entry (SQL)', () => {
    test.use({ apiMocks: [[optionsMock], { scope: 'test' }] });

    for (const route of ['/purchase/new', '/purchase/grn/new']) {
        test(`${route} opens Purchase Entry and sends no write on load`, async ({ page }) => {
            const writes: string[] = [];
            await page.route(/\/api\/(purchases|purchase-entry|grn)(\/|\?|$)/, async (r) => {
                if (r.request().method() !== 'GET') writes.push(`${r.request().method()} ${r.request().url()}`);
                await r.fallback();
            });
            await gotoAsAuthenticatedUser(page, route);
            await expect(page.getByRole('heading', { name: /Purchase Entry/i })).toBeVisible({ timeout: 15000 });
            expect(writes).toEqual([]);
        });
    }

    test('saves through POST /api/purchase-entry and shows the server GRN number', async ({ page }) => {
        let body: any;
        await page.route('**/api/purchase-entry', async (r) => {
            if (r.request().method() !== 'POST') return r.fallback();
            body = r.request().postDataJSON();
            return r.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        grnNo: 'VJ101',
                        date: '04/10/2026',
                        lines: [{ slNo: 1, barcode: '6201211', productCode: '12', productName: 'PANT', qty: 1, prate: 100, mrp: 200, netAmount: 105 }],
                        totals: { qty: 1, amount: 100, gst: 5, net: 105 },
                    },
                }),
            });
        });
        await gotoAsAuthenticatedUser(page, '/purchase/new');
        await page.locator('select').filter({ has: page.locator('option', { hasText: /12 · PANT/ }) }).first().selectOption('12');
        await page.getByPlaceholder('Type to search').first().fill('RAMRAJ');
        await page.getByText('Invoice no. *').locator('..').locator('input').fill('INV-101');
        await page.getByText(/Save purchase/).click();
        await expect(page.getByText(/VJ101/)).toBeVisible({ timeout: 15000 });
        expect(body).toMatchObject({ company: 'SSS', supplier: 'RAMRAJ', invoiceNo: 'INV-101' });
        expect(body.lines[0]).toMatchObject({ productCode: '12' });
    });
});

test.describe('Purchase workflows that stay unavailable', () => {
    for (const route of ['/purchase/express', '/purchase/grn/new/po-e2e-1']) {
        test(`${route} says unavailable and writes nothing`, async ({ page }) => {
            const writes: string[] = [];
            await page.route(/\/api\/(purchases|purchase-entry|grn)(\/|\?|$)/, async (r) => {
                if (r.request().method() !== 'GET') writes.push(`${r.request().method()} ${r.request().url()}`);
                await r.fallback();
            });
            await gotoAsAuthenticatedUser(page, route);
            await expect(page.getByRole('heading', { name: /This purchase workflow is unavailable/i })).toBeVisible({ timeout: 15000 });
            await expect(page.getByRole('link', { name: /Open Purchase Register/i })).toBeVisible();
            expect(writes).toEqual([]);
        });
    }
});
