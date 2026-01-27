import { Product } from '../../types/product';

export const inventory: Product[] = [
    {
        id: "P001",
        name: "Cotton T-Shirt Red XL",
        sku: "TS-RED-XL-BR001",
        category: "Apparel",
        subCategory: "T-Shirts",
        costPrice: 400,
        sellingPrice: 850,
        mrp: 999,
        stockQty: 150,
        unit: "pcs",
        taxMode: "exclusive",
        gstPercentage: 5,
        hsnCode: "6109",
        tenantId: "TEN001",
        branchId: "BR001",
        sector: "Textile",
        isActive: true
    },
    {
        id: "P002",
        name: "Leather Jacket Brown L",
        sku: "JK-BROWN-L-BR001",
        category: "Apparel",
        subCategory: "Jackets",
        costPrice: 2500,
        sellingPrice: 5999,
        mrp: 7500,
        stockQty: 50,
        unit: "pcs",
        taxMode: "exclusive",
        gstPercentage: 18,
        hsnCode: "4203",
        tenantId: "TEN001",
        branchId: "BR001",
        sector: "Textile",
        isActive: true
    }
];
