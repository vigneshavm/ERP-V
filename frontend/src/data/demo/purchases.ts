import { Purchase } from '../../types/purchase';

export const purchases: Purchase[] = [
    {
        id: "PUR0001",
        purchaseNumber: "PUR-TEN001-0001",
        tenantId: "TEN001",
        vendorId: "SUP001",
        date: "2025-12-10",
        subtotal: 17600,
        taxAmount: 880, // gst
        discountAmount: 0,
        totalAmount: 18480,
        status: "COMPLETED",
        items: [
            {
                productId: "P001", // Mapped from SKU
                productName: "Leather Jacket Brown L (BR001)",
                quantity: 10,
                rate: 1760,
                amount: 17600
            }
        ],
        createdAt: "2025-12-10",
        updatedAt: "2025-12-10",
        sector: "General"
    }
];