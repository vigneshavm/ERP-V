import { Sector } from './common';

export interface Product {
    id: string;
    sku: string;
    name: string;
    category: string;
    price: number;
    cost: number;
    stock: number;
    sector: Sector;
    image?: string;
    branchId?: string;
    productType?: string;
    barcode?: string;
    brand?: string;
    hsnCode?: string;
    gstPercentage?: number;
    composition?: string;
    unit?: string;
    tenantId?: string;
}

// Redux State Interface
export interface InventoryState {
    products: Product[];
}
