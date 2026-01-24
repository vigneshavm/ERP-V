import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = 'sb_secret_mymXX85Prjih44tu2jst1g_mnL1bR6z';

const supabase = createClient(supabaseUrl, supabaseKey);

const productData = {
    "tenant_id": "80aa164e-685b-46f0-9ef1-5af54b57b8a0",
    "name": "Vijayalakshmi Dhothie (Veshti)",
    "brand": "VIJAYALAKSHMI",
    "category": "Traditional Men's Wear",
    "sub_category": "Dhothie (Veshti)",
    "sku": "4 52612141",
    "batch_number": "VJ110187 19",
    "qr_reference": "VTLXNN",
    "material": "100% Pure Cotton",
    "price": 195.00,
    "currency": "INR",
    "is_active": true,
    "created_at": "2026-01-03T13:07:14Z"
};

async function insert() {
    const tenantId = productData.tenant_id;
    console.log(`--- Targeted Product Insertion ---`);
    console.log(`Tenant: ${tenantId}`);

    // 1. Ensure Tenant exists
    const { data: tenant, error: tErr } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

    if (tErr && tErr.code === 'PGRST116') { // Not found
        console.log('Tenant missing. Creating tenant record...');
        const { error: cErr } = await supabase
            .from('tenants')
            .insert({
                id: tenantId,
                name: 'Vijayalakshmi Textiles',
                subdomain: 'vj-textiles',
                is_active: true,
                sector: 'Textile',
                modules: ["POS", "INVENTORY", "SALES"]
            });
        if (cErr) {
            console.error('Tenant Creation Failed:', cErr.message);
            return;
        }
        console.log('Tenant created successfully.');
    } else if (tErr) {
        console.error('Tenant Check Failed:', tErr.message);
        return;
    } else {
        console.log(`Tenant verified: ${tenant.name}`);
    }

    // 2. Ensure Branch exists
    let branchId;
    const { data: branches, error: bErr } = await supabase
        .from('branches')
        .select('id, name')
        .eq('tenant_id', tenantId);

    if (bErr) {
        console.error('Branch Check Failed:', bErr.message);
        return;
    }

    if (branches.length === 0) {
        console.log('No branches found. Creating "Main Branch"...');
        const { data: newBranch, error: nbErr } = await supabase
            .from('branches')
            .insert({
                tenant_id: tenantId,
                name: 'Main Branch',
                city: 'Chennai',
                address: 'T Nagar'
            })
            .select()
            .single();
        if (nbErr) {
            console.error('Branch Creation Failed:', nbErr.message);
            return;
        }
        branchId = newBranch.id;
        console.log(`Created branch: [${branchId}] ${newBranch.name}`);
    } else {
        branchId = branches[0].id; // Use first available branch
        console.log(`Using existing branch: [${branchId}] ${branches[0].name}`);
    }

    // 3. Insert Product
    console.log(`Inserting product: ${productData.name}...`);
    const { data: newProduct, error: pErr } = await supabase
        .from('products')
        .insert({
            tenant_id: tenantId,
            branch_id: branchId, // Assuming this is the text/id needed
            name: productData.name,
            brand: productData.brand,
            category: productData.category,
            sku: productData.sku,
            price: productData.price,
            composition: productData.material,
            sector: 'Textile',
            product_type: productData.sub_category,
            barcode: productData.qr_reference, // Mapping QR to barcode
            stock: 0, // Initial stock
            cost: 0 // Initial cost
        })
        .select()
        .single();

    if (pErr) {
        console.error('Product Insertion Failed:', pErr.message);
        console.error('Error Details:', JSON.stringify(pErr, null, 2));
    } else {
        console.log(`SUCCESS! Product inserted with ID: ${newProduct.id}`);
        console.log(`SKU: ${newProduct.sku}`);
    }
}

insert();
