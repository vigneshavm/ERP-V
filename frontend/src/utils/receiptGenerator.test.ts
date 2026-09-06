import { describe, it, expect, vi } from 'vitest';
import { generateReceiptJSON } from './receiptGenerator';
import { TaxMode } from '../types/common';
import receiptDataService, {
    buildDynamicTenant,
    buildDynamicBranch,
    buildDynamicSale
} from '../services/receiptDataService';
import api from '../services/api';

describe('receiptGenerator (Dynamic DB/API Data Context)', () => {
    it('generates receipt JSON correctly from dynamically constructed sale data', () => {
        const tenant = buildDynamicTenant();
        const branch = buildDynamicBranch();
        const sale = buildDynamicSale();

        const result = generateReceiptJSON(sale, tenant, branch);
        expect(result).toBeDefined();
        expect(result.receipt_data).toBeDefined();
        expect(result.printing_instructions).toBeDefined();
    });

    it('accurately maps dynamic header and transaction metadata', () => {
        const tenant = buildDynamicTenant({
            name: 'Vijayalakshmi Textiles & Readymades',
            taxDetails: { gstin: '33AFNPA6099M1ZZ', taxSystem: 'GST', isGstEnabled: true }
        });
        const branch = buildDynamicBranch({
            name: 'Main Branch',
            address: 'Mela Periya Veethi, Mukkudal',
            phone: '04634-274206'
        });
        const sale = buildDynamicSale({
            id: 'A42-206704',
            date: '2026-01-12T11:31:04',
            customerName: 'KATE'
        });

        const result = generateReceiptJSON(sale, tenant, branch);
        const { header, transaction_details, totals } = result.receipt_data;

        expect(header.store_name).toBe('Vijayalakshmi Textiles & Readymades');
        expect(header.store_address).toBe('Mela Periya Veethi, Mukkudal');
        expect(header.store_phone).toBe('04634-274206');
        expect(header.gstin).toBe('33AFNPA6099M1ZZ');

        expect(transaction_details.cash_no).toBe('A42');
        expect(transaction_details.bill_no).toBe('206704');
        expect(transaction_details.customer_name).toBe('KATE');
        expect(transaction_details.date).toBe('12/01/2026');

        expect(totals.total_quantity).toBe(3);
        expect(totals.final_total).toBe(450.00);
        expect(totals.net_total).toBe(450.00);
    });

    it('correctly includes subtotal and discount total in receipt JSON when discount is applied', () => {
        const tenant = buildDynamicTenant();
        const branch = buildDynamicBranch();
        const sale = buildDynamicSale(
            { total: 400, discountAmount: 50 },
            [
                { id: '1', price: 100, qty: 2, discount: 10 }, // Gross 200, item discount 20
                { id: '2', price: 250, qty: 1, discount: 0 }   // Gross 250, item discount 0
            ]
        );

        const result = generateReceiptJSON(sale, tenant, branch);
        const { totals, items } = result.receipt_data;

        // Gross total: 200 + 250 = 450
        // Item discounts (20) + Bill discount (50) = 70 discount_total
        expect(totals.subtotal).toBe(450);
        expect(totals.discount_total).toBe(70);
        expect(totals.final_total).toBe(400);
        expect(items[0].discount).toBe(10);
    });

    it('calculates dynamic inclusive GST breakdown correctly', () => {
        const tenant = buildDynamicTenant();
        const branch = buildDynamicBranch();
        const sale = buildDynamicSale({ taxMode: TaxMode.INCLUSIVE });

        const result = generateReceiptJSON(sale, tenant, branch);
        const { tax_details } = result.receipt_data;

        // 450 / 1.05 = 428.5714 -> 428.57 taxable
        expect(tax_details.gst_percentage).toBe(5);
        expect(tax_details.taxable_value).toBe(428.57);
        expect(tax_details.cgst_amount).toBe(10.71);
        expect(tax_details.sgst_amount).toBe(10.71);
    });

    it('calculates dynamic exclusive GST breakdown correctly', () => {
        const tenant = buildDynamicTenant();
        const branch = buildDynamicBranch();
        const sale = buildDynamicSale(
            { taxMode: TaxMode.EXCLUSIVE, total: 450 },
            [
                { price: 100, qty: 2, gstRate: 5 }, // 200 * 5% = 10 tax
                { price: 250, qty: 1, gstRate: 5 }  // 250 * 5% = 12.5 tax
            ]
        );

        const result = generateReceiptJSON(sale, tenant, branch);
        const { tax_details } = result.receipt_data;

        expect(tax_details.taxable_value).toBe(450);
        expect(tax_details.cgst_amount).toBe(11.25);
        expect(tax_details.sgst_amount).toBe(11.25);
    });

    it('handles dynamic multi-slab GST items on receipts', () => {
        const tenant = buildDynamicTenant();
        const branch = buildDynamicBranch();
        const sale = buildDynamicSale(
            { taxMode: TaxMode.INCLUSIVE, total: 300 },
            [
                { id: '1', price: 100, qty: 1, gstRate: 5 },  // Taxable: 95.24, Tax: 4.76
                { id: '2', price: 200, qty: 1, gstRate: 12 }  // Taxable: 178.57, Tax: 21.43
            ]
        );

        const result = generateReceiptJSON(sale, tenant, branch);
        const slabs = result.receipt_data.tax_details.gst_slabs;

        expect(slabs).toHaveLength(2);

        const slab5 = slabs?.find(s => s.rate === 5);
        expect(slab5).toEqual({
            rate: 5,
            taxableValue: 95.24,
            cgst: 2.38,
            sgst: 2.38
        });

        const slab12 = slabs?.find(s => s.rate === 12);
        expect(slab12).toEqual({
            rate: 12,
            taxableValue: 178.57,
            cgst: 10.71,
            sgst: 10.71
        });
    });

    it('customizes footer messages via receipt options', () => {
        const tenant = buildDynamicTenant();
        const branch = buildDynamicBranch();
        const sale = buildDynamicSale();
        const options = {
            footerMessage1: 'No returns on discounted items',
            footerMessage2: 'Thank you for shopping!'
        };

        const result = generateReceiptJSON(sale, tenant, branch, options);
        expect(result.receipt_data.footer.message_1).toBe('No returns on discounted items');
        expect(result.receipt_data.footer.message_2).toBe('Thank you for shopping!');
    });

    it('fetches context dynamically via receiptDataService with API fallback', async () => {
        // receiptDataService.fetchReceiptContext calls the real invoice-by-id route
        // (GET /api/sales-invoice/invoice/:id -- see SalesInvoiceController.getSalesInvoiceById),
        // which returns an already-Sale-shaped double here (normalizeSaleResponse passes a
        // response through unchanged when it has `.id` rather than `.invoiceNo`).
        vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
            if (url.includes('/api/sales-invoice/invoice/BILL-999')) {
                return {
                    data: {
                        data: buildDynamicSale({ id: 'A01-BILL-999', customerName: 'DYNAMIC_USER' })
                    }
                } as any;
            }
            return { data: { data: null } } as any;
        });

        const context = await receiptDataService.fetchReceiptContext('BILL-999');
        expect(context.sale.id).toBe('A01-BILL-999');
        expect(context.sale.customerName).toBe('DYNAMIC_USER');

        const result = generateReceiptJSON(context.sale, context.tenant, context.branch);
        expect(result.receipt_data.transaction_details.bill_no).toBe('BILL-999');
        expect(result.receipt_data.transaction_details.customer_name).toBe('DYNAMIC_USER');

        vi.restoreAllMocks();
    });
});
