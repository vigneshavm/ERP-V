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

    return {
        id: raw.invoiceNo,
        date: raw.createdAt,
        items: (raw.items || []).map((item: any) => ({
            id: item.item?._id || item.item,
            name: item.name || item.item?.name || 'Item',
            price: item.price,
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
        taxMode: raw.taxMode,
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

export const receiptDataService = {
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
