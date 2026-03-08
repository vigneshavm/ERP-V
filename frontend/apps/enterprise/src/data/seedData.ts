
import { Product } from "../types/product";
import { Sector } from "../types/common";
import { BRANDS, CATEGORIES, SUBCATEGORIES, ProductUnit } from './constants';
import { createShirt, createPant, createSpare, createProduct, generateProductMatrix, generateVariants } from './factories';

// --- TEXTILE ---
const baseSymbolShirt = createShirt({
    name: "Symbol Formal Shirt",
    brand: BRANDS.SYMBOL,
    category: CATEGORIES.MENS_WEAR,
    subCategory: SUBCATEGORIES.FORMAL_SHIRTS,
    productType: "Solid Formal",
    price: 1599,
    cost: 500,
    material: "Cotton",
    discount: 66
});

export const TEXTILE_PRODUCTS: Partial<Product>[] = [
    createShirt({
        name: "Classic White Formal Shirt",
        brand: BRANDS.LOUIS_PHILIPPE,
        sku: "LP-WHT-40",
        price: 2499,
        size: "40",
        color: "White"
    }),
    ...generateProductMatrix(
        baseSymbolShirt,
        [{ color: "Wine" }, { color: "Navy" }],
        [{ size: "38" }, { size: "40" }, { size: "42" }]
    )
];

// --- ELECTRONICS & SPARES ---
export const REFRIGERATION_PRODUCTS: Partial<Product>[] = [
    ...generateProductMatrix(
        createSpare({
            name: "Copper Pipe",
            brand: BRANDS.MANDEV,
            category: CATEGORIES.RAW_MATERIAL,
            subCategory: SUBCATEGORIES.COPPER,
            unit: ProductUnit.METER
        }),
        [{ model: "Soft Coil" }, { model: "Hard Straight" }],
        [{ size: "1/4 inch" }, { size: "1/2 inch" }]
    )
];

// --- GROCERY (New) ---
export const GROCERY_PRODUCTS: Partial<Product>[] = [
    ...generateVariants(
        createProduct({
            name: "Basmati Rice",
            brand: BRANDS.INDIA_GATE,
            category: CATEGORIES.GROCERY,
            subCategory: SUBCATEGORIES.RICE,
            sector: Sector.FMCG,
            price: 0, // Base price 0, overridden by variants
            hsnCode: "1006",
            unit: "Bag"
        }),
        [
            { weight: "1kg", price: 150, cost: 100 },
            { weight: "5kg", price: 650, cost: 450 },
            { weight: "10kg", price: 1200, cost: 850 }
        ]
    )
];

// --- FMCG / SNACKS (New) ---
export const FMCG_PRODUCTS: Partial<Product>[] = [
    ...generateProductMatrix(
        createProduct({
            name: "Good Day Biscuit",
            brand: BRANDS.BRITANNIA,
            category: CATEGORIES.SNACKS,
            subCategory: SUBCATEGORIES.BISCUITS,
            sector: Sector.FMCG,
            price: 0,
            hsnCode: "1905",
            unit: ProductUnit.PIECE
        }),
        [{ flavor: "Cashew" }, { flavor: "Pista" }, { flavor: "Butter" }],
        [{ weight: "100g", price: 20 }, { weight: "250g", price: 45 }]
    )
];

// --- SERVICES (New) ---
export const SERVICE_PRODUCTS: Partial<Product>[] = [
    createProduct({
        name: "AC Installation (Split)",
        category: CATEGORIES.SERVICES,
        subCategory: SUBCATEGORIES.INSTALLATION,
        sector: Sector.SERVICES,
        price: 1500,
        hsnCode: "9987",
        unit: "Service",
        variantData: { duration: "2 Hours" } // Custom Attribute
    }),
    createProduct({
        name: "AC Gas Charging",
        category: CATEGORIES.SERVICES,
        subCategory: SUBCATEGORIES.REPAIR,
        sector: Sector.SERVICES,
        price: 2500,
        hsnCode: "9987",
        unit: "Service"
    })
];
