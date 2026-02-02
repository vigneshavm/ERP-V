import { Expense } from "../../types/finance";

export const expenses: Expense[] = [
    {
        id: "EXP0001",
        expenseNo: "EXP-TEN001-0001",
        date: "2025-12-24",
        category: "Office Supplies",
        amount: 8295,
        paymentMethod: "cash",
        description: "Office supplies purchase",
        tenantId: "TEN001",
        branchId: "BR002",
        status: "PAID",
        sector: "General"
    },
    {
        id: "EXP0002",
        expenseNo: "EXP-TEN001-0002",
        date: "2025-12-25",
        category: "Rent",
        amount: 15000,
        paymentMethod: "bank_transfer",
        description: "Monthly Office Rent",
        tenantId: "TEN001",
        branchId: "BR001",
        status: "PAID",
        sector: "General"
    },
    {
        id: "EXP0003",
        expenseNo: "EXP-TEN001-0003",
        date: "2025-12-26",
        category: "Electricity",
        amount: 2500,
        paymentMethod: "upi",
        description: "December Electricity Bill",
        tenantId: "TEN001",
        branchId: "BR001",
        status: "PAID",
        sector: "General"
    }
];