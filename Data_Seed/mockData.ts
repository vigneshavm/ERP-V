
// import { Product, Transaction, Cheque, Employee, PurchaseOrder, LaborPayment, TransactionType, Tenant } from './src/types';
// import { MockDatabase } from './src/types/data';

// // --- Helpers ---
// const subDays = (days: number) => {
//     const d = new Date();
//     d.setDate(d.getDate() - days);
//     return d.toISOString();
// };

// const addDays = (days: number) => {
//     const d = new Date();
//     d.setDate(d.getDate() + days);
//     return d.toISOString();
// };

// // --- Tenants Mock (Moved Up) ---
// export const MOCK_TENANTS: Tenant[] = [
//     {
//         id: '1', name: 'Big Bazaar', subdomain: 'big-bazaar', modules: ['POS', 'INVENTORY', 'FINANCE'], isActive: true,
//         region: { currency: 'INR', currencySymbol: '₹', dateFormat: 'DD/MM/YYYY' }, sector: 'General', theme: 'light', layout: 'standard', domain: 'bigbazaar.com', primaryColor: '#f97316',
//         locations: [
//             { city: 'Mumbai', branches: [{ id: 'br-bb-mum-01', name: 'Lower Parel', city: 'Mumbai', address: 'Phoenix Mills' }, { id: 'br-bb-mum-02', name: 'Vashi', city: 'Mumbai', address: 'Inorbit Mall' }] },
//             { city: 'Bangalore', branches: [{ id: 'br-bb-blr-01', name: 'Indiranagar', city: 'Bangalore', address: '100 Feet Road' }, { id: 'br-bb-blr-02', name: 'Koramangala', city: 'Bangalore', address: 'Forum Mall' }] }
//         ]
//     },
//     {
//         id: '2', name: 'Apollo Pharmacy', subdomain: 'apollo', modules: ['POS', 'INVENTORY'], isActive: true,
//         region: { currency: 'INR', currencySymbol: '₹', dateFormat: 'DD/MM/YYYY' }, sector: 'Pharmacy', theme: 'light', layout: 'compact', domain: 'apollopharmacy.in', primaryColor: '#059669',
//         locations: [
//             { city: 'Chennai', branches: [{ id: 'br-ap-chn-01', name: 'Adyar', city: 'Chennai', address: 'LB Road' }, { id: 'br-ap-chn-02', name: 'Anna Nagar', city: 'Chennai', address: '2nd Avenue' }] },
//             { city: 'Bangalore', branches: [{ id: 'br-ap-blr-01', name: 'Jayanagar', city: 'Bangalore', address: '4th Block' }, { id: 'br-ap-blr-02', name: 'Whitefield', city: 'Bangalore', address: 'ITPL Road' }] },
//             { city: 'Trichy', branches: [{ id: 'br-ap-try-01', name: 'Cantt', city: 'Trichy', address: 'Cantonment' }] }
//         ]
//     },
//     {
//         id: '3', name: 'Reliance Digital', subdomain: 'reliance-digital', modules: ['POS', 'INVENTORY', 'STOREFRONT'], isActive: true,
//         region: { currency: 'INR', currencySymbol: '₹', dateFormat: 'DD/MM/YYYY' }, sector: 'Electronics', theme: 'dark', layout: 'compact', domain: 'reliancedigital.in', primaryColor: '#e11d48',
//         locations: [
//             { city: 'Chennai', branches: [{ id: 'br-rel-chn-01', name: 'Anna Nagar', city: 'Chennai', address: '2nd Avenue, Near Roundtana' }, { id: 'br-rel-chn-02', name: 'T Nagar', city: 'Chennai', address: 'North Usman Road' }, { id: 'br-rel-chn-03', name: 'Velachery', city: 'Chennai', address: 'Phoenix Marketcity' }] },
//             { city: 'Mumbai', branches: [{ id: 'br-rel-mum-01', name: 'Andheri West', city: 'Mumbai', address: 'Link Road' }, { id: 'br-rel-mum-02', name: 'Bandra', city: 'Mumbai', address: 'Hill Road' }] }
//         ]
//     },
//     {
//         id: '4', name: 'Reliance Smart Point', subdomain: 'reliance-smart', modules: ['POS', 'INVENTORY', 'DAILY'], isActive: true,
//         region: { currency: 'INR', currencySymbol: '₹', dateFormat: 'DD/MM/YYYY' }, sector: 'Grocery', theme: 'light', layout: 'standard', domain: 'reliancesmart.in', primaryColor: '#16a34a',
//         locations: [
//             { city: 'Hyderabad', branches: [{ id: 'br-rs-hyd-01', name: 'Banjara Hills', city: 'Hyderabad', address: 'Road No 12' }, { id: 'br-rs-hyd-02', name: 'Jubilee Hills', city: 'Hyderabad', address: 'Road No 36' }] },
//             { city: 'Pune', branches: [{ id: 'br-rs-pun-01', name: 'Viman Nagar', city: 'Pune', address: 'Phoenix Marketcity' }, { id: 'br-rs-pun-02', name: 'Hinjewadi', city: 'Pune', address: 'Phase 1' }] },
//             { city: 'Tirunelveli', branches: [{ id: 'br-rs-ten-01', name: 'Junction', city: 'Tirunelveli', address: 'Near Railway Station' }] }
//         ]
//     },
//     {
//         id: '5', name: 'Spar Hypermarket', subdomain: 'spar', modules: ['POS', 'INVENTORY', 'FINANCE', 'PURCHASE'], isActive: true,
//         region: { currency: 'INR', currencySymbol: '₹', dateFormat: 'DD/MM/YYYY' }, sector: 'Supermarket', theme: 'light', layout: 'standard', domain: 'sparindia.com', primaryColor: '#dc2626',
//         locations: [
//             { city: 'Bangalore', branches: [{ id: 'br-sp-blr-01', name: 'Mantri Square', city: 'Bangalore', address: 'Malleswaram' }, { id: 'br-sp-blr-02', name: 'Bannerghatta', city: 'Bangalore', address: 'Vega City Mall' }] },
//             { city: 'Coimbatore', branches: [{ id: 'br-sp-cbe-01', name: 'Brookefields', city: 'Coimbatore', address: 'Brooke Bond Road' }, { id: 'br-sp-cbe-02', name: 'Prozone', city: 'Coimbatore', address: 'Sathy Road' }] }
//         ]
//     },
//     {
//         id: '6', name: 'Pothys', subdomain: 'pothys', modules: ['POS', 'INVENTORY', 'SALES'], isActive: true,
//         region: { currency: 'INR', currencySymbol: '₹', dateFormat: 'DD/MM/YYYY' }, sector: 'Textile', theme: 'light', layout: 'standard', domain: 'pothys.com', primaryColor: '#7c2d12',
//         locations: [
//             { city: 'Chennai', branches: [{ id: 'br-po-chn-01', name: 'T Nagar', city: 'Chennai', address: 'Panagal Park' }, { id: 'br-po-chn-02', name: 'Tambaram', city: 'Chennai', address: 'GST Road' }, { id: 'br-po-chn-03', name: 'Egmore', city: 'Chennai', address: 'Pantheon Road' }] },
//             { city: 'Madurai', branches: [{ id: 'br-po-mdu-01', name: 'West Masi St', city: 'Madurai', address: 'West Masi Street' }] },
//             { city: 'Tirunelveli', branches: [{ id: 'br-po-ten-01', name: 'Town', city: 'Tirunelveli', address: 'East Car Street' }] }
//         ]
//     },
//     {
//         id: '7', name: 'Poorvika Mobiles', subdomain: 'poorvika', modules: ['POS', 'STOREFRONT'], isActive: true,
//         region: { currency: 'INR', currencySymbol: '₹', dateFormat: 'DD/MM/YYYY' }, sector: 'Mobile Shop', theme: 'dark', layout: 'compact', domain: 'poorvika.com', primaryColor: '#ea580c',
//         locations: [
//             { city: 'Chennai', branches: [{ id: 'br-pv-chn-01', name: 'Chromepet', city: 'Chennai', address: 'GST Road' }, { id: 'br-pv-chn-02', name: 'Tambaram', city: 'Chennai', address: 'Market Road' }] },
//             { city: 'Trichy', branches: [{ id: 'br-pv-try-01', name: 'Thillai Nagar', city: 'Trichy', address: 'Main Road' }, { id: 'br-pv-try-02', name: 'Cantonment', city: 'Trichy', address: 'Birds Road' }] }
//         ]
//     }
// ];



// // --- Mock Database ---
// export const MOCK_DATABASE: MockDatabase = {
//     '1': { // Big Bazaar
//         products: [
//             { id: 'bb-01', sku: 'BB-STAT-NB', name: 'Classmate Notebook A4', category: 'Stationery', price: 150, cost: 90, stock: 500, sector: 'General', tenantId: '1', branchId: 'br-bb-mum-01', barcode: '4001', productType: 'Stationery', lastRestocked: subDays(100) },
//             { id: 'bb-02', sku: 'BB-BEV-COKE', name: 'Coca Cola 1.25L', category: 'Beverage', price: 95, cost: 70, stock: 200, sector: 'General', tenantId: '1', branchId: 'br-bb-blr-01', barcode: '4002', productType: 'FMCG' }
//         ],
//         customers: [
//             { id: 'c1', name: 'Walk-in Customer', phone: '000-000-0000', points: 0 }
//         ],
//         employees: [
//             { id: 'e4', name: 'Vikram (Helper)', role: 'Helper', dailyRate: 500, sector: 'General', branchId: 'br-bb-mdu-01', systemRole: 'Staff', pin: '2222' }
//         ],
//         transactions: [
//             { id: 't5', type: TransactionType.EXPENSE, category: 'Marketing', amount: 5000, date: subDays(10), description: 'Local Flyers', sector: 'General', branchId: 'br-bb-mdu-01' }
//         ],
//         cheques: [],
//         salesHistory: [
//             { id: 'inv-003', date: subDays(1), total: 130, customerId: 'c1', sector: 'General', branchId: 'br-bb-mdu-01', paymentMethod: 'CASH', taxMode: 'INCLUSIVE', items: [], status: 'COMPLETED', paymentStatus: 'PAID' } // Items would need deep copy of products, keeping empty for brevity or manual reconstruction if needed.
//         ],
//         purchaseOrders: [],
//         laborPayments: [
//             { id: 'lp2', employeeId: 'e4', amount: 1000, date: subDays(2), type: 'ADVANCE' }
//         ]
//     },
//     '2': { // Apollo Pharmacy
//         products: [
//             { id: 'ap-chn01-01', sku: 'MED-DOLO-650', name: 'Dolo 650', category: 'Analgesic', price: 30, cost: 18, stock: 1200, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-chn-01', barcode: '5001', composition: 'Paracetamol 650mg', unit: 'Strip', expiryDate: addDays(400) },
//             { id: 'ap-chn01-02', sku: 'MED-AUG-625', name: 'Augmentin 625 Duo', category: 'Antibiotic', price: 201, cost: 150, stock: 50, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-chn-01', barcode: '5002', composition: 'Amoxicillin', unit: 'Strip', lastRestocked: subDays(130), expiryDate: addDays(25) },
//             { id: 'ap-chn01-03', sku: 'MED-PAN-40', name: 'Pantop 40', category: 'Antacid', price: 155, cost: 110, stock: 300, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-chn-01', barcode: '5003', composition: 'Pantoprazole', unit: 'Strip', expiryDate: addDays(55) },
//             { id: 'ap-chn01-04', sku: 'MED-VITS-CZ', name: 'Limcee Vitamin C', category: 'Supplements', price: 25, cost: 15, stock: 500, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-chn-01', barcode: '5004', composition: 'Ascorbic Acid', unit: 'Strip', expiryDate: addDays(85) },
//             { id: 'ap-chn02-01', sku: 'MED-DOLO-650', name: 'Dolo 650', category: 'Analgesic', price: 30, cost: 18, stock: 800, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-chn-02', barcode: '5001', composition: 'Paracetamol 650mg', unit: 'Strip' },
//             { id: 'ap-chn02-02', sku: 'MED-BEN-DRYL', name: 'Benadryl Cough Syrup', category: 'Syrup', price: 125, cost: 95, stock: 150, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-chn-02', barcode: '5005', composition: 'Diphenhydramine', unit: 'Bottle' },
//             { id: 'ap-chn02-03', sku: 'DEV-ACCU-CHK', name: 'Accu-Chek Active Strips', category: 'Device', price: 950, cost: 750, stock: 40, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-chn-02', barcode: '5006', brand: 'Roche', unit: 'Box' },
//             { id: 'ap-chn02-04', sku: 'MED-VOL-SPR', name: 'Volini Spray 60g', category: 'Pain Relief', price: 210, cost: 160, stock: 60, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-chn-02', barcode: '5007', brand: 'Sun Pharma', unit: 'Can' },
//             { id: 'ap-blr01-01', sku: 'MED-DOLO-650', name: 'Dolo 650', category: 'Analgesic', price: 30, cost: 18, stock: 1500, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-blr-01', barcode: '5001', composition: 'Paracetamol 650mg', unit: 'Strip' },
//             { id: 'ap-blr01-02', sku: 'MED-SHEL-500', name: 'Shelcal 500', category: 'Supplements', price: 130, cost: 90, stock: 200, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-blr-01', barcode: '5008', composition: 'Calcium + Vit D3', unit: 'Strip' },
//             { id: 'ap-blr01-03', sku: 'HYG-DET-250', name: 'Dettol Handwash 250ml', category: 'Hygiene', price: 99, cost: 70, stock: 120, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-blr-01', barcode: '5009', brand: 'Dettol', unit: 'Bottle' },
//             { id: 'ap-blr02-01', sku: 'MED-DOLO-650', name: 'Dolo 650', category: 'Analgesic', price: 30, cost: 18, stock: 600, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-blr-02', barcode: '5001', composition: 'Paracetamol 650mg', unit: 'Strip' },
//             { id: 'ap-blr02-02', sku: 'MED-AZI-500', name: 'Azithral 500', category: 'Antibiotic', price: 115, cost: 85, stock: 80, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-blr-02', barcode: '5010', composition: 'Azithromycin', unit: 'Strip' },
//             { id: 'ap-blr02-03', sku: 'BABY-PAM-L', name: 'Pampers Active Baby L', category: 'Baby Care', price: 899, cost: 720, stock: 25, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-blr-02', barcode: '5011', brand: 'Pampers', unit: 'Pack' },
//             { id: 'ap-try01-01', sku: 'MED-DOLO-650', name: 'Dolo 650', category: 'Analgesic', price: 30, cost: 18, stock: 900, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-try-01', barcode: '5001', composition: 'Paracetamol 650mg', unit: 'Strip' },
//             { id: 'ap-try01-02', sku: 'MED-AUG-625', name: 'Augmentin 625 Duo', category: 'Antibiotic', price: 201, cost: 150, stock: 65, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-try-01', barcode: '5002', composition: 'Amoxicillin', unit: 'Strip' },
//             { id: 'ap-try01-03', sku: 'DEV-DIG-THERM', name: 'Omron Digital Thermometer', category: 'Device', price: 280, cost: 190, stock: 15, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-try-01', barcode: '5012', brand: 'Omron', unit: 'Piece' },
//             { id: 'ap-try01-04', sku: 'MED-GLY-COM', name: 'Glycomet GP1', category: 'Diabetes', price: 65, cost: 45, stock: 200, sector: 'Pharmacy', tenantId: '2', branchId: 'br-ap-try-01', barcode: '5013', composition: 'Metformin + Glimepiride', unit: 'Strip' }
//         ],
//         customers: [
//             { id: 'c1', name: 'Walk-in Customer', phone: '000-000-0000', points: 0 }
//         ],
//         employees: [
//             { id: 'e5', name: 'Priya (Pharmacist)', role: 'Pharmacy Manager', dailyRate: 1500, sector: 'Pharmacy', branchId: 'br-ap-chn-01', systemRole: 'Manager', pin: '5000' },
//             { id: 'e8', name: 'Sanjay (Trichy Mgr)', role: 'Pharmacy Manager', dailyRate: 1400, sector: 'Pharmacy', branchId: 'br-ap-try-01', systemRole: 'Manager', pin: '5001' },
//             { id: 'e9', name: 'Meera (Adyar Staff)', role: 'Pharmacist', dailyRate: 900, sector: 'Pharmacy', branchId: 'br-ap-chn-01', systemRole: 'Staff', pin: '5002' }
//         ],
//         transactions: [],
//         cheques: [],
//         salesHistory: [],
//         purchaseOrders: [],
//         laborPayments: []
//     },
//     '3': { // Reliance Digital
//         products: [
//             { id: 'rd-01', sku: 'MOB-IP15-128', name: 'iPhone 15 (128GB)', category: 'Smartphone', price: 69900, cost: 62000, stock: 12, sector: 'Electronics', tenantId: '3', branchId: 'br-rel-chn-01', brand: 'Apple', hsnCode: '8517', gstPercentage: 18, barcode: '3001' },
//             { id: 'rd-02', sku: 'TV-SONY-55', name: 'Sony 55" 4K Google TV', category: 'Television', price: 65000, cost: 54000, stock: 5, sector: 'Electronics', tenantId: '3', branchId: 'br-rel-mum-01', brand: 'Sony', hsnCode: '8528', gstPercentage: 18, barcode: '3004' }
//         ],
//         customers: [
//             { id: 'c1', name: 'Walk-in Customer', phone: '000-000-0000', points: 0 },
//             { id: 'c3', name: 'Sneha Gupta', phone: '9988776655', points: 1200 },
//             { id: 'c4', name: 'Amit Verma', phone: '8877665544', points: 85 }
//         ],
//         employees: [
//             { id: 'e3', name: 'Anita (Cashier)', role: 'Cashier', dailyRate: 900, sector: 'Electronics', branchId: 'br-rel-chn-01', systemRole: 'Staff', pin: '1111' }
//         ],
//         transactions: [
//             { id: 't4', type: TransactionType.EXPENSE, category: 'Inventory', amount: 150000, date: subDays(5), description: 'Samsung Stock Payment', sector: 'Electronics', branchId: 'br-rel-chn-01' }
//         ],
//         cheques: [
//             { id: 'ch1', number: '000456', bankName: 'HDFC Bank', payee: 'Samsung India', amount: 150000, date: subDays(5), status: 'CLEARED', type: 'ISSUED', sector: 'Electronics' }
//         ],
//         salesHistory: [
//             { id: 'inv-002', date: subDays(0), total: 79900, customerId: 'c3', sector: 'Electronics', branchId: 'br-rel-chn-01', paymentMethod: 'CARD', taxMode: 'EXCLUSIVE', items: [], status: 'COMPLETED', paymentStatus: 'PAID' },
//             { id: 'inv-004', date: subDays(2), total: 24900, customerId: 'c4', sector: 'Electronics', branchId: 'br-rel-chn-01', paymentMethod: 'UPI', taxMode: 'INCLUSIVE', items: [], status: 'COMPLETED', paymentStatus: 'PAID' }
//         ],
//         purchaseOrders: [
//             { id: 'po-101', vendor: 'Apple Distributors', date: subDays(3), total: 800000, status: 'APPROVED', sector: 'Electronics', branchId: 'br-rel-chn-01', items: [{ name: 'iPhone 15', qty: 10, cost: 72000 }] }
//         ],
//         laborPayments: []
//     },
//     '4': { // Reliance Smart Point
//         products: [
//             { id: 'rs-01', sku: 'GR-ATTA-ASH', name: 'Aashirvaad Atta 5kg', category: 'Staples', price: 280, cost: 230, stock: 150, sector: 'Grocery', tenantId: '4', branchId: 'br-rs-hyd-01', brand: 'Aashirvaad', unit: 'Bag', barcode: '6001', gstPercentage: 5, expiryDate: addDays(45) },
//             { id: 'rs-02', sku: 'GR-OIL-FRT', name: 'Fortune Sunflower Oil 1L', category: 'Oil', price: 145, cost: 110, stock: 80, sector: 'Grocery', tenantId: '4', branchId: 'br-rs-ten-01', brand: 'Fortune', unit: 'Pouch', barcode: '6002', gstPercentage: 5, expiryDate: addDays(120) }
//         ],
//         customers: [
//             { id: 'c1', name: 'Walk-in Customer', phone: '000-000-0000', points: 0 }
//         ],
//         employees: [
//             { id: 'e6', name: 'Karthik (Grocer)', role: 'Grocery Manager', dailyRate: 1200, sector: 'Grocery', branchId: 'br-rs-ten-01', systemRole: 'Manager', pin: '6000' }
//         ],
//         transactions: [],
//         cheques: [],
//         salesHistory: [],
//         purchaseOrders: [],
//         laborPayments: []
//     },
//     '5': { // Spar Hypermarket
//         products: [
//             { id: 'sp-01', sku: 'SP-FRUIT-APL', name: 'Washington Apple', category: 'Fresh Produce', price: 220, cost: 150, stock: 40, sector: 'Supermarket', tenantId: '5', branchId: 'br-sp-blr-01', unit: 'Kg', barcode: '7001', expiryDate: addDays(10) },
//             { id: 'sp-02', sku: 'SP-DAIRY-AMUL', name: 'Amul Butter 500g', category: 'Dairy', price: 275, cost: 240, stock: 60, sector: 'Supermarket', tenantId: '5', branchId: 'br-sp-cbe-01', brand: 'Amul', barcode: '7002', expiryDate: addDays(65) }
//         ],
//         customers: [
//             { id: 'c1', name: 'Walk-in Customer', phone: '000-000-0000', points: 0 }
//         ],
//         employees: [
//             { id: 'e7', name: 'Deepa (Supermarket)', role: 'Store Manager', dailyRate: 1800, sector: 'Supermarket', branchId: 'br-sp-cbe-01', systemRole: 'Manager', pin: '7000' }
//         ],
//         transactions: [],
//         cheques: [],
//         salesHistory: [],
//         purchaseOrders: [],
//         laborPayments: []
//     },
//     '6': { // Pothys
//         products: [
//             { id: 'po-01', sku: 'TX-SILK-KAN', name: 'Kanjivaram Silk Saree', category: 'Ethnic Wear', price: 15000, cost: 9000, stock: 25, sector: 'Textile', tenantId: '6', branchId: 'br-po-chn-01', productType: 'Saree', hsnCode: '5007', gstPercentage: 12, barcode: '2001', lastRestocked: subDays(200) },
//             { id: 'po-02', sku: 'TX-SHIRT-LP', name: 'LP Formal Shirt Blue', category: 'Mens Wear', price: 2499, cost: 1200, stock: 100, sector: 'Textile', tenantId: '6', branchId: 'br-po-mdu-01', brand: 'Louis Philippe', barcode: '2002', gstPercentage: 5 }
//         ],
//         customers: [
//             { id: 'c1', name: 'Walk-in Customer', phone: '000-000-0000', points: 0 },
//             { id: 'c2', name: 'Rajesh Kumar', phone: '9876543210', points: 450 }
//         ],
//         employees: [
//             { id: 'e1', name: 'Ramesh (Manager)', role: 'Store Manager', dailyRate: 1500, sector: 'Textile', branchId: 'br-po-chn-01', systemRole: 'Manager', pin: '1234' },
//             { id: 'e2', name: 'Suresh (Sales)', role: 'Sales Executive', dailyRate: 800, sector: 'Textile', branchId: 'br-po-chn-01', systemRole: 'Staff', pin: '0000' }
//         ],
//         transactions: [
//             { id: 't1', type: TransactionType.EXPENSE, category: 'Rent', amount: 25000, date: subDays(1), description: 'Shop Rent - Chennai - T Nagar', sector: 'Textile', branchId: 'br-po-chn-01' },
//             { id: 't2', type: TransactionType.EXPENSE, category: 'Utility', amount: 4500, date: subDays(2), description: 'Electricity Bill', sector: 'Textile', branchId: 'br-po-chn-01' },
//             { id: 't3', type: TransactionType.INCOME, category: 'Sales', amount: 45000, date: subDays(0), description: 'Daily Sales Cash Deposit', sector: 'Textile', branchId: 'br-po-chn-01' }
//         ],
//         cheques: [
//             { id: 'ch2', number: '889977', bankName: 'SBI', payee: 'Rajesh Kumar', amount: 25000, date: subDays(1), status: 'PENDING', type: 'RECEIVED', sector: 'Textile' },
//             { id: 'ch3', number: '112233', bankName: 'ICICI', payee: 'Landlord', amount: 25000, date: subDays(0), status: 'PENDING', type: 'ISSUED', sector: 'Textile' }
//         ],
//         salesHistory: [
//             { id: 'inv-001', date: subDays(0), total: 4698, customerId: 'c2', sector: 'Textile', branchId: 'br-po-chn-01', paymentMethod: 'UPI', taxMode: 'INCLUSIVE', items: [], status: 'COMPLETED', paymentStatus: 'PAID' }
//         ],
//         purchaseOrders: [
//             { id: 'po-102', vendor: 'Raymonds Wholesale', date: subDays(1), total: 50000, status: 'PENDING', sector: 'Textile', branchId: 'br-po-chn-01', items: [{ name: 'Suit Fabric', qty: 20, cost: 2500 }] }
//         ],
//         laborPayments: [
//             { id: 'lp1', employeeId: 'e1', amount: 5000, date: subDays(5), type: 'ADVANCE', note: 'Emergency advance' },
//             { id: 'lp3', employeeId: 'e2', amount: 20000, date: subDays(30), type: 'SALARY', note: 'Last Month Salary' }
//         ]
//     },
//     '7': { // Poorvika Mobiles
//         products: [
//             { id: 'pv-01', sku: 'PV-ACC-AIRP', name: 'Apple AirPods Pro 2', category: 'Accessories', price: 24900, cost: 19000, stock: 20, sector: 'Mobile Shop', tenantId: '7', branchId: 'br-pv-chn-01', brand: 'Apple', barcode: '8001', gstPercentage: 18 },
//             { id: 'pv-02', sku: 'PV-MOB-S24', name: 'Samsung Galaxy S24 Ultra', category: 'Smartphone', price: 124999, cost: 105000, stock: 8, sector: 'Mobile Shop', tenantId: '7', branchId: 'br-pv-try-01', brand: 'Samsung', barcode: '8002', gstPercentage: 18 }
//         ],
//         customers: [
//             { id: 'c1', name: 'Walk-in Customer', phone: '000-000-0000', points: 0 }
//         ],
//         employees: [],
//         transactions: [],
//         cheques: [],
//         salesHistory: [],
//         purchaseOrders: [],
//         laborPayments: []
//     }
// }

// // --- Legacy Compatibility Exports (Flattened) ---
// // These ensure existing code continues to work without changes
// export const MOCK_PRODUCTS: Product[] = Object.values(MOCK_DATABASE).flatMap(d => d.products);



// export const MOCK_EMPLOYEES: Employee[] = Object.values(MOCK_DATABASE).flatMap(d => d.employees);
// export const MOCK_TRANSACTIONS: Transaction[] = Object.values(MOCK_DATABASE).flatMap(d => d.transactions);
// export const MOCK_CHEQUES: Cheque[] = Object.values(MOCK_DATABASE).flatMap(d => d.cheques);

// export const MOCK_ORDERS: PurchaseOrder[] = Object.values(MOCK_DATABASE).flatMap(d => d.purchaseOrders);
// export const MOCK_LABOR_PAYMENTS: LaborPayment[] = Object.values(MOCK_DATABASE).flatMap(d => d.laborPayments);

// // --- Branches (Derived) ---
// export const MOCK_BRANCHES = MOCK_TENANTS.flatMap(t =>
//     t.locations.flatMap(l =>
//         l.branches.map(b => ({
//             id: b.id,
//             name: b.name,
//             sector: t.sector
//         }))
//     )
// );

// // --- App Defaults ---
// export const APP_DEFAULTS = {
//     currentSector: 'General',
//     currentBranch: 'br-bb-mdu-01',
//     role: 'Staff',
//     theme: 'light'
// };