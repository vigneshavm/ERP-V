
import { Product, Sale, Customer, Transaction, Cheque, Employee, PurchaseOrder, LaborPayment } from './types';

// --- Helpers ---
const subDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
};

// --- Inventory Mock ---
export const MOCK_PRODUCTS: Product[] = [
    // --- TEXTILE SECTOR (Focus on Product Types) ---
    // Gents Pant Type
    { id: 't1', sku: 'GP-JN-32-BLU', name: 'Blue Denim Jeans Slim 32', productType: 'Gents Pant', category: 'Mens Wear', price: 1499, cost: 800, stock: 45, sector: 'Textile', branch: 'Alpha', barcode: '2001' },
    { id: 't2', sku: 'GP-CG-34-GRN', name: 'Olive Green Cargo 34', productType: 'Gents Pant', category: 'Mens Wear', price: 1899, cost: 950, stock: 30, sector: 'Textile', branch: 'Alpha', barcode: '2002' },
    { id: 't3', sku: 'GP-CT-32-BLK', name: 'Black Cotton Formal Pant', productType: 'Gents Pant', category: 'Mens Wear', price: 1299, cost: 700, stock: 50, sector: 'Textile', branch: 'Alpha', barcode: '2003' },
    
    // Shirt Type
    { id: 't4', sku: 'SH-LN-WHT-L', name: 'Pure Linen White Shirt L', productType: 'Shirt', category: 'Mens Wear', price: 2199, cost: 1200, stock: 25, sector: 'Textile', branch: 'Alpha', barcode: '2004' },
    { id: 't5', sku: 'SH-RM-S-40', name: 'Ramraj Silk Shirt 40', productType: 'Shirt', category: 'Mens Wear', price: 2499, cost: 1500, stock: 20, sector: 'Textile', branch: 'Alpha', barcode: '2005' },
    { id: 't6', sku: 'SH-PT-CHK-M', name: 'Casual Check Pattern Shirt M', productType: 'Shirt', category: 'Mens Wear', price: 999, cost: 450, stock: 60, sector: 'Textile', branch: 'Alpha', barcode: '2006' },

    // Women's Type
    { id: 't7', sku: 'WM-SR-SILK', name: 'Kanchipuram Silk Saree', productType: 'Saree', category: 'Womens Wear', price: 12000, cost: 8500, stock: 15, sector: 'Textile', branch: 'Alpha', barcode: '2007' },
    { id: 't8', sku: 'WM-KT-COT', name: 'Cotton Printed Kurti', productType: 'Kurti', category: 'Womens Wear', price: 899, cost: 350, stock: 100, sector: 'Textile', branch: 'Alpha', barcode: '2008' },

    // --- ELECTRONICS SECTOR ---
    { id: 'e1', sku: 'MOB-IP15', name: 'iPhone 15 128GB', productType: 'Mobile', category: 'Smartphones', price: 79900, cost: 72000, stock: 10, sector: 'Electronics', branch: 'Beta', barcode: '3001' },
    { id: 'e2', sku: 'MOB-S24', name: 'Samsung S24 Ultra', productType: 'Mobile', category: 'Smartphones', price: 129999, cost: 115000, stock: 5, sector: 'Electronics', branch: 'Beta', barcode: '3002' },
    { id: 'e3', sku: 'ACC-APRO', name: 'AirPods Pro 2', productType: 'Accessory', category: 'Audio', price: 24900, cost: 18000, stock: 20, sector: 'Electronics', branch: 'Beta', barcode: '3003' },
    { id: 'e4', sku: 'LAP-MAC-M2', name: 'MacBook Air M2', productType: 'Laptop', category: 'Computers', price: 99900, cost: 88000, stock: 8, sector: 'Electronics', branch: 'Beta', barcode: '3004' },

    // --- GENERAL SECTOR ---
    { id: 'g1', sku: 'STAT-NB-A4', name: 'Classmate Notebook A4', productType: 'Stationery', category: 'Office', price: 65, cost: 40, stock: 500, sector: 'General', branch: 'Gamma', barcode: '4001' },
    { id: 'g2', sku: 'BEV-COKE', name: 'Coca Cola 750ml', productType: 'Beverage', category: 'Drinks', price: 45, cost: 30, stock: 100, sector: 'General', branch: 'Gamma', barcode: '4002' },
    { id: 'g3', sku: 'SNK-CHOC', name: 'Dairy Milk Silk', productType: 'Snack', category: 'Food', price: 80, cost: 60, stock: 200, sector: 'General', branch: 'Gamma', barcode: '4003' },
];

// --- Customers Mock ---
export const MOCK_CUSTOMERS: Customer[] = [
    { id: 'c1', name: 'Walk-in Customer', phone: '000-000-0000', points: 0 },
    { id: 'c2', name: 'Rajesh Kumar', phone: '9876543210', points: 450 },
    { id: 'c3', name: 'Sneha Gupta', phone: '9988776655', points: 1200 },
    { id: 'c4', name: 'Amit Verma', phone: '8877665544', points: 85 }
];

// --- Employees Mock ---
export const MOCK_EMPLOYEES: Employee[] = [
    { id: 'e1', name: 'Ramesh (Manager)', role: 'Store Manager', dailyRate: 1500, sector: 'Textile', branch: 'Alpha' },
    { id: 'e2', name: 'Suresh (Sales)', role: 'Sales Executive', dailyRate: 800, sector: 'Textile', branch: 'Alpha' },
    { id: 'e3', name: 'Anita (Cashier)', role: 'Cashier', dailyRate: 900, sector: 'Electronics', branch: 'Beta' },
    { id: 'e4', name: 'Vikram (Helper)', role: 'Helper', dailyRate: 500, sector: 'General', branch: 'Gamma' }
];

// --- Finance Mock ---
export const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 't1', type: 'EXPENSE', category: 'Rent', amount: 25000, date: subDays(1), description: 'Shop Rent - Alpha', sector: 'Textile', branch: 'Alpha' },
    { id: 't2', type: 'EXPENSE', category: 'Utility', amount: 4500, date: subDays(2), description: 'Electricity Bill', sector: 'Textile', branch: 'Alpha' },
    { id: 't3', type: 'INCOME', category: 'Sales', amount: 45000, date: subDays(0), description: 'Daily Sales Cash Deposit', sector: 'Textile', branch: 'Alpha' },
    { id: 't4', type: 'EXPENSE', category: 'Inventory', amount: 150000, date: subDays(5), description: 'Samsung Stock Payment', sector: 'Electronics', branch: 'Beta' },
    { id: 't5', type: 'EXPENSE', category: 'Marketing', amount: 5000, date: subDays(10), description: 'Local Flyers', sector: 'General', branch: 'Gamma' }
];

export const MOCK_CHEQUES: Cheque[] = [
    { id: 'ch1', number: '000456', bankName: 'HDFC Bank', payee: 'Samsung India', amount: 150000, date: subDays(5), status: 'CLEARED', type: 'ISSUED', sector: 'Electronics' },
    { id: 'ch2', number: '889977', bankName: 'SBI', payee: 'Rajesh Kumar', amount: 25000, date: subDays(1), status: 'PENDING', type: 'RECEIVED', sector: 'Textile' },
    { id: 'ch3', number: '112233', bankName: 'ICICI', payee: 'Landlord', amount: 25000, date: subDays(0), status: 'PENDING', type: 'ISSUED', sector: 'Textile' }
];

// --- Sales History Mock ---
export const MOCK_SALES: Sale[] = [
    { 
        id: 'inv-001', date: subDays(0), total: 4698, customerId: 'c2', sector: 'Textile', branch: 'Alpha', paymentMethod: 'UPI', taxMode: 'INCLUSIVE',
        items: [{ ...MOCK_PRODUCTS[0], qty: 2 }, { ...MOCK_PRODUCTS[3], qty: 1 }] 
    },
    { 
        id: 'inv-002', date: subDays(0), total: 79900, customerId: 'c3', sector: 'Electronics', branch: 'Beta', paymentMethod: 'CARD', taxMode: 'EXCLUSIVE',
        items: [{ ...MOCK_PRODUCTS[8], qty: 1 }] 
    },
    { 
        id: 'inv-003', date: subDays(1), total: 130, customerId: 'c1', sector: 'General', branch: 'Gamma', paymentMethod: 'CASH', taxMode: 'INCLUSIVE',
        items: [{ ...MOCK_PRODUCTS[12], qty: 2 }] 
    },
    { 
        id: 'inv-004', date: subDays(2), total: 24900, customerId: 'c4', sector: 'Electronics', branch: 'Beta', paymentMethod: 'UPI', taxMode: 'INCLUSIVE',
        items: [{ ...MOCK_PRODUCTS[10], qty: 1 }] 
    }
];

// --- Purchase Orders Mock ---
export const MOCK_ORDERS: PurchaseOrder[] = [
    { 
        id: 'po-101', vendor: 'Apple Distributors', date: subDays(3), total: 800000, status: 'APPROVED', sector: 'Electronics', branch: 'Beta',
        items: [{ name: 'iPhone 15', qty: 10, cost: 72000 }] 
    },
    { 
        id: 'po-102', vendor: 'Raymonds Wholesale', date: subDays(1), total: 50000, status: 'PENDING', sector: 'Textile', branch: 'Alpha',
        items: [{ name: 'Suit Fabric', qty: 20, cost: 2500 }] 
    }
];

// --- Labor Payments Mock ---
export const MOCK_LABOR_PAYMENTS: LaborPayment[] = [
    { id: 'lp1', employeeId: 'e1', amount: 5000, date: subDays(5), type: 'ADVANCE', note: 'Emergency advance' },
    { id: 'lp2', employeeId: 'e4', amount: 1000, date: subDays(2), type: 'ADVANCE' },
    { id: 'lp3', employeeId: 'e2', amount: 20000, date: subDays(30), type: 'SALARY', note: 'Last Month Salary' },
];
