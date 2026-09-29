import api from './api';
import { Sale } from '../types/sales';
import { Tenant, Branch } from '../types/tenant';
import { Sector } from '../types/common';

export interface ReceiptContext {
    sale: Sale;
    tenant: Tenant;
    branch: Branch;
}

// Raw backend Invoice document shape (see backend/src/interfaces/IInvoice.ts) -- distinct from
// the frontend Sale shape generateReceiptJSON expects (id/date/total/customerName vs
// invoiceNo/createdAt/totalAmount/customer). normalizeSaleResponse bridges the two rather than
// assuming the API response is already Sale-shaped; a response that already looks like a Sale
// (has `.id`, e.g. an offline-queued sale replayed locally, or a test double) passes through
// unchanged.
const normalizeSaleResponse = (raw: any): Sale => {
    if (!raw.invoiceNo) return raw as Sale;
    // Shop-database bills (source 'sql') are GST-inclusive and their line `price` is the ex-GST rate;
    // the receipt needs the price as charged, i.e. line total / quantity.
    const fromSql = raw.source === 'sql';

    return {
        id: raw.invoiceNo,
        date: raw.createdAt,
        items: (raw.items || []).map((item: any) => ({
            id: item.item?._id || item.item,
            name: item.name || item.item?.name || 'Item',
            price: fromSql && item.quantity ? item.total / item.quantity : item.price,
            qty: item.quantity,
            gstRate: item.gstRate ?? item.tax,
            discount: item.discount ?? 0
        })),
        total: raw.totalAmount,
        subtotal: raw.subtotal,
        discountAmount: raw.discount ?? raw.discountAmount ?? 0,
        customerName: raw.customer?.name,
        customerId: raw.customer?._id || raw.customer,
        sector: Sector.GENERAL,
        taxMode: raw.taxMode ?? (fromSql ? 'INCLUSIVE' : undefined),
        status: 'COMPLETED',
        paymentStatus: raw.paymentStatus
    };
};

// Raw backend BusinessProfile response (see BusinessController.getProfile) -- flat
// businessName/address/phone/gstNumber fields, distinct from the frontend Tenant shape's
// nested companyDetails/taxDetails. A response that's already Tenant-shaped (has
// `.companyDetails`, e.g. a test double) passes through unchanged.
const normalizeTenantResponse = (raw: any): Tenant => {
    if (raw.companyDetails) return raw as Tenant;

    return {
        id: raw._id || raw.userId,
        name: raw.businessName,
        sector: Sector.GENERAL,
        companyDetails: {
            addressLine1: raw.address || raw.tenantAddress || '',
            phone: raw.phone || '',
            city: '', state: '', stateCode: '', country: 'India', pincode: '', email: raw.email || ''
        },
        taxDetails: {
            gstin: raw.gstNumber || '',
            taxSystem: 'GST',
            isGstEnabled: Boolean(raw.gstNumber)
        }
    };
};

// Used when the branch list can't be loaded: no address/phone of its own, so the receipt falls
// back to the business profile's details (see generateReceiptJSON) instead of invented ones.
const EMPTY_BRANCH: Branch = { id: '', name: '', city: '', address: '' };

// A bill found by the POS "today's bill no." lookup (summary from the invoice list).
export interface TodaysBillMatch {
    _id: string;
    invoiceNo: string;
    createdAt: string;
    totalAmount: number;
    customerName?: string;
    counterName?: string;
}

const isToday = (value: string | Date | undefined): boolean => {
    if (!value) return false;
    const d = new Date(value);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

export const receiptDataService = {
    /**
     * Finds TODAY's bills matching a bill number, from the same list the Daily Sales drill-down uses
     * (GET /api/reports/shop-sales/day-bills): the shop database's bills (dbo.sales2) in SQL mode, else the
     * ERP's own invoices. A plain number ("96" / "0096") matches the number at the end of the bill number
     * (A96, INV-2026-00096); anything else (e.g. "A96") must match the whole bill number. Only bills the
     * server has are found (a bill still in the offline queue isn't there yet).
     */
    findTodaysBills: async (query: string): Promise<TodaysBillMatch[]> => {
        const q = query.trim().replace(/^#/, '');
        if (!q) return [];
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const res = await api.get('/api/reports/shop-sales/day-bills', { params: { date: today } });
        const rows: any[] = Array.isArray(res?.data?.rows) ? res.data.rows : [];
        const isNumber = /^\d+$/.test(q);
        const tailNumber = (no: string): number | null => {
            const m = no.match(/(\d+)$/);
            return m ? Number(m[1]) : null;
        };

        return rows
            .filter(inv => !inv.cancelled && isToday(inv.createdAt))
            .filter(inv => {
                const no = String(inv.invoiceNo || '');
                if (no.toLowerCase() === q.toLowerCase()) return true;
                return isNumber && tailNumber(no) === Number(q);
            })
            .map(inv => ({
                _id: String(inv._id),
                invoiceNo: String(inv.invoiceNo),
                createdAt: inv.createdAt,
                totalAmount: Number(inv.totalAmount) || 0,
                customerName: inv.customer?.name,
                counterName: inv.counterName
            }));
    },

    /** Loads one saved invoice by its database id, in the Sale shape the receipt printer uses. */
    fetchSale: async (invoiceId: string): Promise<Sale> => {
        const res = await api.get(`/api/sales-invoice/invoice/${invoiceId}`);
        const raw = res?.data?.data || res?.data;
        if (!raw) throw new Error(`Could not load invoice ${invoiceId}.`);
        return normalizeSaleResponse(raw);
    },

    /**
     * Fetches the live receipt context (Sale, Tenant, Branch) for an invoice --
     * GET /api/sales-invoice/invoice/:id, /api/business/profile, /api/branches (see those
     * routes/controllers for the response shapes normalizeSaleResponse/normalizeTenantResponse adapt).
     *
     * Throws when the invoice or the business profile can't be loaded: a receipt with invented
     * line items, totals, shop name or GSTIN is worse than an error. Only the branch is optional;
     * without it the receipt uses the business profile's address and phone.
     */
    fetchReceiptContext: async (saleId: string): Promise<ReceiptContext> => {
        const [saleRes, tenantRes, branchRes] = await Promise.all([
            api.get(`/api/sales-invoice/invoice/${saleId}`).catch(() => null),
            api.get('/api/business/profile').catch(() => null),
            api.get('/api/branches').catch(() => null)
        ]);

        const rawSale = saleRes?.data?.data || saleRes?.data;
        const rawProfile = tenantRes?.data?.data || tenantRes?.data;
        const branches = branchRes?.data?.branches || branchRes?.data;

        if (!rawSale) {
            throw new Error(`Could not load invoice ${saleId} to build its receipt.`);
        }
        if (!rawProfile) {
            throw new Error('Could not load the business profile for the receipt header.');
        }

        return {
            sale: normalizeSaleResponse(rawSale),
            tenant: normalizeTenantResponse(rawProfile),
            branch: Array.isArray(branches) && branches.length > 0 ? branches[0] : EMPTY_BRANCH
        };
    }
};

export default receiptDataService;
