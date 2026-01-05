import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gdfwuqojhaipbnkczaft.supabase.co';
const supabaseKey = 'sb_secret_mymXX85Prjih44tu2jst1g_mnL1bR6z';

const supabase = createClient(supabaseUrl, supabaseKey);

const seedData = {
    tenants: [
        {
            id: '866d5ae4-82ee-48c6-9f4c-28df8c541701', name: 'Big Bazaar', subdomain: 'big-bazaar', modules: ["POS", "INVENTORY", "FINANCE"], is_active: true, region: { "currency": "INR", "currencySymbol": "₹", "dateFormat": "DD/MM/YYYY" }, sector: 'General', theme: 'light', layout: 'standard', domain: 'bigbazaar.com', primary_color: '#f97316',
            locations: [{ "city": "Mumbai", "branches": [{ "id": "br-bb-mum-01", "name": "Lower Parel", "city": "Mumbai", "address": "Phoenix Mills" }] }],
            customers: [{ id: 'c1e13880-3c1a-4d92-9a3d-9d41498b5801', name: 'Walk-in Customer', phone: '000-000-0000', points: 0 }],
            employees: [{ id: 'e1e13880-3c1a-4d92-9a3d-9d41498b5801', branch_id: 'br-bb-mum-01', name: 'Vikram (Helper)', role: 'Helper', daily_rate: 500, sector: 'General', system_role: 'Staff', pin: '2222' }],
            labor_payments: [{ id: '01e13880-3c1a-4d92-a1b2-c3d4e5f6a101', employee_id: 'e1e13880-3c1a-4d92-9a3d-9d41498b5801', amount: 1000, type: 'ADVANCE', date: new Date().toISOString() }],
            transactions: [{ type: 'EXPENSE', category: 'Marketing', amount: 5000, description: 'Local Flyers', sector: 'General', branch_id: 'br-bb-mum-01' }],
            sales: [{ customer_id: 'c1e13880-3c1a-4d92-9a3d-9d41498b5801', total: 130, sector: 'General', payment_method: 'CASH', tax_mode: 'INCLUSIVE', items: [], branch_id: 'br-bb-mum-01' }],
            products: [
                { id: 'a1e13880-3c1a-4d92-9a3d-9d41498b5801', branch_id: 'br-bb-mum-01', sku: 'BB-STAT-NB', name: 'Classmate Notebook A4', category: 'Stationery', price: 150, cost: 90, stock: 500, sector: 'General', barcode: '4001', product_type: 'Stationery' },
                { id: 'a1e13880-3c1a-4d92-9a3d-9d41498b5802', branch_id: 'br-bb-blr-01', sku: 'BB-BEV-COKE', name: 'Coca Cola 1.25L', category: 'Beverage', price: 95, cost: 70, stock: 200, sector: 'General', barcode: '4002', product_type: 'FMCG' }
            ]
        },

        {
            id: '866d5ae4-82ee-48c6-9f4c-28df8c541703', name: 'Reliance Digital', subdomain: 'reliance-digital', modules: ["POS", "INVENTORY", "STOREFRONT"], is_active: true, sector: 'Electronics',
            locations: [{ "city": "Chennai", "branches": [{ "id": "br-rel-chn-01", "name": "Anna Nagar", "city": "Chennai", "address": "2nd Avenue" }] }],
            customers: [{ id: 'c1e13880-3c1a-4d92-9a3d-9d41498b5803', name: 'Walk-in Customer', phone: '000-000-0000', points: 0 }],
            cheques: [{ number: '000456', bank_name: 'HDFC Bank', payee: 'Samsung India', amount: 150000, status: 'CLEARED', type: 'ISSUED', sector: 'Electronics' }],
            purchase_orders: [{ vendor: 'Apple Distributors', total: 800000, status: 'APPROVED', sector: 'Electronics', items: [{ "name": "iPhone 15", "qty": 10, "cost": 72000 }], branch_id: 'br-rel-chn-01' }],
            products: [
                { id: 'a3e13880-3c1a-4d92-9a3d-9d41498b5801', branch_id: 'br-rel-chn-01', sku: 'MOB-IP15-128', name: 'iPhone 15 (128GB)', category: 'Smartphone', price: 69900, cost: 62000, stock: 12, sector: 'Electronics', barcode: '3001' },
                { id: 'a3e13880-3c1a-4d92-9a3d-9d41498b5802', branch_id: 'br-rel-mum-01', sku: 'TV-SONY-55', name: 'Sony 55" 4K Google TV', category: 'Television', price: 65000, cost: 54000, stock: 5, sector: 'Electronics', barcode: '3004' }
            ]
        },
        {
            id: '866d5ae4-82ee-48c6-9f4c-28df8c541702', name: 'Apollo Pharmacy', subdomain: 'apollo-pharmacy', modules: ["POS", "INVENTORY", "PHARMACY"], is_active: true, sector: 'Pharmacy',
            locations: [
                { "city": "Bangalore", "branches": [{ "id": "br-ap-blr-01", "name": "Koramangala", "city": "Bangalore", "address": "100 Feet Road" }, { "id": "br-ap-blr-02", "name": "Jayanagar", "city": "Bangalore", "address": "4th Block" }] },
                { "city": "Chennai", "branches": [{ "id": "br-ap-chn-01", "name": "Adyar", "city": "Chennai", "address": "Gandhi Nagar" }] }
            ],
            customers: [{ id: 'c1e13880-3c1a-4d92-9a3d-9d41498b5802', name: 'Walk-in Customer', phone: '000-000-0000', points: 0 }],
            employees: [{ id: 'e1e13880-3c1a-4d92-9a3d-9d41498b5802', branch_id: 'br-ap-blr-01', name: 'Priya (Pharmacist)', role: 'Pharmacist', daily_rate: 800, sector: 'Pharmacy', system_role: 'Staff', pin: '1111' }, { id: 'e2e13880-3c1a-4d92-9a3d-9d41498b5802', branch_id: 'br-ap-blr-02', name: 'Rajesh (Assistant)', role: 'Assistant', daily_rate: 600, sector: 'Pharmacy', system_role: 'Staff', pin: '3333' }],
            labor_payments: [{ id: '02e13880-3c1a-4d92-a1b2-c3d4e5f6a201', employee_id: 'e1e13880-3c1a-4d92-9a3d-9d41498b5802', amount: 1600, type: 'SALARY', date: new Date().toISOString() }],
            transactions: [{ type: 'EXPENSE', category: 'Utilities', amount: 3500, description: 'Electricity Bill - Koramangala', sector: 'Pharmacy', branch_id: 'br-ap-blr-01' }],
            products: [
                { id: 'a2e13880-3c1a-4d92-9a3d-9d41498b5801', branch_id: 'br-ap-blr-01', sku: 'AP-MED-PARA', name: 'Paracetamol 500mg', category: 'Medicines', price: 20, cost: 12, stock: 1000, sector: 'Pharmacy', barcode: '5001' },
                { id: 'a2e13880-3c1a-4d92-9a3d-9d41498b5802', branch_id: 'br-ap-chn-01', sku: 'AP-SUP-VITC', name: 'Vitamin C Tablets', category: 'Supplements', price: 150, cost: 90, stock: 300, sector: 'Pharmacy', barcode: '5002' }
            ]
        },
        {
            id: '866d5ae4-82ee-48c6-9f4c-28df8c541704', name: 'Reliance Smart Point', subdomain: 'reliance-smart', modules: ["POS", "INVENTORY", "DAILY"], is_active: true, sector: 'Grocery',
            locations: [{ "city": "Hyderabad", "branches": [{ "id": "br-rs-hyd-01", "name": "Banjara Hills", "city": "Hyderabad", "address": "Road No 12" }] }],
            products: [
                { id: 'a4e13880-3c1a-4d92-9a3d-9d41498b5801', branch_id: 'br-rs-hyd-01', sku: 'GR-ATTA-ASH', name: 'Aashirvaad Atta 5kg', category: 'Staples', price: 280, cost: 230, stock: 150, sector: 'Grocery', barcode: '6001' },
                { id: 'a4e13880-3c1a-4d92-9a3d-9d41498b5802', branch_id: 'br-rs-ten-01', sku: 'GR-OIL-FRT', name: 'Fortune Sunflower Oil 1L', category: 'Oil', price: 145, cost: 110, stock: 80, sector: 'Grocery', barcode: '6002' }
            ]
        },
        {
            id: '866d5ae4-82ee-48c6-9f4c-28df8c541705', name: 'Spar Hypermarket', subdomain: 'spar', modules: ["POS", "INVENTORY", "FINANCE", "PURCHASE"], is_active: true, sector: 'Supermarket',
            locations: [{ "city": "Bangalore", "branches": [{ "id": "br-sp-blr-01", "name": "Mantri Square", "city": "Bangalore", "address": "Malleswaram" }] }],
            products: [
                { id: 'a5e13880-3c1a-4d92-9a3d-9d41498b5801', branch_id: 'br-sp-blr-01', sku: 'SP-FRUIT-APL', name: 'Washington Apple', category: 'Fresh Produce', price: 220, cost: 150, stock: 40, sector: 'Supermarket', barcode: '7001' },
                { id: 'a5e13880-3c1a-4d92-9a3d-9d41498b5802', branch_id: 'br-sp-cbe-01', sku: 'SP-DAIRY-AMUL', name: 'Amul Butter 500g', category: 'Dairy', price: 275, cost: 240, stock: 60, sector: 'Supermarket', barcode: '7002' }
            ]
        },
        {
            id: '866d5ae4-82ee-48c6-9f4c-28df8c541706', name: 'Pothys', subdomain: 'pothys', modules: ["POS", "INVENTORY", "SALES"], is_active: true, sector: 'Textile',
            locations: [{ "city": "Chennai", "branches": [{ "id": "br-po-chn-01", "name": "T Nagar", "city": "Chennai", "address": "Panagal Park" }] }],
            customers: [{ id: 'c1e13880-3c1a-4d92-9a3d-9d41498b5806', name: 'Walk-in Customer', phone: '000-000-0000', points: 0 }],
            employees: [{ id: 'e6e13880-3c1a-4d92-9a3d-9d41498b5801', branch_id: 'br-po-chn-01', name: 'Ramesh (Manager)', role: 'Store Manager', daily_rate: 1500, sector: 'Textile', system_role: 'Manager', pin: '1234' }],
            labor_payments: [{ id: '06e13880-3c1a-4d92-a1b2-c3d4e5f6a601', employee_id: 'e6e13880-3c1a-4d92-9a3d-9d41498b5801', amount: 5000, type: 'ADVANCE', note: 'Emergency advance', date: new Date().toISOString() }],
            transactions: [{ type: 'EXPENSE', category: 'Rent', amount: 25000, description: 'Shop Rent - Chennai - T Nagar', sector: 'Textile', branch_id: 'br-po-chn-01' }],
            products: [
                { id: 'a6e13880-3c1a-4d92-9a3d-9d41498b5801', branch_id: 'br-po-chn-01', sku: 'TX-SILK-KAN', name: 'Kanjivaram Silk Saree', category: 'Ethnic Wear', price: 15000, cost: 9000, stock: 25, sector: 'Textile', barcode: '2001' },
                { id: 'a6e13880-3c1a-4d92-9a3d-9d41498b5802', branch_id: 'br-po-mdu-01', sku: 'TX-SHIRT-LP', name: 'LP Formal Shirt Blue', category: 'Mens Wear', price: 2499, cost: 1200, stock: 100, sector: 'Textile', barcode: '2002' }
            ]
        },
        {
            id: '866d5ae4-82ee-48c6-9f4c-28df8c541707', name: 'Poorvika Mobiles', subdomain: 'poorvika', modules: ["POS", "STOREFRONT"], is_active: true, sector: 'Mobile Shop',
            locations: [{ "city": "Chennai", "branches": [{ "id": "br-pv-chn-01", "name": "Chromepet", "city": "Chennai", "address": "GST Road" }] }],
            products: [
                { id: 'a7e13880-3c1a-4d92-9a3d-9d41498b5801', branch_id: 'br-pv-chn-01', sku: 'PV-ACC-AIRP', name: 'Apple AirPods Pro 2', category: 'Accessories', price: 24900, cost: 19000, stock: 20, sector: 'Mobile Shop', barcode: '8001' },
                { id: 'a7e13880-3c1a-4d92-9a3d-9d41498b5802', branch_id: 'br-pv-try-01', sku: 'PV-MOB-S24', name: 'Samsung Galaxy S24 Ultra', category: 'Smartphone', price: 124999, cost: 105000, stock: 8, sector: 'Mobile Shop', barcode: '8002' }
            ]
        }
    ]
};

async function seed() {
    console.log('--- Starting Fully Unified Seed Process ---');

    const tables = ['labor_payments', 'purchase_orders', 'sales', 'cheques', 'transactions', 'employees', 'products', 'customers', 'branches', 'tenants'];
    console.log('Clearing existing data...');
    for (const table of tables) {
        await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    console.log('Inserting Tenants...');
    const tenants = seedData.tenants.map(({ locations, customers, employees, labor_payments, transactions, sales, cheques, purchase_orders, products, ...t }) => t);
    const { error: tErr } = await supabase.from('tenants').insert(tenants);
    if (tErr) console.error('Tenant Error:', tErr);

    const extract = (key) => {
        const results = [];
        seedData.tenants.forEach(t => {
            if (t[key]) t[key].forEach(item => results.push({ ...item, tenant_id: t.id }));
        });
        return results;
    };

    console.log('Inserting Branches...');
    const branches = [];
    seedData.tenants.forEach(t => t.locations.forEach(l => l.branches.forEach(b => branches.push({ tenant_id: t.id, name: b.name, city: b.city, address: b.address }))));
    await supabase.from('branches').insert(branches);

    const dataTypes = ['customers', 'employees', 'labor_payments', 'transactions', 'sales', 'cheques', 'purchase_orders', 'products'];
    for (const type of dataTypes) {
        console.log(`Inserting ${type}...`);
        const data = extract(type);
        if (data.length > 0) {
            const { error } = await supabase.from(type).insert(data);
            if (error) console.error(`${type} Error:`, error);
        }
    }

    console.log('--- Fully Unified Seed Process Completed ---');
}

seed();
