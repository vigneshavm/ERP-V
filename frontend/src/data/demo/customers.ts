import { Customer } from "../../types/sales";

export const customers: Customer[] = [
    {
        id: "C001-TEN001",
        tenantId: "TEN001",
        name: "Rajesh Kumar",
        phone: "9876543210",
        email: "rajesh.kumar@email.com",
        address: "123, Main Street, Chennai",
        dues: 2316,
        points: 385,
        tier: "Gold",
        creditBalance: 6672,
        creditLimit: 10000,
        lastPaymentDate: "2025-12-03",
        riskScore: 10,
        totalVisits: 15,
        totalSpent: 45000
    },
    {
        id: "C002-TEN001",
        tenantId: "TEN001",
        name: "Priya Sharma",
        phone: "9876543211",
        email: "priya.sharma@email.com",
        address: "45, Temple Road, Chennai",
        dues: 1964,
        points: 387,
        tier: "Silver",
        creditBalance: 12423,
        creditLimit: 15000,
        lastPaymentDate: "2025-12-23",
        riskScore: 50,
        totalVisits: 8,
        totalSpent: 22000
    },
    {
        id: "C003-TEN001",
        tenantId: "TEN001",
        name: "Amit Patel",
        phone: "9876543212",
        email: "amit.patel@email.com",
        address: "78, Gandhi Road, Chennai",
        dues: 840,
        points: 47,
        tier: "General",
        creditBalance: 8236,
        creditLimit: 20000,
        lastPaymentDate: "2025-11-19",
        riskScore: 10,
        totalVisits: 3,
        totalSpent: 5000
    }
];