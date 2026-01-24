
import fs from 'fs';
import path from 'path';

const BASE_PATH = "c:/Users/vigne/Project/30/ERP/src/data/demo";

// ============= TENANT CONFIGURATION =============
const TENANTS = [
    {
        id: "TEN001",
        name: "Vijayalakshmi Textiles & Readymades",
        type: "RETAIL",
        business_type: "TEXTILE",
        sector: "Textiles",
        branches: ["BR001", "BR002"]
    },
    {
        id: "TEN002",
        name: "Sri Ganesh Traders",
        type: "WHOLESALE",
        business_type: "GROCERY",
        sector: "FMCG",
        branches: ["BR003"]
    },
    {
        id: "TEN003",
        name: "TechMart Electronics",
        type: "RETAIL",
        business_type: "ELECTRONICS",
        sector: "Electronics",
        branches: ["BR004"]
    }
];

const BRANCHES = [
    { id: "BR001", tenant_id: "TEN001", name: "Chennai Main Branch", city: "Chennai", is_active: true, sector: "Textiles", business_type: "TEXTILE" },
    { id: "BR002", tenant_id: "TEN001", name: "Madurai Branch", city: "Madurai", is_active: true, sector: "Textiles", business_type: "TEXTILE" },
    { id: "BR003", tenant_id: "TEN002", name: "Salem Warehouse", city: "Salem", is_active: true, sector: "FMCG", business_type: "GROCERY" },
    { id: "BR004", tenant_id: "TEN003", name: "Coimbatore TechMart", city: "Coimbatore", is_active: true, sector: "Electronics", business_type: "ELECTRONICS" }
];

// ============= PRODUCT TEMPLATES BY BUSINESS TYPE =============
const PRODUCTS_BY_TYPE = {
    TEXTILE: [
        { sku: "TS-RED-XL", name: "Cotton T-Shirt Red XL", cost: 400, price: 850, gst: 5, category: "Apparel" },
        { sku: "TS-BLUE-L", name: "Cotton T-Shirt Blue L", cost: 400, price: 850, gst: 5, category: "Apparel" },
        { sku: "DN-BLUE-32", name: "Slim Fit Denim Blue 32", cost: 1200, price: 2499, gst: 12, category: "Apparel" },
        { sku: "DN-BLACK-34", name: "Regular Fit Denim Black 34", cost: 1200, price: 2499, gst: 12, category: "Apparel" },
        { sku: "SH-WHITE-M", name: "Formal White Shirt M", cost: 700, price: 1599, gst: 5, category: "Apparel" },
        { sku: "SH-BLUE-L", name: "Casual Blue Shirt L", cost: 750, price: 1699, gst: 5, category: "Apparel" },
        { sku: "JK-BROWN-L", name: "Leather Jacket Brown L", cost: 2500, price: 5999, gst: 18, category: "Apparel" },
        { sku: "SW-GRAY-XL", name: "Woolen Sweater Gray XL", cost: 900, price: 1999, gst: 5, category: "Apparel" },
        { sku: "SC-MULTI", name: "Silk Scarf Multi-color", cost: 200, price: 799, gst: 5, category: "Accessories" },
        { sku: "BL-BLACK", name: "Leather Belt Black", cost: 450, price: 999, gst: 12, category: "Accessories" },
        { sku: "CAP-BLUE", name: "Baseball Cap Blue", cost: 150, price: 499, gst: 5, category: "Accessories" },
        { sku: "SOCKS-GRAY", name: "Cotton Socks Gray", cost: 50, price: 199, gst: 5, category: "Accessories" },
        { sku: "JEANS-RLX", name: "Relaxed Fit Jeans", cost: 1100, price: 2299, gst: 12, category: "Apparel" },
        { sku: "HOODIE-BLK", name: "Oversized Hoodie Black", cost: 800, price: 1799, gst: 5, category: "Apparel" },
        { sku: "POLO-WHT", name: "Classic Polo White", cost: 500, price: 1199, gst: 5, category: "Apparel" }
    ],
    GROCERY: [
        { sku: "RICE-5KG", name: "Basmati Rice 5Kg", cost: 350, price: 450, gst: 5, category: "Grains" },
        { sku: "WHEAT-10KG", name: "Wheat Flour 10Kg", cost: 400, price: 520, gst: 5, category: "Grains" },
        { sku: "OIL-1L", name: "Sunflower Oil 1L", cost: 120, price: 160, gst: 5, category: "Oils" },
        { sku: "SUGAR-1KG", name: "Sugar 1Kg", cost: 45, price: 58, gst: 5, category: "Essentials" },
        { sku: "SALT-1KG", name: "Iodized Salt 1Kg", cost: 18, price: 25, gst: 5, category: "Essentials" },
        { sku: "TEA-250G", name: "Premium Tea 250g", cost: 150, price: 220, gst: 5, category: "Beverages" },
        { sku: "COFFEE-200G", name: "Instant Coffee 200g", cost: 280, price: 380, gst: 12, category: "Beverages" },
        { sku: "DAL-1KG", name: "Toor Dal 1Kg", cost: 130, price: 175, gst: 5, category: "Pulses" },
        { sku: "CHANA-1KG", name: "Chana Dal 1Kg", cost: 90, price: 125, gst: 5, category: "Pulses" },
        { sku: "SOAP-4PK", name: "Bath Soap 4-Pack", cost: 120, price: 160, gst: 18, category: "Personal Care" }
    ],
    ELECTRONICS: [
        { sku: "PHONE-SAM-A54", name: "Samsung Galaxy A54", cost: 25000, price: 32999, gst: 18, category: "Smartphones" },
        { sku: "PHONE-IPH-15", name: "iPhone 15 Pro Max", cost: 120000, price: 159900, gst: 18, category: "Smartphones" },
        { sku: "PHONE-OP-12", name: "OnePlus 12", cost: 50000, price: 64999, gst: 18, category: "Smartphones" },
        { sku: "HEADPHONE-SNY", name: "Sony WH-1000XM5", cost: 22000, price: 29990, gst: 18, category: "Audio" },
        { sku: "LAPTOP-MBA-M3", name: "MacBook Air M3", cost: 90000, price: 114900, gst: 18, category: "Laptops" },
        { sku: "LAPTOP-DELL-XPS", name: "Dell XPS 15", cost: 85000, price: 110000, gst: 18, category: "Laptops" },
        { sku: "TV-LG-55", name: "LG OLED 55 inch", cost: 100000, price: 139990, gst: 18, category: "TVs" },
        { sku: "TABLET-IPAD", name: "iPad Pro 12.9", cost: 80000, price: 112900, gst: 18, category: "Tablets" },
        { sku: "WATCH-APL-9", name: "Apple Watch Series 9", cost: 35000, price: 44900, gst: 18, category: "Wearables" },
        { sku: "SPEAKER-JBL", name: "JBL Flip 6", cost: 8000, price: 12990, gst: 18, category: "Audio" }
    ]
};

// ============= CUSTOMER TEMPLATES =============
const CUSTOMERS_BY_TENANT = {
    TEN001: [
        { id: "C001", name: "Rajesh Kumar", phone: "9876543210" },
        { id: "C002", name: "Priya Sharma", phone: "9876543211" },
        { id: "C003", name: "Amit Patel", phone: "9876543212" },
        { id: "C004", name: "Sunita Reddy", phone: "9876543213" },
        { id: "C005", name: "Vikram Singh", phone: "9876543214" },
        { id: "C006", name: "Meera Nair", phone: "9876543215" },
        { id: "C007", name: "Karthik Iyer", phone: "9876543216" },
        { id: "C008", name: "Anjali Gupta", phone: "9876543217" },
    ],
    TEN002: [
        { id: "C101", name: "Ganesh Shop", phone: "9876500001" },
        { id: "C102", name: "Sri Lakshmi Store", phone: "9876500002" },
        { id: "C103", name: "Balaji Mart", phone: "9876500003" },
        { id: "C104", name: "Murugan Traders", phone: "9876500004" },
    ],
    TEN003: [
        { id: "C201", name: "Tech Solutions Corp", phone: "9876600001" },
        { id: "C202", name: "Digital World Store", phone: "9876600002" },
        { id: "C203", name: "Gadget Hub", phone: "9876600003" },
    ]
};

const END_DATE = new Date("2026-01-12");
const START_DATE = new Date(END_DATE);
START_DATE.setDate(END_DATE.getDate() - 60);

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

// ============= GENERATE DATA FOR ALL TENANTS =============

let globalInvCounter = 1;
let globalSiCounter = 1;
let globalPayCounter = 1;
let globalEstCounter = 1;

const allInventory = [];
const allCustomers = [];
const allSalesInvoices = [];
const allSalesItems = [];
const allPayments = [];
const allTransactions = [];
const allDailyFinance = [];
const allEstimates = [];
const allEmployees = [];

// Generate employees for each tenant
TENANTS.forEach(tenant => {
    const branches = BRANCHES.filter(b => b.tenant_id === tenant.id);
    branches.forEach((branch, idx) => {
        allEmployees.push({
            id: `EMP-${tenant.id}-${idx + 1}`,
            tenant_id: tenant.id,
            branch_id: branch.id,
            full_name: idx === 0 ? `Admin - ${tenant.name.split(' ')[0]}` : `Staff - ${branch.name}`,
            email: idx === 0 ? `admin@${tenant.id.toLowerCase()}.com` : `staff${idx}@${tenant.id.toLowerCase()}.com`,
            role_id: idx === 0 ? "ADMIN" : "STAFF",
            password: "demo_password_123",
            is_active: true,
            sector: tenant.sector
        });
    });
});

// Generate data per tenant
TENANTS.forEach(tenant => {
    const tenantBranches = BRANCHES.filter(b => b.tenant_id === tenant.id);
    const products = PRODUCTS_BY_TYPE[tenant.business_type] || PRODUCTS_BY_TYPE.TEXTILE;
    const customers = CUSTOMERS_BY_TENANT[tenant.id] || [];

    // Generate inventory for each branch
    tenantBranches.forEach((branch, branchIdx) => {
        products.forEach((prod, idx) => {
            let stock;
            if (idx < 2) stock = 0;
            else if (idx < 5) stock = Math.floor(Math.random() * 5) + 1;
            else stock = Math.floor(Math.random() * 100) + 20;

            allInventory.push({
                id: `SKU-${tenant.id}-${branch.id}-${String(idx + 1).padStart(3, '0')}`,
                tenant_id: tenant.id,
                branch_id: branch.id,
                sku: `${prod.sku}-${branch.id}`,
                name: `${prod.name} (${branch.name})`,
                category: prod.category,
                stock,
                cost: prod.cost,
                selling_price: prod.price,
                gst_rate: prod.gst,
                barcode: `${tenant.id}${branch.id}${String(idx + 1).padStart(4, '0')}`,
                sector: tenant.sector,
                business_type: tenant.business_type
            });
        });
    });

    // Generate customers with credit data
    const riskLevels = ['HIGH', 'MEDIUM', 'LOW'];
    customers.forEach((c, idx) => {
        const hasCreditAccount = idx < Math.ceil(customers.length / 2);
        const creditLimit = hasCreditAccount ? [10000, 15000, 20000, 25000, 30000][idx % 5] : 0;
        const creditBalance = hasCreditAccount ? Math.floor(creditLimit * (0.3 + Math.random() * 0.6)) : 0;

        allCustomers.push({
            id: `${c.id}-${tenant.id}`,
            tenant_id: tenant.id,
            name: c.name,
            phone: c.phone,
            email: `${c.name.toLowerCase().replace(' ', '.')}@email.com`,
            address: `123, Main Street, ${tenantBranches[0]?.city || 'Chennai'}`,
            outstanding_balance: Math.floor(Math.random() * 5000),
            loyalty_points: Math.floor(Math.random() * 500),
            sector: tenant.sector,
            creditBalance: creditBalance,
            creditLimit: creditLimit,
            lastPaymentDate: hasCreditAccount ? getRandomDate(START_DATE, END_DATE) : null,
            riskScore: hasCreditAccount ? riskLevels[idx % 3] : null
        });
    });

    // Generate sales invoices
    const salesCount = tenant.id === 'TEN001' ? 350 : (tenant.id === 'TEN002' ? 150 : 50);
    const tenantProducts = allInventory.filter(p => p.tenant_id === tenant.id);
    const tenantCustomers = allCustomers.filter(c => c.tenant_id === tenant.id);

    for (let i = 0; i < salesCount; i++) {
        const date = getRandomDate(START_DATE, END_DATE);
        const branch = tenantBranches[Math.floor(Math.random() * tenantBranches.length)];
        const customer = tenantCustomers.length > 0
            ? tenantCustomers[Math.floor(Math.random() * tenantCustomers.length)]
            : { id: 'WALK-IN', name: 'Walk-in Customer', phone: '' };

        const branchProducts = tenantProducts.filter(p => p.branch_id === branch.id);
        if (branchProducts.length === 0) continue;

        const itemCount = Math.floor(Math.random() * 4) + 1;
        const saleItems = [];
        let subtotal = 0;
        let totalGst = 0;

        for (let j = 0; j < itemCount; j++) {
            const prod = branchProducts[Math.floor(Math.random() * branchProducts.length)];
            const qty = Math.floor(Math.random() * 3) + 1;
            const lineSubtotal = prod.selling_price * qty;
            const lineGst = (lineSubtotal * prod.gst_rate) / 100;
            const lineTotal = lineSubtotal + lineGst;

            const itemObj = {
                id: `SI${String(globalSiCounter++).padStart(5, '0')}`,
                invoice_id: `INV-${tenant.id}-${String(globalInvCounter).padStart(4, '0')}`,
                sku: prod.sku,
                name: prod.name,
                qty,
                rate: prod.selling_price,
                gst: lineGst,
                total: lineTotal
            };
            allSalesItems.push(itemObj);
            saleItems.push(itemObj);
            subtotal += lineSubtotal;
            totalGst += lineGst;
        }

        const netAmount = subtotal + totalGst;
        const paymentMode = ["CASH", "UPI", "CARD", "MIXED"][Math.floor(Math.random() * 4)];

        const statusRoll = Math.random();
        let status, paidAmount, balanceAmount;
        if (statusRoll < 0.6) {
            status = "COMPLETED";
            paidAmount = netAmount;
            balanceAmount = 0;
        } else if (statusRoll < 0.75) {
            status = "PARTIAL";
            paidAmount = Math.round(netAmount * (0.3 + Math.random() * 0.5));
            balanceAmount = netAmount - paidAmount;
        } else if (statusRoll < 0.85) {
            status = "PREORDER";
            paidAmount = Math.round(netAmount * 0.1);
            balanceAmount = netAmount - paidAmount;
        } else if (statusRoll < 0.95) {
            status = "FULFILLED";
            paidAmount = netAmount;
            balanceAmount = 0;
        } else {
            status = "CANCELLED";
            paidAmount = 0;
            balanceAmount = 0;
        }

        const dueDate = new Date(date);
        dueDate.setDate(dueDate.getDate() + 15);

        allSalesInvoices.push({
            id: `INV-${tenant.id}-${String(globalInvCounter++).padStart(4, '0')}`,
            invoice_no: `SI-${tenant.id}-${String(allSalesInvoices.filter(s => s.tenant_id === tenant.id).length + 1).padStart(5, '0')}`,
            tenant_id: tenant.id,
            branch_id: branch.id,
            customer_id: customer.id,
            customer_name: customer.name,
            customer_phone: customer.phone,
            date,
            subtotal,
            gst: totalGst,
            total: netAmount,
            net_amount: netAmount,
            paid_amount: paidAmount,
            balance_amount: balanceAmount,
            status,
            payment_mode: paymentMode,
            payment_method: paymentMode,
            due_date: dueDate.toISOString().split('T')[0],
            sector: tenant.sector,
            business_type: tenant.business_type,
            items: saleItems
        });

        if (paidAmount > 0) {
            allPayments.push({
                id: `PAY-${tenant.id}-${String(globalPayCounter++).padStart(5, '0')}`,
                tenant_id: tenant.id,
                branch_id: branch.id,
                ref_type: "INVOICE",
                ref_id: `INV-${tenant.id}-${String(globalInvCounter - 1).padStart(4, '0')}`,
                amount: paidAmount,
                mode: paymentMode,
                date,
                sector: tenant.sector
            });

            allTransactions.push({
                id: `TX-${tenant.id}-${String(globalPayCounter).padStart(5, '0')}`,
                tenant_id: tenant.id,
                branch_id: branch.id,
                type: "INCOME",
                category: "Sale",
                amount: paidAmount,
                date,
                description: `Payment for invoice`,
                sector: tenant.sector
            });
        }
    }

    // Generate estimates
    const estCount = tenant.id === 'TEN001' ? 50 : 20;
    const statuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED'];

    for (let i = 0; i < estCount; i++) {
        const date = getRandomDate(START_DATE, END_DATE);
        const validUntilDate = new Date(date);
        validUntilDate.setDate(validUntilDate.getDate() + 15);

        const customer = tenantCustomers.length > 0
            ? tenantCustomers[Math.floor(Math.random() * tenantCustomers.length)]
            : { id: 'WALK-IN', name: 'Walk-in Customer', phone: '' };

        const estimateItems = [];
        let subtotal = 0;
        let totalGst = 0;
        const itemCount = Math.floor(Math.random() * 4) + 1;

        for (let j = 0; j < itemCount; j++) {
            const prod = tenantProducts[Math.floor(Math.random() * tenantProducts.length)];
            const qty = Math.floor(Math.random() * 3) + 1;
            const discount = Math.floor(Math.random() * 15);
            const lineAmount = prod.selling_price * qty * (1 - discount / 100);
            const lineGst = (lineAmount * prod.gst_rate) / 100;

            estimateItems.push({
                id: `EI-${tenant.id}-${String(globalEstCounter).padStart(4, '0')}-${j + 1}`,
                name: prod.name,
                sku: prod.sku,
                qty,
                rate: prod.selling_price,
                discount,
                taxRate: prod.gst_rate,
                amount: lineAmount
            });
            subtotal += lineAmount;
            totalGst += lineGst;
        }

        const status = statuses[Math.floor(Math.random() * statuses.length)];

        allEstimates.push({
            id: `EST-${tenant.id}-${String(globalEstCounter++).padStart(4, '0')}`,
            estimateNo: `EST-${tenant.id}-${String(allEstimates.filter(e => e.tenant_id === tenant.id).length + 1).padStart(5, '0')}`,
            tenant_id: tenant.id,
            date,
            validUntil: validUntilDate.toISOString().split('T')[0],
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email || `${customer.name?.toLowerCase().replace(' ', '.')}@email.com`
            },
            items: estimateItems,
            subtotal,
            gst: totalGst,
            total: subtotal + totalGst,
            notes: "Thank you for your business!",
            terms: "1. Prices valid for 15 days.\n2. GST extra as applicable.",
            status,
            createdBy: `EMP-${tenant.id}-1`,
            createdAt: new Date(date).toISOString(),
            convertedToInvoice: status === 'CONVERTED' ? `INV-${tenant.id}-${String(i + 1).padStart(5, '0')}` : null,
            sector: tenant.sector,
            business_type: tenant.business_type
        });
    }
});

// Generate daily finance records
const dateMap = {};
let curr = new Date(START_DATE);
while (curr <= END_DATE) {
    TENANTS.forEach(tenant => {
        const dStr = curr.toISOString().split('T')[0];
        dateMap[`${tenant.id}-${dStr}`] = {
            id: `DF-${tenant.id}-${dStr}`,
            date: dStr,
            tenant_id: tenant.id,
            cash_sales: 0,
            online_sales: 0,
            total_sales: 0,
            expenses: 0,
            cash_in_drawer: 15000,
            notes: "Daily settlement complete",
            timestamp: new Date().toISOString(),
            sector: tenant.sector
        };
    });
    curr.setDate(curr.getDate() + 1);
}

allPayments.forEach(p => {
    const key = `${p.tenant_id}-${p.date}`;
    const record = dateMap[key];
    if (record) {
        if (p.mode === "CASH") record.cash_sales += p.amount;
        else record.online_sales += p.amount;
        record.total_sales += p.amount;
    }
});

Object.values(dateMap).forEach(val => allDailyFinance.push(val));

// ============= WRITE FILES =============

fs.writeFileSync(path.join(BASE_PATH, 'tenants.ts'), `export const tenants = ${JSON.stringify(TENANTS.map(t => ({
    id: t.id,
    name: t.name,
    type: t.type,
    business_type: t.business_type,
    sector: t.sector
})), null, 4)};`);

fs.writeFileSync(path.join(BASE_PATH, 'branches.ts'), `export const branches = ${JSON.stringify(BRANCHES, null, 4)};`);
fs.writeFileSync(path.join(BASE_PATH, 'employees.ts'), `export const employees = ${JSON.stringify(allEmployees, null, 4)};`);
fs.writeFileSync(path.join(BASE_PATH, 'customers.ts'), `export const customers = ${JSON.stringify(allCustomers, null, 4)};`);
fs.writeFileSync(path.join(BASE_PATH, 'inventory.ts'), `export const inventory = ${JSON.stringify(allInventory, null, 4)};`);
fs.writeFileSync(path.join(BASE_PATH, 'sales_invoices.ts'), `export const salesInvoices = ${JSON.stringify(allSalesInvoices, null, 4)};`);
fs.writeFileSync(path.join(BASE_PATH, 'sales_items.ts'), `export const salesItems = ${JSON.stringify(allSalesItems, null, 4)};`);
fs.writeFileSync(path.join(BASE_PATH, 'payments.ts'), `export const payments = ${JSON.stringify(allPayments, null, 4)};`);
fs.writeFileSync(path.join(BASE_PATH, 'transactions.ts'), `export const transactions = ${JSON.stringify(allTransactions, null, 4)};`);
fs.writeFileSync(path.join(BASE_PATH, 'daily_finance.ts'), `export const daily_finance = ${JSON.stringify(allDailyFinance, null, 4)};`);
fs.writeFileSync(path.join(BASE_PATH, 'estimates.ts'), `export const estimates = ${JSON.stringify(allEstimates, null, 4)};`);

console.log("=== MOCK DATA VALIDATION COMPLETE ===");
console.log(`Tenants: ${TENANTS.length}`);
console.log(`Branches: ${BRANCHES.length}`);
console.log(`Employees: ${allEmployees.length}`);
console.log(`Customers: ${allCustomers.length}`);
console.log(`Inventory: ${allInventory.length}`);
console.log(`Sales Invoices: ${allSalesInvoices.length}`);
console.log(`Sales Items: ${allSalesItems.length}`);
console.log(`Payments: ${allPayments.length}`);
console.log(`Transactions: ${allTransactions.length}`);
console.log(`Daily Finance: ${allDailyFinance.length}`);
console.log(`Estimates: ${allEstimates.length}`);
console.log("=====================================");
