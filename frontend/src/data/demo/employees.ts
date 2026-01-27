import { Employee } from '../../types/hr';

export const employees: Employee[] = [
    {
        id: "E001",
        tenantId: "TEN001",
        name: "Suresh Kumar",
        role: "Store Manager",
        systemRole: "manager",
        mobile: "9988776655",
        dailyRate: 800,
        wageType: "MONTHLY",
        branchId: "BR001",
        isActive: true,
        joinedDate: "2024-01-15"
    },
    {
        id: "E002",
        tenantId: "TEN001",
        name: "Anita Raj",
        role: "Sales Executive",
        systemRole: "staff",
        mobile: "9988776644",
        dailyRate: 500,
        wageType: "DAILY",
        branchId: "BR001",
        isActive: true,
        joinedDate: "2024-03-10"
    }
];