import { randomUUID } from 'crypto';

const tenant_id = "80aa164e-685b-46f0-9ef1-5af54b57b8a0";

const categories = {
    "Mens Wear": ["Shirts", "T-Shirts", "Pants", "Denim"],
    "Womens Wear": ["Sarees", "Kurtis", "Dress Material", "Leggings"],
    "Fabrics": ["Shirting", "Suiting"]
};

const brands = ["Raymond", "Siyaram", "Louis Philippe", "Van Heusen", "Manyavar", "Biba", "W", "Aurelia", "Liva", "Arvind"];
const colors = ["Red", "Blue", "Black", "White", "Green", "Yellow", "Navy", "Beige", "Grey", "Maroon"];
const sizes_wear = ["S", "M", "L", "XL", "XXL", "38", "40", "42", "44"];
const materials = ["Cotton", "Silk", "Polyester", "Linen", "Denim", "Rayon", "Khadi"];

const products = [];

function generate_sku(brand, cat, sub, varAttr) {
    const r = Math.floor(Math.random() * 900) + 100;
    return `${brand.substring(0, 3).toUpperCase()}-${cat.substring(0, 3).toUpperCase()}-${sub.substring(0, 3).toUpperCase()}-${varAttr.toUpperCase()}-${r}`;
}

let count = 0;
while (count < 30) {
    const catKeys = Object.keys(categories);
    const cat = catKeys[Math.floor(Math.random() * catKeys.length)];
    const subList = categories[cat];
    const sub = subList[Math.floor(Math.random() * subList.length)];

    const brand = brands[Math.floor(Math.random() * brands.length)];
    const material = materials[Math.floor(Math.random() * materials.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];

    let unit, size, name_suffix;

    if (cat === "Fabrics") {
        unit = "Meter";
        size = null;
    } else {
        unit = "Piece";
        size = sizes_wear[Math.floor(Math.random() * sizes_wear.length)];
    }

    const name = `${brand} ${sub}`;

    const varAttr = `${color.substring(0, 1)}${size}`;
    const sku = generate_sku(brand, cat, sub, varAttr);

    // Uniqueness check
    if (products.some(p => p.sku === sku)) continue;

    const cost = Math.floor(Math.random() * (2000 - 300 + 1)) + 300;
    const margin = Math.floor(Math.random() * (50 - 20 + 1)) + 20;
    let price = cost * (1 + margin / 100);
    price = Math.round(price / 10) * 10 - 1; // .99 or just convention
    price = Math.floor(price); // Integer part

    const record = {
        id: randomUUID(),
        tenant_id: tenant_id,
        sku: sku,
        name: name,
        category: cat,
        product_type: sub,
        price: price,
        cost: cost,
        stock: Math.floor(Math.random() * (100 - 10 + 1)) + 10,
        sector: "Textile",
        barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
        composition: material,
        unit: unit,
        brand: brand,
        hsn_code: cat === "Mens Wear" ? "6203" : "6204",
        gst_percentage: price < 1000 ? 5.00 : 12.00,
        size: size,
        color: color
    };

    products.push(record);
    count++;
}

let sql = `DO $$
DECLARE
    v_tenant_id UUID := '${tenant_id}';
    v_branch_id UUID;
BEGIN
    -- 1. Get or Create Branch
    SELECT id INTO v_branch_id FROM branches WHERE tenant_id = v_tenant_id AND name = 'Textile Main';
    
    IF v_branch_id IS NULL THEN
        INSERT INTO branches (tenant_id, name, city, address)
        VALUES (v_tenant_id, 'Textile Main', 'Chennai', 'T Nagar')
        RETURNING id INTO v_branch_id;
    END IF;

    -- 2. Insert Products
    INSERT INTO products (id, tenant_id, branch_id, sku, name, category, product_type, price, cost, stock, sector, barcode, composition, unit, brand, hsn_code, gst_percentage, size, color)
    VALUES
`;

const values = products.map(p => {
    const sizeVal = p.size ? `'${p.size}'` : 'NULL';
    const colorVal = p.color ? `'${p.color}'` : 'NULL';
    return `    ('${p.id}', v_tenant_id, v_branch_id, '${p.sku}', '${p.name}', '${p.category}', '${p.product_type}', ${p.price}, ${p.cost}, ${p.stock}, '${p.sector}', '${p.barcode}', '${p.composition}', '${p.unit}', '${p.brand}', '${p.hsn_code}', ${p.gst_percentage}, ${sizeVal}, ${colorVal})`;
});

sql += values.join(",\n") + ";\nEND $$;";

console.log(sql);
