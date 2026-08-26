export interface MockBranch {
    id: string;
    tenant_id: string;
    name: string;
    city: string;
    is_active: boolean;
    sector: string;
    business_type: string;
}

export const branches: MockBranch[] = [
    {
        "id": "BR001",
        "tenant_id": "TEN001",
        "name": "Chennai Main Branch",
        "city": "Chennai",
        "is_active": true,
        "sector": "Textiles",
        "business_type": "TEXTILE"
    },
    {
        "id": "BR002",
        "tenant_id": "TEN001",
        "name": "Madurai Branch",
        "city": "Madurai",
        "is_active": true,
        "sector": "Textiles",
        "business_type": "TEXTILE"
    },
    {
        "id": "BR003",
        "tenant_id": "TEN002",
        "name": "Salem Warehouse",
        "city": "Salem",
        "is_active": true,
        "sector": "FMCG",
        "business_type": "GROCERY"
    },
    {
        "id": "BR004",
        "tenant_id": "TEN003",
        "name": "Coimbatore TechMart",
        "city": "Coimbatore",
        "is_active": true,
        "sector": "Electronics",
        "business_type": "ELECTRONICS"
    }
];