
import { TEXTILE_PRODUCTS, REFRIGERATION_PRODUCTS, GROCERY_PRODUCTS, FMCG_PRODUCTS, SERVICE_PRODUCTS } from './data/seedData';
import { Product } from './types/product';

const allProducts = [
    ...TEXTILE_PRODUCTS,
    ...REFRIGERATION_PRODUCTS,
    ...GROCERY_PRODUCTS,
    ...FMCG_PRODUCTS,
    ...SERVICE_PRODUCTS
];

const headers = [
    "SKU", "Barcode", "Product Name", "Category", "Subcategory",
    "Variant (Attributes)", "Brand", "HSN", "Unit",
    "Price", "Disc%", "Tax%", "Inv Value"
];

console.log(`| ${headers.join(' | ')} |`);
console.log(`| ${headers.map(() => '---').join(' | ')} |`);

allProducts.forEach((p: Partial<Product>) => {
    // Universal Variant String builder
    const variantStr = [
        p.color, p.style, p.size, p.capacity, p.model,
        p.weight, p.flavor, p.variantData ? JSON.stringify(p.variantData) : null
    ].filter(x => x && x !== '{}').join(' / ');

    const invValue = (p.stock || 0) * (p.cost || 0);

    const row = [
        p.sku || '-',
        p.barcode || '-',
        p.name || '-',
        p.category || '-',
        p.subCategory || '-',
        variantStr || '-',
        p.brand || '-',
        p.hsnCode || '-',
        p.unit || '-',
        p.price || 0,
        p.discount || 0,
        p.gstPercentage || 0,
        invValue || '-' // Services might have 0 stock
    ];

    console.log(`| ${row.join(' | ')} |`);
});
