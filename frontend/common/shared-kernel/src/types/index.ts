export interface Product {
    id: string;
    name: string;
    category: string;
    productType: string;
    sellingPrice: number;
    stockQty: number;
    sector: string;
    branchId: string;
    image?: string;
    barcode?: string;
    sku?: string;
}

export interface ScannedInvoiceItem {
    sku?: string;
    name: string;
    productType?: string;
    qty: number;
    cost?: number;
}

export interface ScannedInvoice {
    vendor?: string;
    date?: string;
    items: ScannedInvoiceItem[];
}
