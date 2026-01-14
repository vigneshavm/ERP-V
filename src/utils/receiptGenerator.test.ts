import { generateReceiptJSON } from './receiptGenerator';
import { Sale, CartItem } from '../types/sales';
import { Tenant, Branch } from '../types/tenant';
import { Sector, TaxMode } from '../types/common';

// --- Mock Data ---

const mockTenant: Tenant = {
    id: 'T001',
    name: 'Vijayalakshmi Textiles & Readymades',
    sector: Sector.TEXTILE,
    companyDetails: {
        addressLine1: 'Mela Periya Veethi, Mukkudal',
        phone: '04634-274206',
        city: 'Mukkudal',
        state: 'Tamil Nadu',
        stateCode: '33',
        country: 'India',
        pincode: '627415',
        email: 'test@example.com'
    },
    taxDetails: {
        gstin: '33AFNPA6099M1ZZ',
        taxSystem: 'GST',
        isGstEnabled: true
    }
};

const mockBranch: Branch = {
    id: 'B001',
    name: 'Main Branch',
    city: 'Mukkudal',
    address: 'Mela Periya Veethi, Mukkudal',
    phone: '04634-274206',
    config: {
        // taxDetails removed as it is not on BranchConfig partial key
    }
};

const mockItems: CartItem[] = [
    {
        id: '1',
        name: 'BRA',
        price: 135.00,
        qty: 1,
        sku: 'BRA001',
        category: 'Innerwear',
        sector: Sector.TEXTILE,
        stock: 10,
        cost: 100
    },
    {
        id: '2',
        name: 'INSKIRT',
        price: 140.00,
        qty: 1,
        sku: 'INS001',
        category: 'Innerwear',
        sector: Sector.TEXTILE,
        stock: 10,
        cost: 100
    },
    {
        id: '3',
        name: 'INSKIRT',
        price: 175.00,
        qty: 1,
        sku: 'INS002',
        category: 'Innerwear',
        sector: Sector.TEXTILE,
        stock: 10,
        cost: 120
    }
];

const mockSale: Sale = {
    id: 'A42-206704', // Format to yield Cashier A42 and Bill 206704
    date: '2026-01-12T11:31:04', // Matches prompt: 12/01/2026 11:31:04 AM (Assuming MM/DD or DD/MM, prompt says 12/01/2026 likely DD/MM if India)
    items: mockItems,
    total: 450.00,
    customerName: 'KATE',
    customerId: 'CUST001',
    sector: Sector.TEXTILE,
    branchId: 'B001',
    taxMode: 'INCLUSIVE' as TaxMode, // Implicitly inclusive based on math
    status: 'COMPLETED',
    paymentStatus: 'PAID'
};

// --- Test Execution ---

const result = generateReceiptJSON(mockSale, mockTenant, mockBranch);

console.log(JSON.stringify(result, null, 2));
