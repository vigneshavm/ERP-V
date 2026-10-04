import { test, expect, request } from '@playwright/test';

/**
 * LIVE end-to-end check of purchase barcode creation against the real backend and SSS_copy.
 * PowerShell opt-in: set E2E_LIVE, E2E_USER, E2E_PASS, E2E_COMPANY, E2E_SERIAL, and E2E_DATE_ORDER, then run `npx playwright test purchase-barcode-live`.
 * E2E_SERIAL is countername.sl_no for the selected company's grndetail.sys_name; E2E_DATE_ORDER follows year_pos, month_pos, and date_pos.
 * Optional: E2E_API=http://localhost:5000 (default), E2E_PROJECT=chrome (default chromium). Only one browser project writes a purchase.
 * Checklist: docs/audits/PURCHASE_BARCODE_E2E_CHECKLIST.md. Read-only SQL proof: scripts/sql/readonly/READONLY_PURCHASE_BARCODE_E2E_CHECK.sql.
 */
type DatePart = 'year' | 'month' | 'day';
const API = process.env.E2E_API || 'http://localhost:5000';
const rev = (s: string) => s.split('').reverse().join('');
const parseDateOrder = (value?: string): DatePart[] | undefined => {
    const order = value?.split(',').map((part) => part.trim());
    return order?.length === 3 && new Set(order).size === 3 && order.every((part) => ['year', 'month', 'day'].includes(part))
        ? order as DatePart[]
        : undefined;
};
const prefixFor = (date: string, serial: string, order: DatePart[]) => {
    const [year, month, day] = date.split('-').map(Number);
    const parts = {
        year: rev(String(year)).slice(0, 2),
        month: rev(String(month)),
        day: rev(String(day)),
    };
    return order.map((part) => parts[part]).join('') + serial;
};

test.describe('Purchase barcode creation (live)', () => {
    test.skip(process.env.E2E_LIVE !== '1', 'Set E2E_LIVE=1 and the required E2E_* settings to run; this test saves a real purchase.');

    test('saves a 3-line purchase and every line gets its own, correctly formed barcode', async (_fixtures, testInfo) => {
        test.skip(testInfo.project.name !== (process.env.E2E_PROJECT || 'chromium'), 'A live purchase is written in one browser project only.');

        const companyName = process.env.E2E_COMPANY?.trim();
        const serial = process.env.E2E_SERIAL?.trim();
        const dateOrder = parseDateOrder(process.env.E2E_DATE_ORDER);
        test.skip(!process.env.E2E_USER || !process.env.E2E_PASS || !companyName || !serial || !/^\d+$/.test(serial) || !dateOrder,
            'Set E2E_USER, E2E_PASS, E2E_COMPANY, E2E_SERIAL, and E2E_DATE_ORDER before enabling live writes.');

        const today = new Date();
        const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const api = await request.newContext({ baseURL: API });
        try {
            const login = await api.post('/api/auth/login', { data: { username: process.env.E2E_USER, password: process.env.E2E_PASS } });
            expect(login.status(), 'login').toBe(200);
            const { token } = await login.json();
            expect(token, 'login token').toBeTruthy();
            const auth = { Authorization: `Bearer ${token}` };

            const optionsResponse = await api.get('/api/purchase-entry/options', { headers: auth });
            expect(optionsResponse.ok(), 'purchase options').toBeTruthy();
            const opt = (await optionsResponse.json()).data;
            const company = opt.companies.find((c: any) => c.grnPrefix && c.name.trim().toUpperCase() === companyName!.toUpperCase());
            expect(company, `company with a GRN prefix: ${companyName}`).toBeTruthy();
            const products = opt.products.filter((p: any) => p.company === company.name).slice(0, 2);
            expect(products.length, 'at least 2 products for the company').toBeGreaterThanOrEqual(2);
            expect(opt.warehouses.length, 'at least 1 warehouse').toBeGreaterThan(0);
            expect(opt.suppliers.length, 'at least 1 supplier').toBeGreaterThan(0);

            const invoiceNo = `E2E-${Date.now()}`;
            const lines = [products[0], products[1], products[1]].map((p: any, i: number) => ({
                productCode: p.code, qty: i === 2 ? 3 : 1, prate: 100 + i, mrp: 250 + i, size: 'E2E', color: 'TEST',
            }));
            const save = await api.post('/api/purchase-entry', {
                headers: auth,
                data: { company: company.name, warehouse: opt.warehouses[0], supplier: opt.suppliers[0].name, invoiceNo, date, lines },
            });
            const body = await save.json().catch(() => ({}));
            test.skip(save.status() === 503 && body?.error?.code === 'SQL_PURCHASE_ENTRY_UNAVAILABLE',
                `Saving a GRN is paused on the server: ${body?.error?.message ?? ''}`);
            expect(save.status(), JSON.stringify(body)).toBeLessThan(300);
            const saved = body.data ?? body;
            expect(saved.grnNo, 'GRN number returned').toBeTruthy();

            const read = await api.get(`/api/purchase-entry/${encodeURIComponent(saved.grnNo)}`, { headers: auth });
            expect(read.ok(), 'saved GRN readback').toBeTruthy();
            const got = (await read.json()).data;
            expect(got.lines).toHaveLength(3);
            const prefix = prefixFor(date, serial!, dateOrder!);
            const nums: number[] = [];
            for (const line of got.lines) {
                expect(line.barcode, 'configured date prefix and counter serial').toMatch(new RegExp(`^${prefix}\\d+$`));
                expect(line.stockLinked, `stockdetails row for ${line.barcode}`).toBe(true);
                nums.push(Number(line.barcode.slice(prefix.length)));
            }
            expect(new Set(got.lines.map((line: any) => line.barcode)).size, 'distinct barcodes').toBe(3);
            const sorted = [...nums].sort((a, b) => a - b);
            expect(sorted[1] - sorted[0]).toBe(1);
            expect(sorted[2] - sorted[1]).toBe(1);
            testInfo.annotations.push({ type: 'grn', description: `${saved.grnNo}: ${got.lines.map((line: any) => line.barcode).join(', ')}` });
        } finally {
            await api.dispose();
        }
    });
});
