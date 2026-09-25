import type { PageInfo, ResolvedSource } from '../components';

/** Shapes returned by /api/reports/gst/* (see backend GstReturnService). */

export interface TaxTotals {
    lines: number;
    qty: number;
    value: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    tax: number;
}

export interface RateRow extends TaxTotals { rate: number }
export interface HsnRow extends TaxTotals { hsn: string; rate: number; description: string }

export interface OutwardChecks {
    shopHeaderVsLineTax: { header: number; lines: number; difference: number };
    shopHeaderVsLineValue: { header: number; lines: number; difference: number };
    unknownRate: { lines: number; value: number };
    missingHsn: { lines: number; value: number };
    hsnViaGroupLines: number;
    shopInterStateBills: number;
    erpZeroRateLines: { lines: number; value: number };
    erpDerivedLines: number;
    erpReturnsNotDeducted: { invoices: number; value: number };
}

interface Base {
    range: { from: string; to: string };
    asOf: string | null;
    source: ResolvedSource;
}

export interface Gstr1Data extends Base {
    summary: TaxTotals & { documents: number };
    bySource: { shop: TaxTotals; erp: TaxTotals };
    counts: { shopBills: number; erpInvoices: number; cancelledShopBills: { bills: number; value: number } };
    byRate: RateRow[];
    byHsn: HsnRow[];
    documents: { source: 'shop' | 'erp'; series: string; from: number; to: number; total: number; cancelled: number }[];
    checks: OutwardChecks;
}

export interface Heads { cgst: number; sgst: number; igst: number }

export interface Gstr3bData extends Base {
    outward: { taxable: TaxTotals; nilRated: TaxTotals; total: TaxTotals; interStateTaxable: TaxTotals };
    itc: { eligible: TaxTotals; blocked: TaxTotals; allPurchases: TaxTotals };
    setOff: {
        liability: Heads;
        credit: Heads;
        paidByCredit: { igst: Heads; cgst: Heads; sgst: Heads };
        cash: Heads;
        carryForward: Heads;
    };
    byMonth: { month: string; outputTax: number; taxable: number; itc: number; net: number }[];
    checks: OutwardChecks;
}

export interface Gstr9Data extends Omit<Base, 'range'> {
    financialYear: { from: string; to: string; label: string };
    range: { from: string; to: string };
    outward: TaxTotals;
    itc: TaxTotals;
    byMonth: { month: string; taxable: number; cgst: number; sgst: number; igst: number; outputTax: number; itc: number; net: number }[];
    byRate: RateRow[];
    byHsn: HsnRow[];
    checks: OutwardChecks;
}

export interface InwardRow {
    source: 'shop' | 'erp';
    kind: 'purchase' | 'return';
    doc: string;
    supplierInvoiceNo: string | null;
    date: string;
    invoiceDate: string | null;
    supplier: string;
    gstin: string;
    rates: string;
    lines: number;
    qty: number;
    value: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    tax: number;
    itcEligible: boolean;
}

export interface PurchaseRegisterData extends Base {
    summary: {
        all: TaxTotals;
        eligible: TaxTotals;
        noGstin: TaxTotals;
        returns: TaxTotals;
        documents: number;
        suppliersWithoutGstin: number;
    };
    byRate: RateRow[];
    items: InwardRow[];
    pagination: PageInfo;
    checks: { unknownRate: number; returnsAvailable: boolean };
}
