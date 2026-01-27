import { Estimate } from '../../types/sales';

export const estimates: Estimate[] = [
    {
        id: "EST-TEN001-0001",
        estimateNo: "EST-TEN001-00001",
        customer: "C001-TEN001",
        customerName: "Rajesh Kumar",
        items: [
            {
                name: "Silk Scarf Multi-color",
                quantity: 2,
                price: 799,
                total: 1598,
                sku: "SC-MULTI-BR001"
            }
        ],
        subtotal: 1598,
        discount: 0,
        totalAmount: 1598,
        notes: "Valid for 7 days",
        status: "sent",
        validUntil: "2025-11-20",
        createdAt: "2025-11-13",
        tenantId: "TEN001",
        sector: "Textile"
    },
    {
        id: "EST-TEN001-0002",
        estimateNo: "EST-TEN001-00002",
        customer: "C002-TEN001",
        customerName: "Priya Sharma",
        items: [
            {
                name: "Leather Jacket Brown L",
                quantity: 1,
                price: 5999,
                total: 5999,
                sku: "JK-BROWN-L-BR001"
            }
        ],
        subtotal: 5999,
        discount: 0,
        totalAmount: 5999,
        notes: "Winter collection offer",
        status: "accepted",
        validUntil: "2026-01-09",
        createdAt: "2025-12-25",
        tenantId: "TEN001",
        sector: "Textile"
    }
];