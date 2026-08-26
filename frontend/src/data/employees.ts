export interface MockEmployee {
    id: string;
    tenant_id: string;
    branch_id: string;
    full_name: string;
    email: string;
    role_id: string;
    systemRole?: string;
    is_active: boolean;
    sector: string;
    dept: string;
    role: string;
    joined: string;
    salary: number;
    attend: string;
    status: string;
}

export const employees: MockEmployee[] = [
    {
        "id": "EMP-TEN001-1",
        "tenant_id": "TEN001",
        "branch_id": "BR001",
        "full_name": "Antigravity Super Admin",
        "email": "admin@ten001.com",
        "role_id": "ADMIN",
        "systemRole": "SuperAdmin",
        "is_active": true,
        "sector": "Textiles",
        "dept": "Management",
        "role": "Executive Director",
        "joined": "Jan 2020",
        "salary": 125000,
        "attend": "100%",
        "status": "Present"
    },
    {
        "id": "EMP-TEN001-2",
        "tenant_id": "TEN001",
        "branch_id": "BR002",
        "full_name": "Staff - Madurai Branch",
        "email": "staff1@ten001.com",
        "role_id": "STAFF",
        "is_active": true,
        "sector": "Textiles",
        "dept": "Sales",
        "role": "Branch Manager",
        "joined": "Mar 2022",
        "salary": 45000,
        "attend": "95%",
        "status": "Present"
    },
    {
        "id": "EMP-TEN002-1",
        "tenant_id": "TEN002",
        "branch_id": "BR003",
        "full_name": "Admin - Sri",
        "email": "admin@ten002.com",
        "role_id": "ADMIN",
        "is_active": true,
        "sector": "FMCG",
        "dept": "Operations",
        "role": "Operations Lead",
        "joined": "Jun 2021",
        "salary": 85000,
        "attend": "98%",
        "status": "Present"
    },
    {
        "id": "EMP-TEN003-1",
        "tenant_id": "TEN003",
        "branch_id": "BR004",
        "full_name": "Admin - TechMart",
        "email": "admin@ten003.com",
        "role_id": "ADMIN",
        "is_active": true,
        "sector": "Electronics",
        "dept": "Technical",
        "role": "CTO",
        "joined": "Sep 2023",
        "salary": 95000,
        "attend": "92%",
        "status": "On Leave"
    }
];