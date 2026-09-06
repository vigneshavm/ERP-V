import api from './api';
import { Sale, CartItem } from '../types/sales';
import { Tenant, Branch } from '../types/tenant';
import { Sector, TaxMode } from '../types/common';

export interface ReceiptContext {
    sale: Sale;
    tenant: Tenant;
    branch: Branch;
}

/**
 * Builds a dynamic Tenant object with sensible defaults and optional overrides.
 */
export const buildDynamicTenant = (overrides?: Partial<Tenant>): Tenant => {
    return {
        id: 'T-DYN-001',
        name: 'Vijayalakshmi Textiles & Readymades',
        sector: Sector.TEXTILE,
        companyDetails: {
            addressLine1: 'Mela Periya Veethi, Mukkudal',
            phone: '04634-274206',
            city: 'Mukkudal',
            state: 'Tamil Nadu',
            stateCode: '33',
            country: 'India',
            pincode: '627415',
            email: 'contact@vijayalaxmi.com'
        },
        taxDetails: {
            gstin: '33AFNPA6099M1ZZ',
            taxSystem: 'GST',
            isGstEnabled: true
        },
        ...overrides
    };
};

/**
 * Builds a dynamic Branch object with sensible defaults and optional overrides.
 */
export const buildDynamicBranch = (overrides?: Partial<Branch>): Branch => {
    return {
        id: 'B-DYN-001',
        name: 'Main Branch',
        city: 'Mukkudal',
        address: 'Mela Periya Veethi, Mukkudal',
        phone: '04634-274206',
        config: {},
        ...overrides
    };
};

/**
 * Builds dynamic CartItem items with customizable rates and specs.
 */
export const buildDynamicItems = (itemOverrides?: Partial<CartItem>[]): CartItem[] => {
    const defaults: CartItem[] = [
        {
            id: 'ITEM-001',
            name: 'BRA',
            price: 135.00,
            qty: 1,
            sku: 'BRA001',
            category: 'Innerwear',
            sector: Sector.TEXTILE,
            stockQty: 10,
            costPrice: 100,
            sellingPrice: 135.00,
            unit: 'Pcs',
            tenantId: 'T-DYN-001'
        },
        {
            id: 'ITEM-002',
            name: 'INSKIRT',
            price: 140.00,
            qty: 1,
            sku: 'INS001',
            category: 'Innerwear',
            sector: Sector.TEXTILE,
            stockQty: 10,
            costPrice: 100,
            sellingPrice: 140.00,
            unit: 'Pcs',
            tenantId: 'T-DYN-001'
        },
        {
            id: 'ITEM-003',
            name: 'INSKIRT',
            price: 175.00,
            qty: 1,
            sku: 'INS002',
            category: 'Innerwear',
            sector: Sector.TEXTILE,
            stockQty: 10,
            costPrice: 120,
            sellingPrice: 175.00,
            unit: 'Pcs',
            tenantId: 'T-DYN-001'
        }
    ];

    if (!itemOverrides || itemOverrides.length === 0) {
        return defaults;
    }

    return itemOverrides.map((override, index) => {
        const fallback = defaults[index % defaults.length];
        return { ...fallback, ...override };
    });
};

/**
 * Builds a dynamic Sale object with calculated totals and optional overrides.
 */
export const buildDynamicSale = (overrides?: Partial<Sale>, itemOverrides?: Partial<CartItem>[]): Sale => {
    const items = buildDynamicItems(itemOverrides);
    const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    return {
        id: 'A42-206704',
        date: new Date().toISOString(),
        items,
        total: overrides?.total ?? calculatedTotal,
        customerName: 'KATE',
        customerId: 'CUST-001',
        sector: Sector.TEXTILE,
        branchId: 'B-DYN-001',
        taxMode: TaxMode.INCLUSIVE,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        ...overrides
    };
};

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

export const receiptDataService = {
    /**
     * Dynamically fetches live receipt context (Sale, Tenant, Branch) from DB/API endpoints --
     * GET /api/sales-invoice/invoice/:id, /api/business/profile, /api/branches (see those
     * routes/controllers for the response shapes normalizeSaleResponse/normalizeTenantResponse adapt).
     * Falls back to the dynamic builders below (rather than failing) if any call errors, so a
     * receipt can still be produced/inspected even when offline or the sale hasn't synced yet.
     *
     * Pass `{ strict: true }` when the caller is reprinting a specific, already-confirmed
     * invoice (see SalesInvoiceDetail.tsx's "Print Receipt" action) and a fabricated receipt
     * would be worse than an error -- in that mode, a failed/empty sale fetch throws instead of
     * silently substituting placeholder item/total data. Tenant/branch still fall back either
     * way; a generic header is a much smaller problem than wrong line items or totals.
     */
    fetchReceiptContext: async (saleId: string, options?: { strict?: boolean }): Promise<ReceiptContext> => {
        try {
            const [saleRes, tenantRes, branchRes] = await Promise.all([
                api.get(`/api/sales-invoice/invoice/${saleId}`).catch(() => null),
                api.get('/api/business/profile').catch(() => null),
                api.get('/api/branches').catch(() => null)
            ]);

            const rawSale = saleRes?.data?.data || saleRes?.data;
            const rawProfile = tenantRes?.data?.data || tenantRes?.data;
            const branches = branchRes?.data?.branches || branchRes?.data;

            if (!rawSale && options?.strict) {
                throw new Error(`Could not load invoice ${saleId} to build its receipt.`);
            }

            const sale = rawSale ? normalizeSaleResponse(rawSale) : buildDynamicSale({ id: saleId });
            const tenant = rawProfile ? normalizeTenantResponse(rawProfile) : buildDynamicTenant();
            const branch = Array.isArray(branches) && branches.length > 0 ? branches[0] : buildDynamicBranch();

            return { sale, tenant, branch };
        } catch (error) {
            if (options?.strict) throw error;
            console.warn('[ReceiptDataService] Falling back to dynamic builders due to API error:', error);
            return {
                sale: buildDynamicSale({ id: saleId }),
                tenant: buildDynamicTenant(),
                branch: buildDynamicBranch()
            };
        }
    },

    buildDynamicTenant,
    buildDynamicBranch,
    buildDynamicItems,
    buildDynamicSale
};

export default receiptDataService;
