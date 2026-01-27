import { Invoice } from '../../types/sales';

export const salesInvoices: Invoice[] = [
    {
        id: "INV-TEN001-0001",
        invoiceNo: "SI-TEN001-00001",
        tenantId: "TEN001",
        customer: "C001-TEN001",
        customerName: "Rajesh Kumar", // Helper
        items: [
            {
                item: "P001", // Product ID
                sku: "BL-BLACK-BR001",
                name: "Leather Belt Black (Chennai Main Branch)",
                quantity: 3,
                price: 999,
                tax: 359.64,
                discount: 0,
                total: 3356.64
            }
        ],
        subtotal: 16493,
        tax: 2339.1,
        discount: 0,
        totalAmount: 18832.1,
        paidAmount: 14855,
        creditApplied: 0,
        previousDueAmount: 0,
        paymentStatus: "partial",
        paymentMethod: "card",
        status: "partial",
        createdAt: "2025-12-03"
    },
    {
        id: "INV-TEN001-0002",
        invoiceNo: "SI-TEN001-00002",
        tenantId: "TEN001",
        customer: "C002-TEN001",
        customerName: "Priya Sharma", // Helper
        items: [
            {
                item: "P002",
                sku: "SW-GRAY-XL-BR002",
                name: "Woolen Sweater Gray XL (Madurai Branch)",
                quantity: 3,
                price: 1999,
                tax: 299.85,
                discount: 0,
                total: 6296.85
            }
        ],
        subtotal: 7992,
        tax: 399.6,
        discount: 0,
        totalAmount: 8391.6,
        paidAmount: 8391.6,
        creditApplied: 0,
        previousDueAmount: 0,
        paymentStatus: "paid",
        paymentMethod: "card",
        status: "paid",
        createdAt: "2025-12-13"
    }
];