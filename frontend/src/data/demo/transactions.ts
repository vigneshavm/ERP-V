import { Transaction } from "../../types/finance";

export const transactions: Transaction[] = [
    {
        id: "TX-TEN001-0001",
        type: "sale",
        amount: 14855,
        date: "2025-12-03",
        paymentMethod: "card",
        description: "Payment for Invoice #SI-TEN001-00001",
        customer: "C001-TEN001",
        invoice: "INV-TEN001-0001",
        tenantId: "TEN001",
        branchId: "BR001",
        sector: "Textile",
        category: "Sale"
    },
    {
        id: "TX-TEN001-0002",
        type: "expense",
        amount: 8295,
        date: "2025-12-24",
        paymentMethod: "cash",
        description: "Office supplies purchase",
        tenantId: "TEN001",
        branchId: "BR002",
        sector: "General",
        category: "Expense"
    },
    {
        id: "TX-TEN001-0003",
        type: "payment",
        amount: 5000,
        date: "2025-12-25",
        paymentMethod: "upi",
        description: "Part payment from Customer",
        customer: "C002-TEN001",
        tenantId: "TEN001",
        branchId: "BR001",
        sector: "Textile",
        category: "Payment In"
    }
];